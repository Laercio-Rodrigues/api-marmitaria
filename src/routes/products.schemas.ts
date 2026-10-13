import { z } from 'zod';

export const createProductBodySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  imageUrl: z.url().optional(),
});

export const updateProductBodySchema = createProductBodySchema.partial();

export const productParamsSchema = z.object({
  id: z.string().length(24),
});

export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
