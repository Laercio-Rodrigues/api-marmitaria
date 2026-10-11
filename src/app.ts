import jwt from "@fastify/jwt";
import Fastify from "fastify";
import { env } from "./env.js";
import { authenticatePlugin } from "./plugins/authenticate.js";
import { authRoutes } from "./routes/auth.js";
import { orderRoutes } from "./routes/orders.js";
import { productRoutes } from "./routes/products.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  app.register(authRoutes);
  app.register(authenticatePlugin);
  app.register(productRoutes)
  app.register(orderRoutes)

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}
