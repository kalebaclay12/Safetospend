import React, { useState } from 'react';
import { AllocationType, CreateBucketData } from '../types';
import { useSafeToSpend } from '../context/SafeToSpendContext';
import { formatCurrencyInput, parseCurrency } from '../utils/currency';

interface CreateBucketFormProps {
  onComplete: () => void;
}

const CreateBucketForm: React.FC<CreateBucketFormProps> = ({ onComplete }) => {
  const { service, currentAccount, refreshData } = useSafeToSpend();
  const [formData, setFormData] = useState<CreateBucketData>({
    name: '',
    priority: 1,
    allocation_type: AllocationType.NONE,
    allocation_value: 0,
    target_cents: undefined,
    is_bill: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAccount) {
      alert('No account found');
      return;
    }

    if (!formData.name.trim()) {
      alert('Bucket name is required');
      return;
    }

    try {
      service.createBucket(currentAccount.id, formData);
      refreshData();
      onComplete();
      
      // Reset form
      setFormData({
        name: '',
        priority: 1,
        allocation_type: AllocationType.NONE,
        allocation_value: 0,
        target_cents: undefined,
        is_bill: false,
      });
    } catch (error) {
      alert('Error creating bucket');
      console.error(error);
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
    <form onSubmit={handleSubmit} className="create-bucket-form">
      <h3>Create New Bucket</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="bucketName">Bucket Name *</label>
          <input
            id="bucketName"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Rent, Groceries, Emergency Fund"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <input
            id="priority"
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
          <label htmlFor="allocationType">Auto-Allocation</label>
          <select
            id="allocationType"
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
            <label htmlFor="allocationValue">
              {formData.allocation_type === AllocationType.FIXED ? 'Amount ($)' : 'Percentage (%)'}
            </label>
            <input
              id="allocationValue"
              type="number"
              step={formData.allocation_type === AllocationType.FIXED ? "0.01" : "0.1"}
              min="0"
              value={getAllocationDisplayValue()}
              onChange={(e) => handleAllocationValueChange(e.target.value)}
              placeholder={formData.allocation_type === AllocationType.FIXED ? "25.00" : "10.0"}
            />
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="targetAmount">Savings Goal (optional)</label>
          <input
            id="targetAmount"
            type="number"
            step="0.01"
            min="0"
            value={formData.target_cents ? formatCurrencyInput(formData.target_cents) : ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              target_cents: e.target.value ? parseCurrency(e.target.value) : undefined 
            })}
            placeholder="1000.00"
          />
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
        <button type="button" onClick={onComplete} className="secondary">
          Cancel
        </button>
        <button type="submit" className="primary">
          Create Bucket
        </button>
      </div>
    </form>
  );
};

export default CreateBucketForm;