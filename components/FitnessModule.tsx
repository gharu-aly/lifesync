
import React, { useState, useEffect } from 'react';
import { FitnessSettings, HealthLog, UserProfile } from '../types';
import { 
  Dumbbell, Utensils, Target, ArrowRight, Activity, 
  Settings2, ChevronRight, CheckCircle2, Loader2, Sparkles, Scale, Ruler
} from 'lucide-react';
import { getFitnessPlan } from '../services/geminiService';

interface Props {
  settings: FitnessSettings;
  logs: HealthLog[];
  profile: UserProfile;
  onUpdateSettings: (settings: Partial<FitnessSettings>) => void;
  onUpdateProfile: (update: Partial<UserProfile>) => void;
}

export const FitnessModule: React.FC<Props> = ({ settings, logs, profile, onUpdateSettings, onUpdateProfile }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Fallback chain for weight: current fitness setting -> latest daily health log -> central profile
  const latestWeight = settings.weight || logs.slice().reverse().find(l => l.weight > 0)?.weight || profile.weight || 0;
  const currentHeight = profile.height || settings.height || 0;

  const fetchPlan = async () => {
    if (!latestWeight) return;
    setLoadingPlan(true);
    // Use the most accurate physical data for AI plan generation
    const result = await getFitnessPlan({ ...settings, weight: latestWeight, height: currentHeight }, latestWeight);
    setPlan(result);
    setLoadingPlan(false);
  };

  useEffect(() => {
    if (!plan && latestWeight) fetchPlan();
  }, [settings.goal, latestWeight, currentHeight]);

  const goals = [
    { id: 'LOSE_WEIGHT', label: '减脂瘦身', icon: '🔥' },
    { id: 'GAIN_MUSCLE', label: '增肌塑形', icon: '💪' },
    { id: 'MAINTAIN', label: '维持现状', icon: '⚖️' }
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">进阶健身</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">定制化运动与营养计划</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition"
        >
          <Settings2 size={20} className={`transition-transform duration-500 ${showSettings ? 'rotate-90' : ''} text-slate-600 dark:text-slate-300`} />
        </button>
      </div>

      {showSettings ? (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">完善身体档案</h3>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
               <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                 <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">性别</label>
                 <select 
                    value={profile.gender} 
                    onChange={e => onUpdateProfile({ gender: e.target.value as any })}
                    className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0 dark:text-slate-200"
                  >
                   <option value="MALE">男</option>
                   <option value="FEMALE">女</option>
                 </select>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                 <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">年龄</label>
                 <input 
                    type="number" 
                    value={profile.age} 
                    onChange={e => onUpdateProfile({ age: parseInt(e.target.value) || 0 })}
                    className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0 dark:text-slate-200"
                  />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-transparent focus-within:border-blue-200 transition">
                 <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">身高 (CM)</label>
                 <input 
                    type="number" 
                    value={currentHeight || ''} 
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateProfile({ height: val });
                      onUpdateSettings({ height: val });
                    }}
                    className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0 dark:text-slate-200"
                    placeholder="175"
                  />
               </div>
               <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-transparent focus-within:border-blue-200 transition">
                 <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">体重 (KG)</label>
                 <input 
                    type="number" 
                    value={latestWeight || ''} 
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateProfile({ weight: val });
                      onUpdateSettings({ weight: val });
                    }}
                    className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0 dark:text-slate-200"
                    placeholder="70"
                  />
               </div>
             </div>

             <div>
               <label className="text-[8px] font-black uppercase text-slate-400 block mb-2 px-1">健身目标</label>
               <div className="grid grid-cols-3 gap-2">
                 {goals.map(g => (
                   <button 
                    key={g.id}
                    onClick={() => onUpdateSettings({ goal: g.id as any })}
                    className={`p-3 rounded-2xl border transition flex flex-col items-center gap-1 ${settings.goal === g.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                   >
                     <span className="text-lg">{g.icon}</span>
                     <span className="text-[9px] font-black">{g.label}</span>
                   </button>
                 ))}
               </div>
             </div>
          </div>
          <button onClick={() => setShowSettings(false)} className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white py-4 mt-6 rounded-2xl font-black shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 transition">保存并返回</button>
        </div>
      ) : (
        <>
          {/* Quick Stats Banner - Reactive to all module updates */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">身体概览</p>
                <div className="flex items-baseline gap-4">
                  <div className="text-2xl font-black tracking-tighter">{latestWeight || '--'} <span className="text-[10px] opacity-70">kg</span></div>
                  <div className="text-2xl font-black tracking-tighter">{currentHeight || '--'} <span className="text-[10px] opacity-70">cm</span></div>
                </div>
                <div className="flex items-center gap-1.5 mt-4 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 w-fit">
                   <Target size={12} className="text-blue-200" />
                   <span className="text-[10px] font-black uppercase tracking-tight">{goals.find(g => g.id === settings.goal)?.label}</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                <Dumbbell size={32} />
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">今日推荐计划</h3>
              <button 
                onClick={fetchPlan} 
                className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1 active:scale-95 transition"
                disabled={loadingPlan}
              >
                {loadingPlan ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                刷新计划
              </button>
            </div>

            {loadingPlan ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="text-blue-600 animate-spin" size={32} />
                <p className="text-xs font-bold text-slate-400">正在生成为您量身打造的方案...</p>
              </div>
            ) : plan ? (
              <div className="space-y-4">
                {/* Exercise Section */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-blue-600" />
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">推荐运动</span>
                  </div>
                  <div className="space-y-3">
                    {plan.exercises?.map((ex: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-[10px] font-black text-blue-600 dark:text-blue-400">
                            {i+1}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200">{ex.name}</p>
                            <p className="text-[9px] font-bold text-slate-400">{ex.intensity}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 italic">{ex.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meal Section */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Utensils size={18} className="text-orange-500" />
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">三餐饮食建议</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex gap-4 p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-2xl border border-orange-100/50 dark:border-orange-900/30">
                      <div className="text-[9px] font-black text-orange-400 uppercase vertical-text">早餐</div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-snug">{plan.meals?.breakfast}</p>
                    </div>
                    <div className="flex gap-4 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
                      <div className="text-[9px] font-black text-blue-400 uppercase vertical-text">午餐</div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-snug">{plan.meals?.lunch}</p>
                    </div>
                    <div className="flex gap-4 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                      <div className="text-[9px] font-black text-indigo-400 uppercase vertical-text">晚餐</div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-snug">{plan.meals?.dinner}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-[2rem] text-center">
                <p className="text-xs font-bold text-slate-400">录入基本信息后即可获取智能计划</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
