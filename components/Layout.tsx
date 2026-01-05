
import React from 'react';
import { ModuleType, UserProfile } from '../types';
import { Dumbbell, HeartPulse, BookOpen, Wallet, UserCircle } from 'lucide-react';

interface NavProps {
  activeModule: ModuleType;
  onNavigate: (module: ModuleType) => void;
}

const BottomNav: React.FC<NavProps> = ({ activeModule, onNavigate }) => {
  const navItems = [
    { type: ModuleType.FITNESS, icon: Dumbbell, label: '健身' },
    { type: ModuleType.HEALTH, icon: HeartPulse, label: '健康' },
    { type: ModuleType.WORK_STUDY, icon: BookOpen, label: '日程' },
    { type: ModuleType.FINANCE, icon: Wallet, label: '记账' },
    { type: ModuleType.PROFILE, icon: UserCircle, label: '我的' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around items-center h-20 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.type;
          return (
            <button
              key={item.type}
              onClick={() => onNavigate(item.type)}
              className={`flex flex-col items-center justify-center flex-1 space-y-1.5 transition-all duration-300 ${
                isActive ? 'text-pink-500 scale-110' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-2xl transition-colors ${isActive ? 'bg-pink-50 dark:bg-pink-900/20 shadow-lg shadow-pink-100 dark:shadow-none' : ''}`}>
                <Icon size={24} strokeWidth={2} />
              </div>
              <span className={`text-[10px] font-black tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const MainLayout: React.FC<{
  children: React.ReactNode;
  activeModule: ModuleType;
  onNavigate: (module: ModuleType) => void;
  theme: 'LIGHT' | 'DARK';
  profile: UserProfile;
}> = ({ children, activeModule, onNavigate, theme, profile }) => {
  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme === 'DARK' ? 'bg-slate-950 text-slate-100' : 'bg-pink-50/30 text-slate-900'}`}>
      <header className="sticky top-0 z-40 px-6 py-5 flex items-center justify-between backdrop-blur-md">
        <h1 className="text-2xl font-black italic tracking-tighter">
          <span className="text-pink-500">Life</span>
          <span className="text-blue-500">Sync</span>
        </h1>
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 to-yellow-300 p-0.5 shadow-lg shadow-pink-100">
              <div className="w-full h-full bg-white dark:bg-slate-800 rounded-[0.8rem] overflow-hidden">
                <img 
                  src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.nickname}`} 
                  alt="avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
           </div>
        </div>
      </header>
      <main className="px-4 pb-32 max-w-lg mx-auto w-full animate-in fade-in slide-in-from-bottom-2">
        {children}
      </main>
      <BottomNav activeModule={activeModule} onNavigate={onNavigate} />
    </div>
  );
};
