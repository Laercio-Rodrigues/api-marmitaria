import jwt from '@fastify/jwt';
import Fastify from 'fastify';
import { env } from './env.js';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  return app;
}
