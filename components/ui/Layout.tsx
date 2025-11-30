import React from 'react';
import { LogOut, ShieldCheck, Database, Wifi, WifiOff, BookOpen } from 'lucide-react';
import { User } from '../../types';
import { dbService } from '../../services/db';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onOpenDocs: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onOpenDocs }) => {
  const isCloud = dbService.isCloudEnabled();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden w-full">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-md sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-teal-300 flex-shrink-0" />
            <div className="overflow-hidden">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">DevXWorld <span className="font-light text-teal-200">e-Rx Hub</span></h1>
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
                className="p-2 hover:bg-indigo-600 rounded-full transition-colors flex-shrink-0"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-3 py-6 sm:px-6 lg:px-8 w-full max-w-full sm:max-w-7xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 mt-auto w-full">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm space-y-3">
          <p>&copy; {new Date().getFullYear()} E-rx by DevXWorld. Compliant with India Telemedicine Practice Guidelines 2020 & DPDP Act 2023.</p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-xs opacity-70">
              <div className="flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  <span>Data Source:</span>
                  {isCloud ? (
                      <span className="text-green-400 flex items-center font-bold"><Wifi className="w-3 h-3 mr-1"/> Cloud Database Connected</span>
                  ) : (
                      <span className="text-amber-400 flex items-center font-bold"><WifiOff className="w-3 h-3 mr-1"/> Local Device Only</span>
                  )}
              </div>
              
              <button 
                onClick={onOpenDocs} 
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                  <BookOpen className="w-3 h-3" /> Documentation & Guides
              </button>
          </div>
        </div>
      </footer>
    </div>
  );
};