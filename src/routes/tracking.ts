import type { FastifyInstance } from 'fastify';
import { publishOrderEvent, subscribeToOrder } from '../lib/order-events.js';
import { prisma } from '../lib/prisma.js';
import { authorize } from '../plugins/authorize.js';
import {
  assignCourierBodySchema,
  courierLocationBodySchema,
  orderParamsSchema,
} from './orders.schemas.js';

export async function trackingRoutes(app: FastifyInstance) {
  app.patch(
    '/orders/:id/courier',
    { preHandler: [app.authenticate, authorize('ADMIN')] },
    async (request, reply) => {
      const { id } = orderParamsSchema.parse(request.params);
      const { courierId } = assignCourierBodySchema.parse(request.body);

      const courier = await prisma.user.findFirst({
        where: { id: courierId, role: 'COURIER' },
      });

      if (!courier) {
        return reply.status(400).send({ message: 'Entregador não encontrado.' });
      }

      const order = await prisma.order
        .update({ where: { id }, data: { courierId } })
        .catch(() => null);

      if (!order) {
        return reply.status(404).send({ message: 'Pedido não encontrado.' });
      }

      return { order };
    },
  );

  app.post(
    '/orders/:id/location',
    { preHandler: [app.authenticate, authorize('COURIER')] },
    async (request, reply) => {
      const { id } = orderParamsSchema.parse(request.params);
      const { latitude, longitude } = courierLocationBodySchema.parse(request.body);

      const order = await prisma.order.findUnique({ where: { id } });

      if (!order || order.courierId !== request.user.sub) {
        return reply.status(404).send({ message: 'Pedido não encontrado.' });
      }

      if (order.status !== 'OUT_FOR_DELIVERY') {
        return reply.status(409).send({ message: 'O pedido não está em rota de entrega.' });
      }

      const updatedAt = new Date();

      await prisma.order.update({
        where: { id },
        data: {
          courierLatitude: latitude,
          courierLongitude: longitude,
          courierUpdatedAt: updatedAt,
        },
      });

      publishOrderEvent(id, {
        type: 'location',
        latitude,
        longitude,
        updatedAt: updatedAt.toISOString(),
      });

      return reply.status(204).send();
    },
  );

  app.get('/orders/:id/stream', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = orderParamsSchema.parse(request.params);

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order || (request.user.role !== 'ADMIN' && order.userId !== request.user.sub)) {
      return reply.status(404).send({ message: 'Pedido não encontrado.' });
    }

    reply.hijack();

    for (const [name, value] of Object.entries(reply.getHeaders())) {
      if (value !== undefined) {
        reply.raw.setHeader(name, value);
      }
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const send = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const hasCourierPosition = order.courierLatitude !== null && order.courierLongitude !== null;

    send('snapshot', {
      status: order.status,
      destination: {
        latitude: order.address.latitude,
        longitude: order.address.longitude,
      },
      courier: hasCourierPosition
        ? {
            latitude: order.courierLatitude,
            longitude: order.courierLongitude,
            updatedAt: order.courierUpdatedAt,
          }
        : null,
    });

    const unsubscribe = subscribeToOrder(id, (event) => send(event.type, event));

    const heartbeat = setInterval(() => reply.raw.write(': ping\n\n'), 25_000);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });
}
