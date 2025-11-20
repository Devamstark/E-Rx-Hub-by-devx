import React from 'react';
import { LogOut, ShieldCheck, LayoutDashboard, FileText, UserCheck } from 'lucide-react';
import { User, UserRole } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-teal-300" />
            <div>
                <h1 className="text-xl font-bold tracking-tight">DevXWorld <span className="font-light text-teal-200">e-Rx Hub</span></h1>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <span className="text-xs bg-indigo-800 px-2 py-0.5 rounded-full text-indigo-100 border border-indigo-600">
                  {user.role}
                </span>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 hover:bg-indigo-600 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} DevXWorld. Compliant with India Telemedicine Practice Guidelines 2020 & DPDP Act 2023.</p>
        </div>
      </footer>
    </div>
  );
};