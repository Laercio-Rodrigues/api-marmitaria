import { EventEmitter } from 'node:events';

export type OrderEvent =
  | { type: 'location'; latitude: number; longitude: number; updatedAt: string }
  | { type: 'status'; status: string };

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export function publishOrderEvent(orderId: string, event: OrderEvent) {
  emitter.emit(orderId, event);
}

export function subscribeToOrder(orderId: string, listener: (event: OrderEvent) => void) {
  emitter.on(orderId, listener);
  return () => emitter.off(orderId, listener);
}
