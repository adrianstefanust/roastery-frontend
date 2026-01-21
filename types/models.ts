import type { Role, BatchStatus, LotStatus } from './api'

// IAM Models
export interface User {
  id: string
  email: string
  role: Role
  tenant_id: string
  currency?: string
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  company_name: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  token: string
  user?: User
}

// Inventory Models
export interface GreenCoffeeLot {
  id: string
  tenant_id: string
  lot_number: string
  sku: string
  initial_weight: number
  current_weight: number
  moisture_content: number
  unit_cost_wac: number
  weighted_avg_cost: number
  purchase_cost_per_kg?: number
  status: LotStatus
  received_at: string
  created_at: string
  updated_at: string
}

export interface StockAdjustment {
  id: string
  tenant_id: string
  lot_id: string
  qty_change: number
  reason_code: string
  notes?: string
  adjusted_by: string
  created_at: string
}

// Production Models
export interface RoastBatch {
  id: string
  tenant_id: string
  batch_number: string
  lot_id: string
  weight_in: number
  weight_out?: number
  shrinkage_pct?: number
  status: BatchStatus
  roasted_at?: string
  created_at: string
  updated_at: string
}

export interface QualityControl {
  id: string
  batch_id: string
  aroma: number
  flavor: number
  aftertaste: number
  acidity: number
  body: number
  total_score: number
  notes?: string
  created_at: string
}

// Finance Models
export interface IndirectCost {
  id: string
  tenant_id: string
  month: number
  year: number
  rent: number
  utilities: number
  labor: number
  misc: number
  total_actual: number
  estimated_total: number
  is_closed: boolean
  created_at: string
  updated_at: string
}

export interface HPPReport {
  year: number
  months: MonthlyHPP[]
  total_overhead: number
  total_production_kg: number
  average_hpp: number
}

export interface MonthlyHPP {
  month: number
  overhead: number
  production_kg: number
  hpp_per_kg: number
}

export interface VarianceReport {
  month: number
  year: number
  estimated: number
  actual: number
  variance: number
  variance_pct: number
}

// Purchasing Models
export interface Supplier {
  id: string
  tenant_id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  country?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type POStatus =
  | 'DRAFT'
  | 'SENT'
  | 'CONFIRMED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED'

export interface PurchaseOrder {
  id: string
  tenant_id: string
  po_number: string
  supplier_id: string
  supplier?: Supplier
  status: POStatus
  order_date: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  total_amount: number
  currency: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  tenant_id: string
  po_id: string
  sku: string
  description?: string
  quantity_kg: number
  unit_price: number
  total_price: number
  received_quantity_kg: number
  created_at: string
  updated_at: string
}

export interface POStatusHistory {
  id: string
  tenant_id: string
  po_id: string
  from_status?: POStatus
  to_status: POStatus
  changed_by: string
  notes?: string
  created_at: string
}

export interface ReceivePORequest {
  items: ReceivePOItem[]
  notes?: string
}

export interface ReceivePOItem {
  po_item_id: string
  received_quantity: number
  moisture_content: number
}

// Sales Models
export interface Client {
  id: string
  tenant_id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  shipping_address?: string
  billing_address?: string
  country?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SOStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export interface SalesOrder {
  id: string
  tenant_id: string
  so_number: string
  client_id: string
  client?: Client
  status: SOStatus
  order_date: string
  requested_delivery_date?: string
  actual_delivery_date?: string
  total_amount: number
  currency: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  items?: SalesOrderItem[]
}

export interface SalesOrderItem {
  id: string
  tenant_id: string
  so_id: string
  product_sku: string
  description?: string
  quantity_kg: number
  unit_price: number
  total_price: number
  fulfilled_quantity_kg: number
  created_at: string
  updated_at: string
}

export interface SOStatusHistory {
  id: string
  tenant_id: string
  so_id: string
  from_status?: SOStatus
  to_status: SOStatus
  changed_by: string
  notes?: string
  created_at: string
}

export interface InventoryReservation {
  id: string
  tenant_id: string
  so_id: string
  so_item_id: string
  batch_id: string
  quantity_kg: number
  reserved_at: string
  fulfilled_at?: string
}

export interface ClientSalesStats {
  total_orders: number
  total_amount: number
  active_orders: number
}

// Invoice Models

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE'

export interface PurchaseInvoice {
  id: string
  tenant_id: string
  invoice_number: string
  purchase_order_id?: string
  supplier_id: string
  supplier?: Supplier
  invoice_date: string
  due_date: string
  payment_terms_days: number
  subtotal_amount: number
  tax_amount: number
  total_amount: number
  payment_status: PaymentStatus
  paid_amount: number
  payment_method?: string
  payment_date?: string
  payment_reference?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  items?: PurchaseInvoiceItem[]
}

export interface PurchaseInvoiceItem {
  id: string
  invoice_id: string
  product_sku: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  notes?: string
  created_at: string
}

export interface SalesInvoice {
  id: string
  tenant_id: string
  invoice_number: string
  sales_order_id?: string
  client_id: string
  client?: Client
  invoice_date: string
  due_date: string
  payment_terms_days: number
  subtotal_amount: number
  tax_amount: number
  total_amount: number
  payment_status: PaymentStatus
  paid_amount: number
  payment_method?: string
  payment_date?: string
  payment_reference?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  items?: SalesInvoiceItem[]
}

export interface SalesInvoiceItem {
  id: string
  invoice_id: string
  product_sku: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  notes?: string
  created_at: string
}
