import { loadEnvFile } from "./env.js";
import { createApp } from "./app.js";
import { initDb } from "./db/pool.js";
import { startSnapshotScheduler } from "./jobs/snapshotScheduler.js";

loadEnvFile();

const port = Number(process.env.PORT || 3333);
const host = process.env.HOST || "0.0.0.0";

const app = createApp();

app.listen(port, host, async () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running at http://${host}:${port}`);

  try {
    await initDb();
    startSnapshotScheduler();
  } catch (error) {
    // Sem Postgres o dashboard ainda funciona, porém em modo ao vivo (mais lento).
    // eslint-disable-next-line no-console
    console.error(
      "[boot] Postgres indisponível — dashboard servirá em modo ao vivo:",
      error instanceof Error ? error.message : String(error),
    );
  }
});
