import React, { useState } from 'react';
import { AllocationType, CreateBucketData, Bucket } from '../types';
import { useSafeToSpend } from '../context/SafeToSpendContext';
import { formatCurrencyInput, parseCurrency } from '../utils/currency';

interface EditBucketFormProps {
  bucket: Bucket;
  onComplete: () => void;
  onCancel: () => void;
}

const EditBucketForm: React.FC<EditBucketFormProps> = ({ bucket, onComplete, onCancel }) => {
  const { service, refreshData } = useSafeToSpend();
  const [formData, setFormData] = useState<CreateBucketData>({
    name: bucket.name,
    priority: bucket.priority,
    allocation_type: bucket.allocation_type,
    allocation_value: bucket.allocation_value,
    target_cents: bucket.target_cents,
    is_bill: bucket.is_bill,
    bill_rule: bucket.bill_rule,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Bucket name is required');
      return;
    }

    try {
      const result = service.updateBucket(bucket.id, formData);
      if (result.success) {
        refreshData();
        onComplete();
      } else {
        alert(`Error updating bucket: ${result.error}`);
      }
    } catch (error) {
      alert('Error updating bucket');
      console.error(error);
    }
  };

  const handleDelete = () => {
    if (bucket.balance_cents > 0) {
      alert(`Cannot delete bucket with $${(bucket.balance_cents / 100).toFixed(2)} remaining. Transfer or spend the money first.`);
      return;
    }

    const result = service.deleteBucket(bucket.id);
    if (result.success) {
      refreshData();
      onComplete();
    } else {
      alert(`Error deleting bucket: ${result.error}`);
    }
  };

  const handleAllocationValueChange = (value: string) => {
    if (formData.allocation_type === AllocationType.FIXED) {
      // Convert dollars to cents
      setFormData({ ...formData, allocation_value: parseCurrency(value) });
    } else if (formData.allocation_type === AllocationType.PERCENT) {
      // Store as basis points (percentage * 100)
      const percentage = parseFloat(value) || 0;
      setFormData({ ...formData, allocation_value: Math.round(percentage * 100) });
    }
  };

  const getAllocationDisplayValue = () => {
    if (formData.allocation_type === AllocationType.FIXED) {
      return formatCurrencyInput(formData.allocation_value);
    } else if (formData.allocation_type === AllocationType.PERCENT) {
      return (formData.allocation_value / 100).toFixed(1);
    }
    return '';
  };

  return (
    <form onSubmit={handleSubmit} className="edit-bucket-form">
      <div className="form-header">
        <h3>Edit Bucket: {bucket.name}</h3>
        <div className="bucket-balance-info">
          <span>Current Balance: <strong>${(bucket.balance_cents / 100).toFixed(2)}</strong></span>
          {bucket.locked_cents > 0 && (
            <span>Protected: <strong>${(bucket.locked_cents / 100).toFixed(2)}</strong></span>
          )}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="editBucketName">Bucket Name *</label>
          <input
            id="editBucketName"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Rent, Groceries, Emergency Fund"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="editPriority">Priority</label>
          <input
            id="editPriority"
            type="number"
            min="1"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
          />
          <small>Lower number = higher priority for allocation</small>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="editAllocationType">Auto-Allocation</label>
          <select
            id="editAllocationType"
            value={formData.allocation_type}
            onChange={(e) => setFormData({ 
              ...formData, 
              allocation_type: e.target.value as AllocationType,
              allocation_value: 0
            })}
          >
            <option value={AllocationType.NONE}>No automatic allocation</option>
            <option value={AllocationType.FIXED}>Fixed amount per deposit</option>
            <option value={AllocationType.PERCENT}>Percentage of deposits</option>
          </select>
        </div>

        {formData.allocation_type !== AllocationType.NONE && (
          <div className="form-group">
            <label htmlFor="editAllocationValue">
              {formData.allocation_type === AllocationType.FIXED ? 'Amount ($)' : 'Percentage (%)'}
            </label>
            <input
              id="editAllocationValue"
              type="text"
              value={getAllocationDisplayValue()}
              onChange={(e) => handleAllocationValueChange(e.target.value)}
              placeholder={formData.allocation_type === AllocationType.FIXED ? "500" : "15"}
            />
            <small>
              {formData.allocation_type === AllocationType.FIXED 
                ? "Enter dollar amount (e.g., 500 for $500 per deposit)" 
                : "Enter percentage (e.g., 15 for 15% of deposits)"
              }
            </small>
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="editTargetAmount">Savings Goal (optional)</label>
          <input
            id="editTargetAmount"
            type="text"
            value={formData.target_cents ? (formData.target_cents / 100).toString() : ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setFormData({ ...formData, target_cents: undefined });
              } else {
                const parsed = parseFloat(value);
                if (!isNaN(parsed) && parsed >= 0) {
                  setFormData({ ...formData, target_cents: Math.round(parsed * 100) });
                }
              }
            }}
            placeholder="5000"
          />
          <small>Enter your savings goal in dollars (e.g., 5000 for $5,000)</small>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_bill}
              onChange={(e) => setFormData({ ...formData, is_bill: e.target.checked })}
            />
            <span>This is a recurring bill</span>
          </label>
          <small>Bill buckets can auto-lock after payments</small>
        </div>
      </div>

      <div className="form-actions">
        <div className="primary-actions">
          <button type="button" onClick={onCancel} className="secondary">
            Cancel
          </button>
          <button type="submit" className="primary">
            Save Changes
          </button>
        </div>
        
        <div className="danger-zone">
          {!showDeleteConfirm ? (
            <button 
              type="button" 
              onClick={() => setShowDeleteConfirm(true)} 
              className="danger"
              disabled={bucket.balance_cents > 0}
            >
              Delete Bucket
            </button>
          ) : (
            <div className="delete-confirm">
              <p>Are you sure? This cannot be undone.</p>
              <button type="button" onClick={handleDelete} className="danger">
                Yes, Delete
              </button>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="secondary">
                Cancel
              </button>
            </div>
          )}
          {bucket.balance_cents > 0 && (
            <small className="delete-warning">
              Cannot delete bucket with money. Transfer or spend funds first.
            </small>
          )}
        </div>
      </div>
    </form>
  );
};

export default EditBucketForm;