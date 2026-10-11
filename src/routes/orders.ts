import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authorize } from '../plugins/authorize.js';
import {
  createOrderBodySchema,
  orderParamsSchema,
  updateOrderStatusBodySchema,
} from './orders.schemas.js';

export async function orderRoutes(app: FastifyInstance) {
  app.post('/orders', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createOrderBodySchema.parse(request.body);

    const productIds = [...new Set(body.items.map((item) => item.productId))];

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, available: true },
    });

    if (products.length !== productIds.length) {
      return reply
        .status(400)
        .send({ message: 'Um ou mais produtos não existem ou estão indisponíveis.' });
    }

    let totalCents = 0;

    const items = body.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new Error('Produto não encontrado.');
      }

      totalCents += Math.round(product.price * 100) * item.quantity;

      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    const order = await prisma.order.create({
      data: {
        userId: request.user.sub,
        totalPrice: totalCents / 100,
        items,
        address: body.address,
      },
    });

    return reply.status(201).send({ order });
  });

  app.get('/orders', { preHandler: [app.authenticate] }, async (request) => {
    const where = request.user.role === 'ADMIN' ? {} : { userId: request.user.sub };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { orders };
  });

  app.get('/orders/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = orderParamsSchema.parse(request.params);

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order || (request.user.role !== 'ADMIN' && order.userId !== request.user.sub)) {
      return reply.status(404).send({ message: 'Pedido não encontrado.' });
    }

    return { order };
  });

  app.patch(
    '/orders/:id/status',
    { preHandler: [app.authenticate, authorize('ADMIN')] },
    async (request, reply) => {
      const { id } = orderParamsSchema.parse(request.params);
      const { status } = updateOrderStatusBodySchema.parse(request.body);

      const order = await prisma.order
        .update({ where: { id }, data: { status } })
        .catch(() => null);

      if (!order) {
        return reply.status(404).send({ message: 'Pedido não encontrado.' });
      }

      return { order };
    },
  );
}
