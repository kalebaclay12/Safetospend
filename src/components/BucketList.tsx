import React, { useState } from 'react';
import { Bucket, BucketStatus } from '../types';
import { formatCurrency } from '../utils/currency';
import { useSafeToSpend } from '../context/SafeToSpendContext';
import CreateBucketForm from './CreateBucketForm';
import EditBucketForm from './EditBucketForm';
import { 
  Lock, 
  Unlock, 
  Shield, 
  Clock, 
  CheckCircle,
  PlusCircle,
  AlertTriangle,
  Target,
  Edit3
} from 'lucide-react';

interface BucketListProps {
  buckets: Bucket[];
}

const BucketList: React.FC<BucketListProps> = ({ buckets }) => {
  const { service, refreshData } = useSafeToSpend();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);

  const getStatusIcon = (status: BucketStatus) => {
    switch (status) {
      case BucketStatus.NORMAL:
        return <CheckCircle className="status-icon normal" size={20} />;
      case BucketStatus.LOCKED:
        return <Lock className="status-icon locked" size={20} />;
      case BucketStatus.COOLDOWN:
        return <Clock className="status-icon cooldown" size={20} />;
      case BucketStatus.UNLOCK_REQUESTED:
        return <AlertTriangle className="status-icon pending" size={20} />;
      default:
        return <CheckCircle className="status-icon normal" size={20} />;
    }
  };

  const handleLockFunds = (bucketId: string, amount: number) => {
    const result = service.lockBucketFunds(bucketId, amount);
    if (result.success) {
      refreshData();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleUnlockFunds = (bucketId: string) => {
    const result = service.unlockBucketFunds(bucketId);
    if (result.success) {
      refreshData();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const getProgressPercentage = (bucket: Bucket) => {
    if (!bucket.target_cents || bucket.target_cents === 0) return 0;
    return Math.min((bucket.balance_cents / bucket.target_cents) * 100, 100);
  };

  return (
    <div className="bucket-list">
      <div className="bucket-header">
        <h2>Money Buckets</h2>
        <button 
          className="create-bucket-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <PlusCircle size={20} />
          {showCreateForm ? 'Cancel' : 'New Bucket'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card create-bucket-card">
          <CreateBucketForm onComplete={() => setShowCreateForm(false)} />
        </div>
      )}

      {editingBucket && (
        <div className="card edit-bucket-card">
          <EditBucketForm 
            bucket={editingBucket}
            onComplete={() => setEditingBucket(null)} 
            onCancel={() => setEditingBucket(null)}
          />
        </div>
      )}

      {buckets.length === 0 ? (
        <div className="card empty-buckets">
          <h3>No buckets yet</h3>
          <p>Create your first bucket to organize your money and start protecting funds!</p>
        </div>
      ) : (
        <div className="buckets-grid">
          {buckets.map((bucket) => (
            <div key={bucket.id} className={`card bucket ${bucket.status.toLowerCase()}`}>
              <div className="bucket-header-info">
                <div className="bucket-name">
                  <h3>{bucket.name}</h3>
                  {bucket.is_bill && <span className="bill-badge">Bill</span>}
                </div>
                <div className="bucket-status">
                  {getStatusIcon(bucket.status)}
                  <span className="status-text">{bucket.status}</span>
                </div>
              </div>

              <div className="bucket-balance">
                <div className="balance-row">
                  <span>Total:</span>
                  <strong>{formatCurrency(bucket.balance_cents)}</strong>
                </div>
                <div className="balance-row">
                  <span>Available:</span>
                  <strong className="available-amount">
                    {formatCurrency(bucket.balance_cents - bucket.locked_cents)}
                  </strong>
                </div>
                {bucket.locked_cents > 0 && (
                  <div className="balance-row">
                    <span>Protected:</span>
                    <strong className="locked-amount">
                      {formatCurrency(bucket.locked_cents)}
                    </strong>
                  </div>
                )}
              </div>

              {bucket.target_cents && (
                <div className="bucket-progress">
                  <div className="progress-header">
                    <Target size={16} />
                    <span>Goal: {formatCurrency(bucket.target_cents)}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${getProgressPercentage(bucket)}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {Math.round(getProgressPercentage(bucket))}% complete
                  </span>
                </div>
              )}

              <div className="bucket-actions">
                {bucket.status === BucketStatus.NORMAL && bucket.balance_cents > bucket.locked_cents && (
                  <button
                    className="action-button lock"
                    onClick={() => {
                      const availableAmount = bucket.balance_cents - bucket.locked_cents;
                      const amountToLock = prompt(
                        `How much do you want to protect? (Available: ${formatCurrency(availableAmount)})`
                      );
                      if (amountToLock) {
                        const cents = Math.round(parseFloat(amountToLock) * 100);
                        if (cents > 0 && cents <= availableAmount) {
                          handleLockFunds(bucket.id, cents);
                        } else {
                          alert('Invalid amount');
                        }
                      }
                    }}
                  >
                    <Shield size={16} />
                    Protect Funds
                  </button>
                )}

                {(bucket.status === BucketStatus.LOCKED || bucket.status === BucketStatus.COOLDOWN) && bucket.locked_cents > 0 && (
                  <button
                    className="action-button unlock"
                    onClick={() => handleUnlockFunds(bucket.id)}
                  >
                    <Unlock size={16} />
                    Release All
                  </button>
                )}

                {bucket.status === BucketStatus.COOLDOWN && bucket.cooldown_ends_at && (
                  <div className="cooldown-info">
                    <Clock size={14} />
                    <span>Cooldown until {new Date(bucket.cooldown_ends_at).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="bucket-management">
                  <button
                    className="action-button edit"
                    onClick={() => setEditingBucket(bucket)}
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                </div>
              </div>

              <div className="bucket-allocation">
                <small>
                  Priority: {bucket.priority} | 
                  {bucket.allocation_type === 'FIXED' 
                    ? ` ${formatCurrency(bucket.allocation_value)} per deposit`
                    : bucket.allocation_type === 'PERCENT' 
                    ? ` ${(bucket.allocation_value / 100).toFixed(1)}% of deposits`
                    : ' No auto-allocation'
                  }
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BucketList;