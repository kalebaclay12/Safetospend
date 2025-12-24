import React, { useState } from 'react';
import { useSafeToSpend } from '../context/SafeToSpendContext';
import { parseCurrency, formatCurrency } from '../utils/currency';
import { PlusCircle, DollarSign } from 'lucide-react';

interface DepositFormProps {
  accountId: string;
}

const DepositForm: React.FC<DepositFormProps> = ({ accountId }) => {
  const { service, refreshData, accountSummary } = useSafeToSpend();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setShowAllocation] = useState(false);

  const buckets = accountSummary?.buckets || [];
  const bucketsWithAllocation = buckets.filter(b => b.allocation_type !== 'NONE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount.trim()) {
      alert('Please enter an amount');
      return;
    }

    const cents = parseCurrency(amount);
    if (cents <= 0) {
      alert('Please enter a valid amount greater than $0');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = service.deposit({
        account_id: accountId,
        cents,
        description: description.trim() || undefined
      });

      if (result.success) {
        refreshData();
        setAmount('');
        setDescription('');
        alert(`Successfully added ${formatCurrency(cents)} to your account!`);
        
        // Show allocation breakdown if there were allocations
        if (result.events.length > 1) {
          setShowAllocation(true);
          setTimeout(() => setShowAllocation(false), 5000);
        }
      } else {
        alert('Failed to process deposit');
      }
    } catch (error) {
      alert('Error processing deposit');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewAllocation = () => {
    if (!amount.trim()) return null;
    
    const depositCents = parseCurrency(amount);
    if (depositCents <= 0) return null;

    let remaining = depositCents;
    const allocations: Array<{bucket: any, amount: number}> = [];

    // First pass: FIXED allocations
    for (const bucket of bucketsWithAllocation.filter(b => b.allocation_type === 'FIXED')) {
      const allocateAmount = Math.min(bucket.allocation_value, remaining);
      if (allocateAmount > 0) {
        allocations.push({ bucket, amount: allocateAmount });
        remaining -= allocateAmount;
      }
    }

    // Second pass: PERCENT allocations
    for (const bucket of bucketsWithAllocation.filter(b => b.allocation_type === 'PERCENT')) {
      const allocateAmount = Math.floor((bucket.allocation_value / 10000) * remaining);
      if (allocateAmount > 0) {
        allocations.push({ bucket, amount: allocateAmount });
        remaining -= allocateAmount;
      }
    }

    return { allocations, remaining };
  };

  const allocationPreview = previewAllocation();

  return (
    <div className="deposit-form">
      <div className="card">
        <div className="form-header">
          <DollarSign size={24} />
          <h2>Add Money to Account</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="amount">Amount ($)</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paycheck, gift, etc."
              disabled={isSubmitting}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="primary full-width">
            <PlusCircle size={20} />
            {isSubmitting ? 'Processing...' : 'Add Money'}
          </button>
        </form>

        {allocationPreview && allocationPreview.allocations.length > 0 && (
          <div className="allocation-preview">
            <h4>Automatic Allocation Preview</h4>
            <div className="allocation-list">
              {allocationPreview.allocations.map(({ bucket, amount }, index) => (
                <div key={index} className="allocation-item">
                  <span className="bucket-name">{bucket.name}</span>
                  <span className="allocation-amount">{formatCurrency(amount)}</span>
                </div>
              ))}
              {allocationPreview.remaining > 0 && (
                <div className="allocation-item remaining">
                  <span className="bucket-name">Unallocated</span>
                  <span className="allocation-amount">{formatCurrency(allocationPreview.remaining)}</span>
                </div>
              )}
            </div>
            <div className="allocation-total">
              <strong>Total: {formatCurrency(parseCurrency(amount))}</strong>
            </div>
          </div>
        )}

        {bucketsWithAllocation.length === 0 && (
          <div className="no-allocation-notice">
            <p>💡 <strong>Tip:</strong> Create buckets with auto-allocation to automatically organize your money when you add it!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositForm;