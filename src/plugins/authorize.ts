import type { FastifyReply, FastifyRequest } from 'fastify';

export function authorize(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: string };

    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({ message: 'Acesso negado.' });
    }
  };
}
