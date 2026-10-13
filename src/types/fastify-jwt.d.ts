import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: 'CUSTOMER' | 'ADMIN' | 'COURIER' };
    user: { sub: string; role: 'CUSTOMER' | 'ADMIN' | 'COURIER' };
  }
}
