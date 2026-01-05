
import React, { useState, useEffect } from 'react';
import { MainLayout } from './components/Layout';
import { ModuleType, AppState, HealthLog, Task, FinanceRecord, HealthSettings, FitnessSettings, UserProfile } from './types';
import { HealthModule } from './components/HealthModule';
import { FinanceModule } from './components/FinanceModule';
import { WorkStudyModule } from './components/WorkStudyModule';
import { ProfileModule } from './components/ProfileModule';
import { FitnessModule } from './components/FitnessModule';

const STORAGE_KEY = 'lifesync_state_dopamine_v1';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      profile: { nickname: '玩家1号', avatar: '', gender: 'MALE', age: 24, height: 175, weight: 65 },
      theme: 'LIGHT',
      healthLogs: [],
      tasks: [],
      financeRecords: [],
      activeModule: ModuleType.FITNESS,
      healthSettings: { cycleLength: 28, periodLength: 5 },
      fitnessSettings: { gender: 'MALE', age: 24, goal: 'MAINTAIN', activityLevel: 'MODERATE' }
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.theme === 'DARK') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const updateProfile = (update: Partial<UserProfile>) => {
    setState(prev => ({ ...prev, profile: { ...prev.profile, ...update } }));
  };

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'LIGHT' ? 'DARK' : 'LIGHT' }));
  };

  const updateHealthLog = (update: Partial<HealthLog>) => {
    const today = new Date().toISOString().split('T')[0];
    setState(prev => {
      const idx = prev.healthLogs.findIndex(l => l.date === today);
      let logs = [...prev.healthLogs];
      if (idx >= 0) {
        logs[idx] = { ...logs[idx], ...update };
      } else {
        logs.push({ id: Date.now().toString(), date: today, weight: 0, waterIntake: 0, caloriesIn: 0, caloriesOut: 0, sleepHours: 0, ...update });
      }
      return { ...prev, healthLogs: logs };
    });
  };

  const updateHealthSettings = (settings: Partial<HealthSettings>) => {
    setState(prev => ({ ...prev, healthSettings: { ...prev.healthSettings, ...settings } }));
  };

  const updateFitnessSettings = (settings: Partial<FitnessSettings>) => {
    setState(prev => ({ ...prev, fitnessSettings: { ...prev.fitnessSettings, ...settings } }));
  };

  const addTask = (task: Task) => {
    setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
  };

  const updateTask = (task: Task) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? task : t) }));
  };

  const deleteTask = (id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  };

  const addFinanceRecord = (record: FinanceRecord) => {
    setState(prev => ({ ...prev, financeRecords: [...prev.financeRecords, record] }));
  };

  const deleteFinanceRecord = (id: string) => {
    setState(prev => ({ ...prev, financeRecords: prev.financeRecords.filter(r => r.id !== id) }));
  };

  return (
    <MainLayout 
      activeModule={state.activeModule} 
      onNavigate={(m) => setState(prev => ({ ...prev, activeModule: m }))}
      theme={state.theme}
      profile={state.profile}
    >
      {state.activeModule === ModuleType.FITNESS && (
        <FitnessModule 
          settings={state.fitnessSettings} 
          logs={state.healthLogs} 
          profile={state.profile}
          onUpdateSettings={updateFitnessSettings} 
          onUpdateProfile={updateProfile}
        />
      )}
      {state.activeModule === ModuleType.HEALTH && <HealthModule logs={state.healthLogs} settings={state.healthSettings} profile={state.profile} onUpdateLog={updateHealthLog} onUpdateSettings={updateHealthSettings} onUpdateProfile={updateProfile} />}
      {state.activeModule === ModuleType.FINANCE && <FinanceModule records={state.financeRecords} onAddRecord={addFinanceRecord} onDeleteRecord={deleteFinanceRecord} />}
      {state.activeModule === ModuleType.WORK_STUDY && <WorkStudyModule tasks={state.tasks} onUpdateTask={updateTask} onAddTask={addTask} onDeleteTask={deleteTask} />}
      {state.activeModule === ModuleType.PROFILE && <ProfileModule profile={state.profile} theme={state.theme} onUpdateProfile={updateProfile} onToggleTheme={toggleTheme} />}
    </MainLayout>
  );
};

export default App;
