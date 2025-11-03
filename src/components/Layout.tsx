import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Home,
  PlusCircle,
  MinusCircle,
  Settings,
  Database,
  BarChart3,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: BarChart3, label: 'Progress Tracking', path: '/progress' },
  { icon: TrendingUp, label: 'Recurring Income', path: '/recurring-income' },
  { icon: TrendingDown, label: 'Recurring Expenses', path: '/recurring-expenses' },
  { icon: CreditCard, label: 'Loans', path: '/loans' },
  { icon: Home, label: 'Selling House', path: '/selling-house' },
  { icon: PlusCircle, label: 'One-off Income', path: '/one-off-income' },
  { icon: MinusCircle, label: 'One-off Expenses', path: '/one-off-expenses' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: Database, label: 'Data Management', path: '/data-management' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Financial Planner</h1>
        </div>
        <nav className="px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 mb-1 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
