# Safe to Spend 💰

A smart personal finance application that helps you manage money with virtual "buckets" while maintaining one real checking account. Built with React, TypeScript, and modern web technologies.

## ✨ Features

### Core Concept
- **One Real Account**: Single checking account with virtual bucket overlay
- **Available to Spend**: Smart calculation showing what's truly safe to spend
- **Protected Funds**: Lock money in buckets to prevent casual spending
- **Automatic Allocation**: Deposits flow into buckets based on your priorities

### Key Features
- 🏦 **Single Account Management**: All money stays in one real account
- 📊 **Smart Dashboard**: Clear view of total balance vs. available to spend
- 🪣 **Virtual Buckets**: Organize money by purpose (rent, groceries, savings, etc.)
- 🔒 **Fund Protection**: Lock money with cooldown periods to prevent impulse unlocking
- 💸 **Two Spending Modes**: General spending (respects locks) or bucket-specific spending
- 📈 **Goal Tracking**: Set savings targets for buckets with progress visualization
- 🔄 **Auto-Allocation**: Fixed amounts or percentages automatically allocated on deposits
- 📋 **Full Audit Trail**: Complete transaction history with event sourcing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation
```bash
# Clone the repository
git clone https://github.com/kalebaclay12/Safetospend.git
cd Safetospend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### First Time Setup
1. Open the app in your browser (usually `http://localhost:3001`)
2. The app will automatically create your first account
3. Start by creating some buckets for different purposes
4. Add money using the "Add Money" tab to see automatic allocation in action

## 🎯 How It Works

### The "Available to Spend" Calculation
```
Available to Spend = Total Account Balance - All Protected/Locked Funds
```

This ensures you never accidentally spend money you've earmarked for important purposes.

### Bucket System
1. **Create Buckets**: Set up categories like "Rent", "Groceries", "Emergency Fund"
2. **Set Priorities**: Lower numbers get allocated money first
3. **Configure Auto-Allocation**: 
   - Fixed amounts (e.g., $500 to rent every deposit)
   - Percentages (e.g., 20% to savings)
4. **Protect Important Money**: Lock funds in buckets to prevent casual spending

### Spending Modes
- **General Spending**: Uses available balance, automatically respects protected funds
- **Bucket-Only Spending**: Only spend from specific buckets you choose

### Lock/Cooldown System
- Lock money in buckets to protect it
- Cooldown period prevents immediate unlocking (prevents impulse decisions)
- Emergency unlock available when needed

## 🛠️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Lucide React** for beautiful icons
- **Modern CSS** with flexbox/grid layouts

### Data Management
- **Local Storage**: Data persists in browser (client-side demo)
- **Event Sourcing**: All transactions recorded as immutable events
- **Real-time Updates**: UI updates immediately as you make changes

### Core Models
- **Account**: Your main checking account
- **Buckets**: Virtual containers for organizing money
- **LedgerEvents**: Immutable transaction history
- **Business Rules**: Allocation logic, spending constraints, lock mechanisms

## 📱 Usage Guide

### Creating Your First Bucket
1. Go to "Overview" tab
2. Click "New Bucket"
3. Choose a name and priority
4. Set up auto-allocation (optional)
5. Set a savings goal (optional)

### Adding Money
1. Go to "Add Money" tab
2. Enter amount and description
3. Money automatically flows into buckets based on your allocation rules
4. Unallocated money remains available for general spending

### Protecting Important Money
1. Find the bucket you want to protect
2. Click "Protect Funds"
3. Enter the amount to lock
4. Money enters cooldown period to prevent immediate unlocking

### Recording Purchases
1. Go to "Spend" tab
2. Choose spending mode:
   - **General**: Quick spending from available balance
   - **Bucket-Only**: Spend from specific buckets
3. Enter purchase details
4. Transaction is recorded and balances update

## 🔮 Future Enhancements

### Planned Features
- Bank integration via Plaid API
- Recurring bill automation
- Advanced analytics and reporting
- Mobile app version
- Multi-user family accounts
- Export capabilities (CSV, PDF)

### Banking Integration
When ready for production, this app could integrate with:
- **Plaid**: For secure bank account connections
- **Banking APIs**: Real-time balance and transaction sync
- **Security**: Bank-grade encryption and compliance

## 🤝 Contributing

This is a demo/prototype application. For contributions:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## ⚡ Development Notes

### Key Business Rules Implemented
- Single source of truth: account balance
- Bucket balances are always derived/allocated portions
- Available to spend calculation respects all locks
- Allocation follows priority order (fixed first, then percentages)
- Lock/cooldown system prevents impulse financial decisions
- All actions recorded as immutable events for auditability

### Security Considerations for Production
- All financial calculations server-side
- Bank-grade encryption for sensitive data
- PCI-DSS compliance for payment processing
- Multi-factor authentication
- Fraud detection and monitoring

## 📄 License

This project is available for educational and demonstration purposes.

---

**Built with ❤️ to solve the "Is this money safe to spend?" problem.**