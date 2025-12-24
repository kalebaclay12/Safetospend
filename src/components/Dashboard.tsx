import React, { useState } from 'react';
import { useSafeToSpend } from '../context/SafeToSpendContext';
import { formatCurrency } from '../utils/currency';
import BucketList from './BucketList';
import DepositForm from './DepositForm';
import QuickActions from './QuickActions';
import { DollarSign, Shield, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { accountSummary, currentAccount } = useSafeToSpend();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'spend'>('overview');

  if (!currentAccount || !accountSummary) {
    return (
      <div className="card">
        <div className="loading">
          <AlertCircle size={48} />
          <h2>Loading your account...</h2>
          <p>Setting up your Safe to Spend account</p>
        </div>
      </div>
    );
  }

  const { account, available_to_spend_cents, total_locked_cents, buckets } = accountSummary;

  return (
    <div className="dashboard">
      {/* Main Balance Display */}
      <div className="card balance-card">
        <div className="balance-section">
          <div className="balance-item">
            <div className="balance-icon">
              <DollarSign size={32} />
            </div>
            <div className="balance-info">
              <h3>Account Balance</h3>
              <div className="balance-display">
                {formatCurrency(account.balance_cents)}
              </div>
            </div>
          </div>
          
          <div className="balance-divider"></div>
          
          <div className="balance-item">
            <div className="balance-icon available">
              <DollarSign size={32} />
            </div>
            <div className="balance-info">
              <h3>Available to Spend</h3>
              <div className="balance-display available-amount">
                {formatCurrency(available_to_spend_cents)}
              </div>
            </div>
          </div>
          
          <div className="balance-divider"></div>
          
          <div className="balance-item">
            <div className="balance-icon locked">
              <Shield size={32} />
            </div>
            <div className="balance-info">
              <h3>Protected Funds</h3>
              <div className="balance-display locked-amount">
                {formatCurrency(total_locked_cents)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="balance-summary">
          <p>
            You have <strong>{formatCurrency(available_to_spend_cents)}</strong> safe to spend out of{' '}
            <strong>{formatCurrency(account.balance_cents)}</strong> total
          </p>
        </div>
      </div>

      {/* Action Tabs */}
      <div className="action-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}
        >
          Add Money
        </button>
        <button 
          className={`tab-button ${activeTab === 'spend' ? 'active' : ''}`}
          onClick={() => setActiveTab('spend')}
        >
          Spend
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <BucketList buckets={buckets} />
          </div>
        )}
        
        {activeTab === 'deposit' && (
          <div className="deposit-tab">
            <DepositForm accountId={account.id} />
          </div>
        )}
        
        {activeTab === 'spend' && (
          <div className="spend-tab">
            <QuickActions 
              accountId={account.id} 
              availableAmount={available_to_spend_cents}
              buckets={buckets.filter(b => b.status === 'NORMAL')}
            />
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="card quick-stats">
        <h3>Quick Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <strong>{buckets.length}</strong>
            <span>Total Buckets</span>
          </div>
          <div className="stat-item">
            <strong>{buckets.filter(b => b.status === 'LOCKED' || b.status === 'COOLDOWN').length}</strong>
            <span>Protected Buckets</span>
          </div>
          <div className="stat-item">
            <strong>{buckets.filter(b => b.is_bill).length}</strong>
            <span>Bill Buckets</span>
          </div>
          <div className="stat-item">
            <strong>{Math.round(total_locked_cents / Math.max(account.balance_cents, 1) * 100)}%</strong>
            <span>Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;