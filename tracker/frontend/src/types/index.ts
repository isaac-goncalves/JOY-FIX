export type ControllerType = 'JOYCON_L' | 'JOYCON_R' | 'DUALSENSE' | 'XBOX' | 'PRO_CONTROLLER' | 'OUTRO';
export type ControllerStatus = 'STOCK' | 'MAINTENANCE' | 'READY' | 'SOLD' | 'SCRAP';
export type PartType = 'ANALOG' | 'BUTTON' | 'SHELL' | 'CABLE' | 'OTHER';
export type TransactionType = 'PURCHASE' | 'SALE';

export interface Controller {
  id: number;
  serial_or_label: string;
  type: ControllerType;
  color: string;
  status: ControllerStatus;
  purchase_price: number;
  purchase_date: string;
  seller_info: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ControllerDetail extends Controller {
  maintenance: MaintenanceLog[];
  transactions: Transaction[];
  total_maintenance_cost: number;
}

export interface Part {
  id: number;
  name: string;
  type: PartType;
  quantity: number;
  unit_cost: number;
  supplier: string;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface PartsUsed {
  part_id: number;
  qty: number;
  cost: number;
}

export interface MaintenanceLog {
  id: number;
  controller_id: number;
  date: string;
  description: string;
  parts_used: string;
  labor_cost: number;
  total_cost: number;
  technician: string;
  created_at: string;
  serial_or_label?: string;
  controller_type?: ControllerType;
}

export interface Transaction {
  id: number;
  controller_id: number;
  type: TransactionType;
  date: string;
  value: number;
  buyer_seller_info: string;
  notes: string;
  created_at: string;
  serial_or_label?: string;
}

export interface DashboardStats {
  total_controllers: number;
  total_parts_stock: number;
  total_invested: number;
  total_sales: number;
  total_purchases: number;
  total_parts_cost: number;
  profit: number;
  status_breakdown: { status: string; count: number }[];
  low_stock_parts: Part[];
}

export interface MonthlyProfit {
  month: string;
  sales: number;
  purchases: number;
}

export interface TypeCount {
  type: string;
  count: number;
}

export const CONTROLLER_TYPE_LABELS: Record<ControllerType, string> = {
  JOYCON_L: 'Joy-Con L',
  JOYCON_R: 'Joy-Con R',
  DUALSENSE: 'DualSense',
  XBOX: 'Xbox',
  PRO_CONTROLLER: 'Pro Controller',
  OUTRO: 'Outro',
};

export const STATUS_LABELS: Record<ControllerStatus, string> = {
  STOCK: 'Em Estoque',
  MAINTENANCE: 'Em Manutenção',
  READY: 'Pronto',
  SOLD: 'Vendido',
  SCRAP: 'Descartado',
};

export const STATUS_COLORS: Record<ControllerStatus, string> = {
  STOCK: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  READY: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SOLD: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  SCRAP: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const PART_TYPE_LABELS: Record<PartType, string> = {
  ANALOG: 'Analógico',
  BUTTON: 'Botão',
  SHELL: 'Carcaça',
  CABLE: 'Cabo',
  OTHER: 'Outro',
};
