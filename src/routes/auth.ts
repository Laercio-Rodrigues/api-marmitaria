import bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { loginBodySchema, registerBodySchema } from './auth.schemas.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = registerBodySchema.parse(request.body);

    const userExists = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (userExists) {
      return reply.status(409).send({ message: 'E-mail já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: passwordHash,
      },
    });

    const token = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: '7d' });

    return reply.status(201).send({ token });
  });

  app.post('/auth/login', async (request, reply) => {
    const body = loginBodySchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return reply.status(401).send({ message: 'Credenciais inválidas.' });
    }

    const passwordMatches = await bcrypt.compare(body.password, user.password);

    if (!passwordMatches) {
      return reply.status(401).send({ message: 'Credenciais inválidas.' });
    }

    const token = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: '7d' });

    return reply.send({ token });
  });
}
