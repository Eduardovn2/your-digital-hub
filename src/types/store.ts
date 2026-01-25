export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  layout_style: string;
  show_banner: boolean;
  show_categories: boolean;
  is_active: boolean;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export type StoreInsert = Omit<Store, "id" | "created_at" | "updated_at">;
export type StoreUpdate = Partial<Omit<StoreInsert, "owner_id">>;

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  status: OrderStatus;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  notes: string | null;
  created_at: string;
}

export type OrderInsert = Omit<Order, "id" | "created_at" | "updated_at" | "items">;
export type OrderItemInsert = Omit<OrderItem, "id" | "created_at">;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

// Delivery Zones
export interface DeliveryZone {
  id: string;
  store_id: string;
  name: string;
  cep_prefix: string | null;
  fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DeliveryZoneInsert = Omit<DeliveryZone, "id" | "created_at" | "updated_at">;
export type DeliveryZoneUpdate = Partial<Omit<DeliveryZoneInsert, "store_id">>;

// Store Hours
export interface StoreHours {
  id: string;
  store_id: string;
  opening_time: string;
  closing_time: string;
  days_open: number[];
  is_auto_control: boolean;
  created_at: string;
  updated_at: string;
}

export type StoreHoursInsert = Omit<StoreHours, "id" | "created_at" | "updated_at">;
export type StoreHoursUpdate = Partial<Omit<StoreHoursInsert, "store_id">>;

// Printer Settings
export interface PrinterSettings {
  id: string;
  store_id: string;
  printer_ip: string;
  printer_port: number;
  is_enabled: boolean;
  paper_width: number;
  created_at: string;
  updated_at: string;
}

export type PrinterSettingsInsert = Omit<PrinterSettings, "id" | "created_at" | "updated_at">;
export type PrinterSettingsUpdate = Partial<Omit<PrinterSettingsInsert, "store_id">>;

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];
