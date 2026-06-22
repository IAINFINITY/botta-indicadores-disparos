import type { DashboardData } from "../types/dashboard.js";
import { getDashboardData, resolvePeriodDays } from "./dashboardService.js";
import { query } from "../db/pool.js";

interface SnapshotRow {
  payload: DashboardData;
  created_at: Date;
}

function getTtlMs(): number {
  return Math.max(0, Number(process.env.SNAPSHOT_TTL_MS || 300_000));
}

function getRetention(): number {
  return Math.max(1, Math.floor(Number(process.env.SNAPSHOT_RETENTION || 200)));
}

// Dedupe: evita recomputar o mesmo período em paralelo (ex.: scheduler + request stale ao mesmo tempo).
const inFlight = new Map<number, Promise<DashboardData>>();

async function getLatestSnapshot(periodDays: number): Promise<SnapshotRow | null> {
  const result = await query<SnapshotRow>(
    `SELECT payload, created_at
     FROM dashboard_snapshots
     WHERE period_days = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [periodDays],
  );
  return result.rows[0] ?? null;
}

async function saveSnapshot(periodDays: number, payload: DashboardData): Promise<void> {
  await query(
    `INSERT INTO dashboard_snapshots (period_days, payload) VALUES ($1, $2::jsonb)`,
    [periodDays, JSON.stringify(payload)],
  );
}

/** Mantém apenas os `keep` snapshots mais recentes do período. */
async function pruneSnapshots(periodDays: number, keep: number): Promise<void> {
  await query(
    `DELETE FROM dashboard_snapshots
     WHERE period_days = $1
       AND id NOT IN (
         SELECT id FROM dashboard_snapshots
         WHERE period_days = $1
         ORDER BY created_at DESC
         LIMIT $2
       )`,
    [periodDays, keep],
  );
}

/**
 * Recomputa o dashboard (consulta pesada no Chatwoot), grava como novo snapshot e poda os antigos.
 * Concorrências para o mesmo período compartilham a mesma promise.
 */
export function refreshSnapshot(periodDays: number): Promise<DashboardData> {
  const existing = inFlight.get(periodDays);
  if (existing) {
    return existing;
  }

  const task = (async () => {
    const data = await getDashboardData({ days: periodDays });
    await saveSnapshot(periodDays, data);
    await pruneSnapshots(periodDays, getRetention()).catch((error) => {
      // eslint-disable-next-line no-console
      console.warn(
        `[snapshot] falha ao podar histórico do período ${periodDays}d:`,
        error instanceof Error ? error.message : String(error),
      );
    });
    return data;
  })();

  inFlight.set(periodDays, task);
  return task.finally(() => {
    inFlight.delete(periodDays);
  });
}

/**
 * Serve o dashboard a partir do snapshot mais recente (instantâneo).
 * - Sem snapshot (cold): computa agora.
 * - Snapshot velho (> TTL): devolve o cache e atualiza em background (stale-while-revalidate).
 * - Banco indisponível: cai para cálculo ao vivo (degradado, porém funcional).
 */
export async function getDashboardSnapshot(days?: number): Promise<DashboardData> {
  const periodDays = resolvePeriodDays(days);

  let latest: SnapshotRow | null;
  try {
    latest = await getLatestSnapshot(periodDays);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      "[snapshot] leitura do Postgres falhou, calculando ao vivo:",
      error instanceof Error ? error.message : String(error),
    );
    return getDashboardData({ days: periodDays });
  }

  if (!latest) {
    // Primeira vez para este período — precisa computar agora.
    return refreshSnapshot(periodDays);
  }

  const ageMs = Date.now() - new Date(latest.created_at).getTime();
  if (ageMs > getTtlMs()) {
    // Devolve o cache imediatamente e dispara atualização em background.
    void refreshSnapshot(periodDays).catch((error) => {
      // eslint-disable-next-line no-console
      console.warn(
        `[snapshot] atualização em background do período ${periodDays}d falhou:`,
        error instanceof Error ? error.message : String(error),
      );
    });
  }

  return latest.payload;
}

/** Períodos que já têm snapshot — usados pelo scheduler para manter tudo aquecido. */
export async function getKnownPeriods(): Promise<number[]> {
  const result = await query<{ period_days: number }>(
    `SELECT DISTINCT period_days FROM dashboard_snapshots ORDER BY period_days`,
  );
  return result.rows.map((row) => Number(row.period_days));
}
