import React from 'react';
import { Bell, Settings, User } from 'lucide-react';

interface AppHeaderProps {
  title: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <div className="user-avatar">
            <User size={24} />
          </div>
          <div className="header-text">
            <span className="greeting">Good morning</span>
            <h1 className="app-title">{title}</h1>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-button" aria-label="Notifications">
            <Bell size={24} />
          </button>
          <button className="icon-button" aria-label="Settings">
            <Settings size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;