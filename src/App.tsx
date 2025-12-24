import { SafeToSpendProvider } from './context/SafeToSpendContext';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <SafeToSpendProvider>
      <div className="App">
        <header className="app-header">
          <h1>💰 Safe to Spend</h1>
          <p>Smart money management with virtual buckets</p>
        </header>
        <main>
          <Dashboard />
        </main>
      </div>
    </SafeToSpendProvider>
  );
}

export default App;