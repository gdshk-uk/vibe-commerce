/**
 * Order and OrderItem entity types for Vibe Commerce platform
 * Protected by Row Level Security (RLS)
 */

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  billingAddress: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: string;
  billingAddress: string;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingAddress?: string;
  billingAddress?: string;
}

export type OrderResponse = Order;
export type OrderListResponse = {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
};
