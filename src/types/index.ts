// Core enums and types for Safe to Spend application

export enum BucketStatus {
  NORMAL = 'NORMAL',
  LOCKED = 'LOCKED',
  COOLDOWN = 'COOLDOWN',
  UNLOCK_REQUESTED = 'UNLOCK_REQUESTED'
}

export enum AllocationType {
  FIXED = 'FIXED',
  PERCENT = 'PERCENT',
  NONE = 'NONE'
}

export enum LedgerEventType {
  DEPOSIT = 'DEPOSIT',
  ALLOCATE = 'ALLOCATE',
  PURCHASE = 'PURCHASE',
  BUCKET_SPEND = 'BUCKET_SPEND',
  TRANSFER = 'TRANSFER',
  LOCK = 'LOCK',
  RELEASE = 'RELEASE',
  EMERGENCY_UNLOCK = 'EMERGENCY_UNLOCK',
  BILL_PAYOUT = 'BILL_PAYOUT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface Account {
  id: string;
  balance_cents: number;
  created_at: Date;
  updated_at: Date;
}

export interface BillRule {
  cadence: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY';
  next_due_at: Date | null;
  payout_amount_cents: number;
  autopay_enabled: boolean;
}

export interface Bucket {
  id: string;
  account_id: string;
  name: string;
  priority: number; // 1 = highest priority
  allocation_type: AllocationType;
  allocation_value: number; // cents if FIXED, basis points if PERCENT
  target_cents?: number;
  balance_cents: number;
  locked_cents: number;
  status: BucketStatus;
  cooldown_ends_at: Date | null;
  is_bill: boolean;
  bill_rule?: BillRule;
  created_at: Date;
  updated_at: Date;
}

export interface LedgerEvent {
  id: string;
  account_id: string;
  bucket_id?: string;
  type: LedgerEventType;
  cents: number;
  created_at: Date;
  metadata?: Record<string, any>;
}

export interface PurchaseMetadata {
  merchant?: string;
  category?: string;
  bucket_ids?: string[];
  description?: string;
}

export interface TransferMetadata {
  from_bucket_id: string;
  to_bucket_id: string;
  description?: string;
}

export interface LockMetadata {
  unlock_requested_at?: Date;
  reason?: string;
}

// Derived calculations
export interface AccountSummary {
  account: Account;
  buckets: Bucket[];
  available_to_spend_cents: number;
  total_locked_cents: number;
  recent_events: LedgerEvent[];
}

// UI State types
export interface CreateBucketData {
  name: string;
  priority: number;
  allocation_type: AllocationType;
  allocation_value: number;
  target_cents?: number;
  is_bill: boolean;
  bill_rule?: Partial<BillRule>;
}

export interface DepositData {
  account_id: string;
  cents: number;
  description?: string;
}

export interface PurchaseData {
  account_id: string;
  cents: number;
  merchant?: string;
  category?: string;
  bucket_ids?: string[]; // for bucket-only purchases
  purchase_mode: 'GENERAL' | 'BUCKET_ONLY';
}