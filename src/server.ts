import { buildApp } from './app.js';
import { env } from './env.js';

const app = buildApp();
app
  .listen({ port: env.PORT, host: '0.0.0.0' })
  .then(() => {
    console.log(`Servidor rodando na porta ${env.PORT}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
