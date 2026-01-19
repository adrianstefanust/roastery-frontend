// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// Common Types
export type Role = 'SUPERADMIN' | 'OWNER' | 'ROASTER' | 'ACCOUNTANT'
export type BatchStatus = 'PENDING_ROAST' | 'ROASTED' | 'QC_PASSED' | 'QC_FAILED'
export type LotStatus = 'AVAILABLE' | 'DEPLETED'
