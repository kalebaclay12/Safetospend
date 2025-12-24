import React from 'react';
import { useSafeToSpend } from '../context/SafeToSpendContext';
import { formatCurrency } from '../utils/currency';
import BucketList from './BucketList';
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Shield, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { accountSummary, currentAccount } = useSafeToSpend();
  const [showBalance, setShowBalance] = React.useState(true);

  if (!currentAccount || !accountSummary) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <h3>Setting up your account...</h3>
      </div>
    );
  }

  const { account, available_to_spend_cents, total_locked_cents, buckets } = accountSummary;

  return (
    <div className="dashboard">
      {/* Main Balance Card */}
      <div className="balance-card">
        <div className="balance-header">
          <span className="account-label">Safe to Spend Account</span>
          <div className="account-type">CHECKING</div>
        </div>
        
        <div className="main-balance">
          <div className="balance-label">Total Balance</div>
          <div className="balance-display">
            {showBalance ? formatCurrency(account.balance_cents) : '••••••'}
          </div>
        </div>
        
        <div className="balance-breakdown">
          <div className="breakdown-item">
            <div className="breakdown-label">Available</div>
            <div className="breakdown-amount available-amount">
              {showBalance ? formatCurrency(available_to_spend_cents) : '••••'}
            </div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-label">Protected</div>
            <div className="breakdown-amount locked-amount">
              {showBalance ? formatCurrency(total_locked_cents) : '••••'}
            </div>
          </div>
          <button 
            className="balance-toggle"
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-grid">
        <div className="action-item">
          <div className="action-icon send">
            <ArrowUpRight size={24} />
          </div>
          <span>Send</span>
        </div>
        <div className="action-item">
          <div className="action-icon receive">
            <ArrowDownLeft size={24} />
          </div>
          <span>Add Money</span>
        </div>
        <div className="action-item">
          <div className="action-icon protect">
            <Shield size={24} />
          </div>
          <span>Protect</span>
        </div>
        <div className="action-item">
          <div className="action-icon analytics">
            <TrendingUp size={24} />
          </div>
          <span>Analytics</span>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="section-header">
        <h3>Your Money Buckets</h3>
        <span className="bucket-count">{buckets.length} buckets</span>
      </div>

      {/* Bucket List */}
      <BucketList buckets={buckets.slice(0, 3)} />
      
      {buckets.length > 3 && (
        <div className="view-all-buckets">
          <button className="view-all-button">
            View All Buckets ({buckets.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;