import React, { useState } from 'react';
import { SafeToSpendProvider } from './context/SafeToSpendContext';
import AppHeader from './components/AppHeader';
import BottomNavigation from './components/BottomNavigation';
import Dashboard from './components/Dashboard';
import DepositForm from './components/DepositForm';
import QuickActions from './components/QuickActions';
import BucketList from './components/BucketList';
import { useSafeToSpend } from './context/SafeToSpendContext';
import './App.css';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { accountSummary } = useSafeToSpend();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'add':
        return accountSummary ? <DepositForm accountId={accountSummary.account.id} /> : null;
      case 'spend':
        return accountSummary ? (
          <QuickActions 
            accountId={accountSummary.account.id} 
            availableAmount={accountSummary.available_to_spend_cents}
            buckets={accountSummary.buckets.filter(b => b.status === 'NORMAL')}
          />
        ) : null;
      case 'analytics':
        return accountSummary ? <BucketList buckets={accountSummary.buckets} /> : null;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <AppHeader title="Safe to Spend" />
      <main className="app-content">
        {renderContent()}
      </main>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

function App() {
  return (
    <SafeToSpendProvider>
      <AppContent />
    </SafeToSpendProvider>
  );
}

export default App;