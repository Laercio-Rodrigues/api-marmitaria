import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; role: "CUSTOMER" | "ADMIN" };
    user: { sub: string; role: "CUSTOMER" | "ADMIN" };
  }
}
