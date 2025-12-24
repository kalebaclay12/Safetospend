import React, { useState } from 'react';
import { Bucket } from '../types';
import { useSafeToSpend } from '../context/SafeToSpendContext';
import { parseCurrency, formatCurrency } from '../utils/currency';
import { CreditCard, ShoppingCart, Target } from 'lucide-react';

interface QuickActionsProps {
  accountId: string;
  availableAmount: number;
  buckets: Bucket[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  accountId, 
  availableAmount, 
  buckets 
}) => {
  const { service, refreshData } = useSafeToSpend();
  const [purchaseMode, setPurchaseMode] = useState<'GENERAL' | 'BUCKET_ONLY'>('GENERAL');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePurchase = async (e: React.FormEvent) => {
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

    if (purchaseMode === 'BUCKET_ONLY' && selectedBuckets.length === 0) {
      alert('Please select at least one bucket for bucket-only purchases');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = service.purchase({
        account_id: accountId,
        cents,
        merchant: merchant.trim() || undefined,
        category: category.trim() || undefined,
        bucket_ids: purchaseMode === 'BUCKET_ONLY' ? selectedBuckets : undefined,
        purchase_mode: purchaseMode
      });

      if (result.success) {
        refreshData();
        setAmount('');
        setMerchant('');
        setCategory('');
        setSelectedBuckets([]);
        alert(`Purchase of ${formatCurrency(cents)} completed successfully!`);
      } else {
        alert(`Purchase failed: ${result.error}`);
      }
    } catch (error) {
      alert('Error processing purchase');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableForBuckets = () => {
    return selectedBuckets.reduce((total, bucketId) => {
      const bucket = buckets.find(b => b.id === bucketId);
      return total + (bucket ? bucket.balance_cents - bucket.locked_cents : 0);
    }, 0);
  };

  const maxSpendable = purchaseMode === 'GENERAL' 
    ? availableAmount 
    : getAvailableForBuckets();

  return (
    <div className="quick-actions">
      <div className="card">
        <div className="form-header">
          <CreditCard size={24} />
          <h2>Record a Purchase</h2>
        </div>

        <div className="purchase-mode-tabs">
          <button 
            className={`mode-tab ${purchaseMode === 'GENERAL' ? 'active' : ''}`}
            onClick={() => setPurchaseMode('GENERAL')}
          >
            <ShoppingCart size={16} />
            General Spending
          </button>
          <button 
            className={`mode-tab ${purchaseMode === 'BUCKET_ONLY' ? 'active' : ''}`}
            onClick={() => setPurchaseMode('BUCKET_ONLY')}
          >
            <Target size={16} />
            Bucket Spending
          </button>
        </div>

        <div className="spending-info">
          {purchaseMode === 'GENERAL' ? (
            <div className="info-card">
              <p>💳 <strong>General Spending:</strong> Uses your available balance excluding protected funds</p>
              <p><strong>Available:</strong> {formatCurrency(availableAmount)}</p>
            </div>
          ) : (
            <div className="info-card">
              <p>🎯 <strong>Bucket Spending:</strong> Only spends from selected buckets</p>
              <p><strong>Available from selected buckets:</strong> {formatCurrency(maxSpendable)}</p>
            </div>
          )}
        </div>

        <form onSubmit={handlePurchase}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="purchaseAmount">Amount ($)</label>
              <input
                id="purchaseAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxSpendable / 100}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25.50"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="merchant">Merchant (optional)</label>
              <input
                id="merchant"
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Target, Amazon, etc."
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category (optional)</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Select category...</option>
              <option value="groceries">Groceries</option>
              <option value="dining">Dining Out</option>
              <option value="gas">Gas/Transportation</option>
              <option value="shopping">Shopping</option>
              <option value="bills">Bills/Utilities</option>
              <option value="entertainment">Entertainment</option>
              <option value="healthcare">Healthcare</option>
              <option value="other">Other</option>
            </select>
          </div>

          {purchaseMode === 'BUCKET_ONLY' && (
            <div className="form-group">
              <label>Select Buckets to Spend From</label>
              <div className="bucket-selection">
                {buckets.map(bucket => {
                  const availableInBucket = bucket.balance_cents - bucket.locked_cents;
                  return (
                    <label key={bucket.id} className="bucket-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedBuckets.includes(bucket.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBuckets([...selectedBuckets, bucket.id]);
                          } else {
                            setSelectedBuckets(selectedBuckets.filter(id => id !== bucket.id));
                          }
                        }}
                        disabled={availableInBucket <= 0 || isSubmitting}
                      />
                      <div className="bucket-info">
                        <span className="bucket-name">{bucket.name}</span>
                        <span className="bucket-available">
                          {formatCurrency(availableInBucket)} available
                        </span>
                      </div>
                    </label>
                  );
                })}
                {buckets.length === 0 && (
                  <p>No buckets available for spending. Create some buckets first!</p>
                )}
              </div>
            </div>
          )}

          {maxSpendable <= 0 ? (
            <div className="no-funds-warning">
              <p>⚠️ No funds available for spending in this mode.</p>
              {purchaseMode === 'GENERAL' && (
                <p>All your money is currently protected. Unlock some funds to spend.</p>
              )}
              {purchaseMode === 'BUCKET_ONLY' && (
                <p>Select buckets with available funds or add money to your buckets.</p>
              )}
            </div>
          ) : (
            <button type="submit" disabled={isSubmitting} className="primary full-width">
              <CreditCard size={20} />
              {isSubmitting ? 'Processing...' : `Record Purchase - ${formatCurrency(parseCurrency(amount) || 0)}`}
            </button>
          )}
        </form>

        <div className="spending-tips">
          <h4>💡 Spending Tips</h4>
          <ul>
            <li><strong>General Spending:</strong> Quick and easy, respects your protected funds</li>
            <li><strong>Bucket Spending:</strong> More control, ensures you're spending from the right categories</li>
            <li><strong>Protected funds</strong> are automatically excluded from general spending</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;