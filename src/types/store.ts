// --- STORE / LOJA ---
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
  
  // Endereço (Mantido campo único para compatibilidade)
  address: string | null;
  
  // Novos Campos de Endereço Detalhado
  zip_code: string | null;
  street: string | null;
  street_number: string | null;
  neighborhood: string | null;
  city: string | null;
  complement: string | null;

  // Estilização
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  layout_style: string;
  show_banner: boolean;
  show_categories: boolean;
  
  // Integração Instagram
  instagram: string | null;

  // Integração Mercado Pago
  mp_access_token: string | null;
  mp_public_key: string | null;
  mp_refresh_token: string | null;

  // Status
  is_active: boolean;
  is_open: boolean;
  created_at: string;
  updated_at: string;
  status: string;
  expires_at: string | null;
}

export type StoreInsert = Omit<Store, "id" | "created_at" | "updated_at">;
export type StoreUpdate = Partial<Omit<StoreInsert, "owner_id">>;

// --- ORDERS / PEDIDOS ---
export type OrderStatus = 
  | 'pending' 
  | 'paid' 
  | 'accepted' 
  | 'preparing' 
  | 'ready' 
  | 'delivering' 
  | 'completed' 
  | 'cancelled';

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
  
  // Propriedades de Pagamento (Cruciais para Impressão)
  payment_method: string; 
  change_for: number | null;

  // ID do pagamento no Mercado Pago (necessário para estornos)
  mp_payment_id: string | null;

  // Identificador do dispositivo do cliente
  device_id: string | null;

  created_at: string;
  updated_at: string;
  items?: OrderItem[]; // Agora aponta para a interface abaixo
}

export interface OrderItem {
  id?: string; // Opcional se vier do JSONB direto
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
}

export type OrderInsert = Omit<Order, "id" | "created_at" | "updated_at" | "items">;

// --- CONFIGURAÇÕES VISUAIS DE STATUS ---
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  accepted: 'Aceito',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivering: 'Em entrega',
  completed: 'Concluído',
  cancelled: 'Cancelado'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  ready: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivering: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

// --- OUTROS ---
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
export type DeliveryZoneUpdate = Partial<DeliveryZoneInsert>;

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
export type PrinterSettingsUpdate = Partial<PrinterSettingsInsert>;

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];