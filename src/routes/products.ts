import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authorize } from '../plugins/authorize.js';
import {
  createProductBodySchema,
  productParamsSchema,
  updateProductBodySchema,
} from './products.schemas.js';

export async function productRoutes(app: FastifyInstance) {
  app.get('/products', async () => {
    const products = await prisma.product.findMany({
      where: { available: true },
      orderBy: { name: 'asc' },
    });

    return { products };
  });

  app.get('/products/:id', async (request, reply) => {
    const { id } = productParamsSchema.parse(request.params);

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return reply.status(404).send({ message: 'Produto não encontrado.' });
    }

    return { product };
  });

  app.post(
    '/products',
    { preHandler: [app.authenticate, authorize('ADMIN')] },
    async (request, reply) => {
      const body = createProductBodySchema.parse(request.body);

      const product = await prisma.product.create({ data: body });

      return reply.status(201).send({ product });
    },
  );

  app.put(
    '/products/:id',
    { preHandler: [app.authenticate, authorize('ADMIN')] },
    async (request, reply) => {
      const { id } = productParamsSchema.parse(request.params);
      const body = updateProductBodySchema.parse(request.body);

      const product = await prisma.product.update({ where: { id }, data: body }).catch(() => null);

      if (!product) {
        return reply.status(404).send({ message: 'Produto não encontrado.' });
      }

      return { product };
    },
  );

  app.delete(
    '/products/:id',
    { preHandler: [app.authenticate, authorize('ADMIN')] },
    async (request, reply) => {
      const { id } = productParamsSchema.parse(request.params);

      const product = await prisma.product
        .update({ where: { id }, data: { available: false } })
        .catch(() => null);

      if (!product) {
        return reply.status(404).send({ message: 'Produto não encontrado.' });
      }

      return reply.status(204).send();
    },
  );
}
