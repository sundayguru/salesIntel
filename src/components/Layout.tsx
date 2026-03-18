import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Users, Briefcase, Search, LogOut, FileText, CheckCircle2, Kanban, Target, Package } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail?: string | null;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userEmail }) => {
  return (
    <div className="min-h-screen bg-stone-50 flex font-sans text-stone-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-600" />
            SalesIntel AI
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'leads', label: 'Leads', icon: Users },
            { id: 'pipeline', label: 'Pipeline', icon: Kanban },
            { id: 'research', label: 'Research', icon: Search },
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
            { id: 'assets', label: 'Saved Assets', icon: FileText },
            { id: 'criteria', label: 'Evaluation Criteria', icon: Target },
            { id: 'services', label: 'Our Services', icon: Package },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className="px-4 py-3 mb-2">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">User</p>
            <p className="text-sm font-medium truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
