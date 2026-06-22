import { resolvePeriodDays } from "../services/dashboardService.js";
import { getKnownPeriods, refreshSnapshot } from "../services/snapshotService.js";

let timer: NodeJS.Timeout | null = null;
let cycleRunning = false;

function getIntervalMs(): number {
  // Mínimo de 30s para não martelar o Chatwoot por engano de configuração.
  return Math.max(30_000, Number(process.env.SNAPSHOT_REFRESH_MS || 300_000));
}

async function runRefreshCycle(): Promise<void> {
  if (cycleRunning) {
    return; // Ciclo anterior ainda rodando (consulta pesada) — não sobrepõe.
  }
  cycleRunning = true;

  try {
    let periods: number[] = [];
    try {
      periods = await getKnownPeriods();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        "[scheduler] não foi possível listar períodos conhecidos:",
        error instanceof Error ? error.message : String(error),
      );
    }

    if (periods.length === 0) {
      periods = [resolvePeriodDays(undefined)]; // Pelo menos o período padrão.
    }

    for (const period of periods) {
      try {
        await refreshSnapshot(period);
        // eslint-disable-next-line no-console
        console.log(`[scheduler] snapshot do período ${period}d atualizado.`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(
          `[scheduler] falha ao atualizar período ${period}d:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  } finally {
    cycleRunning = false;
  }
}

export function startSnapshotScheduler(): void {
  if (timer) {
    return;
  }

  // Aquecimento inicial em background (não bloqueia o boot do servidor).
  void runRefreshCycle();

  timer = setInterval(() => {
    void runRefreshCycle();
  }, getIntervalMs());

  // eslint-disable-next-line no-console
  console.log(`[scheduler] refresh de snapshots a cada ${Math.round(getIntervalMs() / 1000)}s.`);
}

export function stopSnapshotScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
