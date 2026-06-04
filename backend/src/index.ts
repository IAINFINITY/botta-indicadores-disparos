import { loadEnvFile } from "./env.js";
import { createApp } from "./app.js";

loadEnvFile();

const port = Number(process.env.PORT || 3333);
const host = process.env.HOST || "0.0.0.0";

const app = createApp();

app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running at http://${host}:${port}`);
});
