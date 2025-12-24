import { v4 as uuidv4 } from 'uuid';
import {
  Account,
  Bucket,
  LedgerEvent,
  AccountSummary,
  CreateBucketData,
  DepositData,
  PurchaseData,
  BucketStatus,
  AllocationType,
  LedgerEventType,
  PurchaseMetadata,
  LockMetadata
} from '../types';

export class SafeToSpendService {
  private accounts: Map<string, Account> = new Map();
  private buckets: Map<string, Bucket> = new Map();
  private ledgerEvents: LedgerEvent[] = [];

  // Account Management
  createAccount(): Account {
    const account: Account = {
      id: uuidv4(),
      balance_cents: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.accounts.set(account.id, account);
    this.saveToStorage();
    return account;
  }

  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  // Bucket Management
  createBucket(accountId: string, data: CreateBucketData): Bucket {
    const bucket: Bucket = {
      id: uuidv4(),
      account_id: accountId,
      name: data.name,
      priority: data.priority,
      allocation_type: data.allocation_type,
      allocation_value: data.allocation_value,
      target_cents: data.target_cents,
      balance_cents: 0,
      locked_cents: 0,
      status: BucketStatus.NORMAL,
      cooldown_ends_at: null,
      is_bill: data.is_bill,
      bill_rule: data.bill_rule as any,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.buckets.set(bucket.id, bucket);
    this.saveToStorage();
    return bucket;
  }

  getBucketsForAccount(accountId: string): Bucket[] {
    return Array.from(this.buckets.values())
      .filter(bucket => bucket.account_id === accountId)
      .sort((a, b) => a.priority - b.priority);
  }

  getBucket(bucketId: string): Bucket | undefined {
    return this.buckets.get(bucketId);
  }

  updateBucket(bucketId: string, updates: Partial<CreateBucketData>): { success: boolean; error?: string } {
    const bucket = this.buckets.get(bucketId);
    if (!bucket) {
      return { success: false, error: 'Bucket not found' };
    }

    // Update bucket properties
    if (updates.name !== undefined) bucket.name = updates.name;
    if (updates.priority !== undefined) bucket.priority = updates.priority;
    if (updates.allocation_type !== undefined) bucket.allocation_type = updates.allocation_type;
    if (updates.allocation_value !== undefined) bucket.allocation_value = updates.allocation_value;
    if (updates.target_cents !== undefined) bucket.target_cents = updates.target_cents;
    if (updates.is_bill !== undefined) bucket.is_bill = updates.is_bill;
    if (updates.bill_rule !== undefined) bucket.bill_rule = updates.bill_rule as any;
    
    bucket.updated_at = new Date();

    const adjustmentEvent: LedgerEvent = {
      id: uuidv4(),
      account_id: bucket.account_id,
      bucket_id: bucketId,
      type: LedgerEventType.ADJUSTMENT,
      cents: 0, // No monetary change for metadata updates
      created_at: new Date(),
      metadata: { 
        type: 'bucket_update',
        updates: updates,
        reason: 'User updated bucket settings'
      }
    };
    this.ledgerEvents.push(adjustmentEvent);

    this.saveToStorage();
    return { success: true };
  }

  deleteBucket(bucketId: string): { success: boolean; error?: string; transferredAmount?: number } {
    const bucket = this.buckets.get(bucketId);
    if (!bucket) {
      return { success: false, error: 'Bucket not found' };
    }

    if (bucket.balance_cents > 0) {
      return { 
        success: false, 
        error: `Cannot delete bucket with ${(bucket.balance_cents / 100).toFixed(2)} remaining. Transfer funds first.` 
      };
    }

    // Remove bucket
    this.buckets.delete(bucketId);

    const adjustmentEvent: LedgerEvent = {
      id: uuidv4(),
      account_id: bucket.account_id,
      bucket_id: bucketId,
      type: LedgerEventType.ADJUSTMENT,
      cents: 0,
      created_at: new Date(),
      metadata: { 
        type: 'bucket_deleted',
        bucket_name: bucket.name,
        reason: 'User deleted bucket'
      }
    };
    this.ledgerEvents.push(adjustmentEvent);

    this.saveToStorage();
    return { success: true };
  }

  transferBetweenBuckets(fromBucketId: string, toBucketId: string, amountCents: number): { success: boolean; error?: string } {
    const fromBucket = this.buckets.get(fromBucketId);
    const toBucket = this.buckets.get(toBucketId);

    if (!fromBucket || !toBucket) {
      return { success: false, error: 'One or both buckets not found' };
    }

    if (fromBucket.account_id !== toBucket.account_id) {
      return { success: false, error: 'Cannot transfer between different accounts' };
    }

    const availableAmount = fromBucket.balance_cents - fromBucket.locked_cents;
    if (amountCents > availableAmount) {
      return { success: false, error: 'Insufficient unlocked funds in source bucket' };
    }

    // Transfer funds
    fromBucket.balance_cents -= amountCents;
    toBucket.balance_cents += amountCents;
    fromBucket.updated_at = new Date();
    toBucket.updated_at = new Date();

    const transferEvent: LedgerEvent = {
      id: uuidv4(),
      account_id: fromBucket.account_id,
      type: LedgerEventType.TRANSFER,
      cents: amountCents,
      created_at: new Date(),
      metadata: {
        from_bucket_id: fromBucketId,
        to_bucket_id: toBucketId,
        from_bucket_name: fromBucket.name,
        to_bucket_name: toBucket.name,
        description: `Transfer from ${fromBucket.name} to ${toBucket.name}`
      }
    };
    this.ledgerEvents.push(transferEvent);

    this.saveToStorage();
    return { success: true };
  }

  // Core Financial Operations
  deposit(data: DepositData): { success: boolean; events: LedgerEvent[] } {
    const account = this.accounts.get(data.account_id);
    if (!account) {
      return { success: false, events: [] };
    }

    const events: LedgerEvent[] = [];
    
    // 1. Add deposit to account balance
    account.balance_cents += data.cents;
    account.updated_at = new Date();

    const depositEvent: LedgerEvent = {
      id: uuidv4(),
      account_id: data.account_id,
      type: LedgerEventType.DEPOSIT,
      cents: data.cents,
      created_at: new Date(),
      metadata: { description: data.description }
    };
    events.push(depositEvent);
    this.ledgerEvents.push(depositEvent);

    // 2. Allocate to buckets by priority
    const buckets = this.getBucketsForAccount(data.account_id);
    let remainingToAllocate = data.cents;

    // First pass: FIXED allocations
    for (const bucket of buckets) {
      if (remainingToAllocate <= 0) break;
      
      if (bucket.allocation_type === AllocationType.FIXED) {
        const allocateAmount = Math.min(bucket.allocation_value, remainingToAllocate);
        if (allocateAmount > 0) {
          bucket.balance_cents += allocateAmount;
          bucket.updated_at = new Date();
          remainingToAllocate -= allocateAmount;

          const allocateEvent: LedgerEvent = {
            id: uuidv4(),
            account_id: data.account_id,
            bucket_id: bucket.id,
            type: LedgerEventType.ALLOCATE,
            cents: allocateAmount,
            created_at: new Date(),
            metadata: { allocation_type: 'FIXED' }
          };
          events.push(allocateEvent);
          this.ledgerEvents.push(allocateEvent);
        }
      }
    }

    // Second pass: PERCENT allocations (on remaining amount)
    for (const bucket of buckets) {
      if (remainingToAllocate <= 0) break;
      
      if (bucket.allocation_type === AllocationType.PERCENT) {
        const allocateAmount = Math.floor((bucket.allocation_value / 10000) * remainingToAllocate);
        if (allocateAmount > 0) {
          bucket.balance_cents += allocateAmount;
          bucket.updated_at = new Date();
          remainingToAllocate -= allocateAmount;

          const allocateEvent: LedgerEvent = {
            id: uuidv4(),
            account_id: data.account_id,
            bucket_id: bucket.id,
            type: LedgerEventType.ALLOCATE,
            cents: allocateAmount,
            created_at: new Date(),
            metadata: { allocation_type: 'PERCENT', percentage: bucket.allocation_value }
          };
          events.push(allocateEvent);
          this.ledgerEvents.push(allocateEvent);
        }
      }
    }

    this.saveToStorage();
    return { success: true, events };
  }

  purchase(data: PurchaseData): { success: boolean; error?: string; events: LedgerEvent[] } {
    const account = this.accounts.get(data.account_id);
    if (!account) {
      return { success: false, error: 'Account not found', events: [] };
    }

    if (account.balance_cents < data.cents) {
      return { success: false, error: 'Insufficient account balance', events: [] };
    }

    const events: LedgerEvent[] = [];

    if (data.purchase_mode === 'GENERAL') {
      // General spend: check available_to_spend
      const summary = this.getAccountSummary(data.account_id);
      if (!summary || summary.available_to_spend_cents < data.cents) {
        return { success: false, error: 'Insufficient available funds (locked funds cannot be spent)', events: [] };
      }

      // Deduct from account
      account.balance_cents -= data.cents;
      account.updated_at = new Date();

      const purchaseEvent: LedgerEvent = {
        id: uuidv4(),
        account_id: data.account_id,
        type: LedgerEventType.PURCHASE,
        cents: data.cents,
        created_at: new Date(),
        metadata: {
          merchant: data.merchant,
          category: data.category,
          purchase_mode: 'GENERAL'
        } as PurchaseMetadata
      };
      events.push(purchaseEvent);
      this.ledgerEvents.push(purchaseEvent);

    } else {
      // Bucket-only spend
      if (!data.bucket_ids || data.bucket_ids.length === 0) {
        return { success: false, error: 'No buckets specified for bucket-only purchase', events: [] };
      }

      const buckets = data.bucket_ids.map(id => this.buckets.get(id)).filter(Boolean) as Bucket[];
      const normalBuckets = buckets.filter(b => b.status === BucketStatus.NORMAL);
      
      const totalAvailableInBuckets = normalBuckets.reduce((sum, bucket) => 
        sum + (bucket.balance_cents - bucket.locked_cents), 0);

      if (totalAvailableInBuckets < data.cents) {
        return { success: false, error: 'Insufficient funds in specified buckets', events: [] };
      }

      // Deduct from account and buckets
      account.balance_cents -= data.cents;
      account.updated_at = new Date();

      let remainingToSpend = data.cents;
      for (const bucket of normalBuckets) {
        if (remainingToSpend <= 0) break;
        
        const availableInBucket = bucket.balance_cents - bucket.locked_cents;
        const spendFromBucket = Math.min(availableInBucket, remainingToSpend);
        
        if (spendFromBucket > 0) {
          bucket.balance_cents -= spendFromBucket;
          bucket.updated_at = new Date();
          remainingToSpend -= spendFromBucket;

          const bucketSpendEvent: LedgerEvent = {
            id: uuidv4(),
            account_id: data.account_id,
            bucket_id: bucket.id,
            type: LedgerEventType.BUCKET_SPEND,
            cents: spendFromBucket,
            created_at: new Date(),
            metadata: {
              merchant: data.merchant,
              category: data.category,
              purchase_mode: 'BUCKET_ONLY'
            } as PurchaseMetadata
          };
          events.push(bucketSpendEvent);
          this.ledgerEvents.push(bucketSpendEvent);
        }
      }
    }

    this.saveToStorage();
    return { success: true, events };
  }

  // Lock/Unlock Operations
  lockBucketFunds(bucketId: string, lockAmountCents: number): { success: boolean; error?: string } {
    const bucket = this.buckets.get(bucketId);
    if (!bucket) {
      return { success: false, error: 'Bucket not found' };
    }

    const maxLockable = bucket.balance_cents - bucket.locked_cents;
    if (lockAmountCents > maxLockable) {
      return { success: false, error: 'Cannot lock more than available balance' };
    }

    bucket.locked_cents += lockAmountCents;
    bucket.status = BucketStatus.COOLDOWN;
    bucket.cooldown_ends_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour cooldown
    bucket.updated_at = new Date();

    const lockEvent: LedgerEvent = {
      id: uuidv4(),
      account_id: bucket.account_id,
      bucket_id: bucketId,
      type: LedgerEventType.LOCK,
      cents: lockAmountCents,
      created_at: new Date(),
      metadata: {
        reason: 'User initiated lock'
      } as LockMetadata
    };
    this.ledgerEvents.push(lockEvent);

    this.saveToStorage();
    return { success: true };
  }

  unlockBucketFunds(bucketId: string, unlockAmountCents?: number): { success: boolean; error?: string } {
    const bucket = this.buckets.get(bucketId);
    if (!bucket) {
      return { success: false, error: 'Bucket not found' };
    }

    const amountToUnlock = unlockAmountCents || bucket.locked_cents;
    if (amountToUnlock > bucket.locked_cents) {
      return { success: false, error: 'Cannot unlock more than locked amount' };
    }

    bucket.locked_cents -= amountToUnlock;
    if (bucket.locked_cents === 0) {
      bucket.status = BucketStatus.NORMAL;
      bucket.cooldown_ends_at = null;
    }
    bucket.updated_at = new Date();

    const releaseEvent: LedgerEvent = {
      id: uuidv4(),
      account_id: bucket.account_id,
      bucket_id: bucketId,
      type: LedgerEventType.RELEASE,
      cents: amountToUnlock,
      created_at: new Date(),
      metadata: {
        reason: 'User initiated unlock'
      } as LockMetadata
    };
    this.ledgerEvents.push(releaseEvent);

    this.saveToStorage();
    return { success: true };
  }

  // Summary and Calculations
  getAccountSummary(accountId: string): AccountSummary | null {
    const account = this.accounts.get(accountId);
    if (!account) return null;

    const buckets = this.getBucketsForAccount(accountId);
    const total_locked_cents = buckets.reduce((sum, bucket) => sum + bucket.locked_cents, 0);
    const available_to_spend_cents = account.balance_cents - total_locked_cents;

    const recent_events = this.ledgerEvents
      .filter(event => event.account_id === accountId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 10);

    return {
      account,
      buckets,
      available_to_spend_cents,
      total_locked_cents,
      recent_events
    };
  }

  // Persistence
  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('safetospend_accounts', JSON.stringify(Array.from(this.accounts.entries())));
      localStorage.setItem('safetospend_buckets', JSON.stringify(Array.from(this.buckets.entries())));
      localStorage.setItem('safetospend_ledger', JSON.stringify(this.ledgerEvents));
    }
  }

  loadFromStorage() {
    if (typeof window !== 'undefined') {
      const accountsData = localStorage.getItem('safetospend_accounts');
      const bucketsData = localStorage.getItem('safetospend_buckets');
      const ledgerData = localStorage.getItem('safetospend_ledger');

      if (accountsData) {
        const accountEntries = JSON.parse(accountsData);
        this.accounts = new Map(accountEntries.map(([id, account]: [string, any]) => [
          id, 
          { ...account, created_at: new Date(account.created_at), updated_at: new Date(account.updated_at) }
        ]));
      }

      if (bucketsData) {
        const bucketEntries = JSON.parse(bucketsData);
        this.buckets = new Map(bucketEntries.map(([id, bucket]: [string, any]) => [
          id,
          { 
            ...bucket, 
            created_at: new Date(bucket.created_at), 
            updated_at: new Date(bucket.updated_at),
            cooldown_ends_at: bucket.cooldown_ends_at ? new Date(bucket.cooldown_ends_at) : null
          }
        ]));
      }

      if (ledgerData) {
        this.ledgerEvents = JSON.parse(ledgerData).map((event: any) => ({
          ...event,
          created_at: new Date(event.created_at)
        }));
      }
    }
  }
}