import { z } from 'zod';

export const createOrderBodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().length(24),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1),
  address: z.object({
    street: z.string().min(2),
    number: z.string().min(1),
    district: z.string().min(2),
    city: z.string().min(2),
    complement: z.string().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

export const orderParamsSchema = z.object({
  id: z.string().length(24),
});

export const updateOrderStatusBodySchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]),
});

export const assignCourierBodySchema = z.object({
  courierId: z.string().length(24),
});

export const courierLocationBodySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
