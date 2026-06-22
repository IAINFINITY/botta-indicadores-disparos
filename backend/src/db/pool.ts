import pg from "pg";
import type { Pool as PgPool, PoolClient, QueryResult, QueryResultRow } from "pg";

const { Pool } = pg;

let pool: PgPool | null = null;

function getConnectionString(): string {
  const url = String(process.env.DATABASE_URL || "").trim();
  if (!url) {
    throw new Error("DATABASE_URL não configurada — necessária para os snapshots do dashboard.");
  }
  return url;
}

export function getPool(): PgPool {
  if (!pool) {
    pool = new Pool({
      connectionString: getConnectionString(),
      max: Number(process.env.PG_POOL_MAX || 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    // Evita que um erro em conexão ociosa derrube o processo.
    pool.on("error", (error) => {
      // eslint-disable-next-line no-console
      console.error("[db] erro inesperado no pool do Postgres:", error.message);
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params as never[]);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Garante que o banco está acessível e que o schema de snapshots existe.
 * Faz algumas tentativas porque o Postgres pode ainda estar subindo no boot do compose.
 */
export async function initDb(retries = 10, retryDelayMs = 2_000): Promise<void> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    let client: PoolClient | null = null;
    try {
      client = await getPool().connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS dashboard_snapshots (
          id          BIGSERIAL PRIMARY KEY,
          period_days INTEGER NOT NULL,
          payload     JSONB NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_dashboard_snapshots_period_created
        ON dashboard_snapshots (period_days, created_at DESC)
      `);
      // eslint-disable-next-line no-console
      console.log("[db] Postgres conectado e schema de snapshots pronto.");
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.warn(`[db] tentativa ${attempt}/${retries} de conectar ao Postgres falhou: ${message}`);
      if (attempt < retries) {
        await delay(retryDelayMs);
      }
    } finally {
      client?.release();
    }
  }

  throw new Error(
    `Não foi possível inicializar o Postgres após ${retries} tentativas: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
