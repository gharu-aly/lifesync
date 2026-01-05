
import React, { useState, useMemo } from 'react';
import { HealthLog, HealthSettings, AppState, UserProfile } from '../types';
import { 
  Droplets, Moon, Ruler, CalendarDays, Plus, Settings2, Sparkles, 
  TrendingUp, X, Loader2, AlertTriangle, Search, Activity, 
  Utensils, Calculator, ChevronDown, CheckCircle2, Info, Bell, Coffee, Bed, Calendar, Thermometer, Scale
} from 'lucide-react';
import { getHealthTrendAnalysis, estimateFoodCalories } from '../services/geminiService';

interface Props {
  logs: HealthLog[];
  settings: HealthSettings;
  profile: AppState['profile'];
  onUpdateLog: (log: Partial<HealthLog>) => void;
  onUpdateSettings: (settings: Partial<HealthSettings>) => void;
  onUpdateProfile: (update: Partial<UserProfile>) => void;
}

const EXERCISE_TYPES = [
  { name: '跑步', kcalPerMin: 10 },
  { name: '平板支撑', kcalPerMin: 5 },
  { name: '站立', kcalPerMin: 2 },
  { name: '滑雪', kcalPerMin: 12 },
  { name: '爬山', kcalPerMin: 8 },
  { name: '游泳', kcalPerMin: 11 },
  { name: '瑜伽', kcalPerMin: 4 },
  { name: '爬楼梯', isStairs: true }
];

type LogCategory = 'WATER' | 'BMI' | 'INTAKE' | 'EXERCISE' | 'SLEEP' | 'PERIOD' | null;

export const HealthModule: React.FC<Props> = ({ logs, settings, profile, onUpdateLog, onUpdateSettings, onUpdateProfile }) => {
  const [activeLogCategory, setActiveLogCategory] = useState<LogCategory>(null);
  const [showTrends, setShowTrends] = useState(false);
  const [trendMode, setTrendMode] = useState<'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'>('WEEK');
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendResult, setTrendResult] = useState<string | null>(null);

  // AI Intake State
  const [foodSearch, setFoodSearch] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [tempCalPer100g, setTempCalPer100g] = useState<number | null>(null);
  const [foodWeight, setFoodWeight] = useState<string>('100');

  // Exercise State
  const [selectedEx, setSelectedEx] = useState(EXERCISE_TYPES[0]);
  const [exValue, setExValue] = useState<string>('30');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === todayStr);

  const stats = {
    weight: todayLog?.weight || logs.slice().reverse().find(l => l.weight > 0)?.weight || profile.weight,
    height: profile.height,
    water: todayLog?.waterIntake || 0,
    calIn: todayLog?.caloriesIn || 0,
    calOut: todayLog?.caloriesOut || 0,
    sleep: todayLog?.sleepHours || 0
  };

  const targets = {
    water: 2000,
    calIn: 2000,
    calOut: 500,
    sleep: 8
  };

  const bmi = useMemo(() => {
    if (!stats.weight || !stats.height) return null;
    const val = stats.weight / Math.pow(stats.height / 100, 2);
    let status = '正常';
    let color = 'text-green-500';
    if (val < 18.5) { status = '偏瘦'; color = 'text-blue-500'; }
    else if (val >= 24 && val < 28) { status = '偏胖'; color = 'text-orange-500'; }
    else if (val >= 28) { status = '肥胖'; color = 'text-rose-500'; }
    return { value: val.toFixed(1), status, color };
  }, [stats.weight, stats.height]);

  const isCurrentlyInPeriod = useMemo(() => {
    if (!settings.lastPeriodStart) return false;
    if (!settings.lastPeriodEnd) return true;
    return new Date(settings.lastPeriodStart) > new Date(settings.lastPeriodEnd);
  }, [settings.lastPeriodStart, settings.lastPeriodEnd]);

  const handleFetchTrends = async () => {
    setTrendLoading(true);
    const result = await getHealthTrendAnalysis(trendMode, logs.slice(-30));
    setTrendResult(result);
    setTrendLoading(false);
  };

  const handleAiSearch = async () => {
    if (!foodSearch) return;
    setAiLoading(true);
    const cal = await estimateFoodCalories(foodSearch);
    setTempCalPer100g(cal);
    setAiLoading(false);
  };

  const addIntake = () => {
    if (tempCalPer100g === null) return;
    const total = (tempCalPer100g / 100) * parseFloat(foodWeight);
    onUpdateLog({ caloriesIn: stats.calIn + total });
    setFoodSearch('');
    setTempCalPer100g(null);
    setActiveLogCategory(null);
  };

  const addExercise = () => {
    let kcal = 0;
    const val = parseFloat(exValue);
    if (selectedEx.isStairs) {
      kcal = val * 5;
    } else if (selectedEx.kcalPerMin) {
      kcal = val * selectedEx.kcalPerMin;
    }
    onUpdateLog({ caloriesOut: stats.calOut + kcal });
    setActiveLogCategory(null);
  };

  const getRemaining = (current: number, target: number, unit: string) => {
    const diff = target - current;
    return diff > 0 ? `还需 ${diff.toFixed(0)}${unit}` : '已达标 ✨';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 italic tracking-tighter">
          健康监测
        </h2>
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveLogCategory('WATER')}
             className="bg-blue-500 text-white p-3 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
           >
             <Plus size={20} strokeWidth={3} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* BMI Block */}
        <div 
          onClick={() => setActiveLogCategory('BMI')}
          className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
        >
           <div className="flex items-center gap-2 mb-2">
             <Calculator size={20} className="text-pink-500" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BMI 指数</span>
           </div>
           <div>
             <div className="text-2xl font-black">{bmi?.value || '--'}</div>
             <div className={`text-[10px] font-black mt-1 ${bmi?.color || 'text-slate-400'}`}>
               {bmi?.status || '未录入'}
             </div>
           </div>
        </div>

        {/* Water Block */}
        <div 
          onClick={() => setActiveLogCategory('WATER')}
          className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
        >
           <div className="flex items-center gap-2 mb-2">
             <Droplets size={20} className="text-sky-500" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">今日饮水</span>
           </div>
           <div>
             <div className="text-2xl font-black">{stats.water} <span className="text-xs opacity-40">ml</span></div>
             <div className="text-[10px] font-bold text-sky-600 mt-1">
               {getRemaining(stats.water, targets.water, 'ml')}
             </div>
           </div>
        </div>

        {/* Intake Block */}
        <div 
          onClick={() => setActiveLogCategory('INTAKE')}
          className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
        >
           <div className="flex items-center gap-2 mb-2">
             <Utensils size={20} className="text-orange-500" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">今日摄入</span>
           </div>
           <div>
             <div className="text-2xl font-black">{stats.calIn.toFixed(0)} <span className="text-xs opacity-40">kcal</span></div>
             <div className="text-[10px] font-bold text-orange-600 mt-1">
               {getRemaining(stats.calIn, targets.calIn, 'kcal')}
             </div>
           </div>
        </div>

        {/* Exercise Block */}
        <div 
          onClick={() => setActiveLogCategory('EXERCISE')}
          className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
        >
           <div className="flex items-center gap-2 mb-2">
             <Activity size={20} className="text-green-500" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">运动消耗</span>
           </div>
           <div>
             <div className="text-2xl font-black">{stats.calOut.toFixed(0)} <span className="text-xs opacity-40">kcal</span></div>
             <div className="text-[10px] font-bold text-green-600 mt-1">
               {getRemaining(stats.calOut, targets.calOut, 'kcal')}
             </div>
           </div>
        </div>
      </div>

      {/* Sleep Block - Optimized */}
      <div 
        onClick={() => setActiveLogCategory('SLEEP')}
        className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
      >
         <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
               <Moon size={20} className="text-indigo-500" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">昨晚睡眠</span>
            </div>
            <div className="text-4xl font-black">{stats.sleep} <span className="text-xs opacity-40 italic">h</span></div>
         </div>
         <div className="w-[1px] h-12 bg-slate-100 dark:bg-slate-800 mx-4"></div>
         <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
               <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                  <Coffee size={14} className="text-amber-500" />
               </div>
               <span className="text-[10px] font-black text-slate-500">午休提醒: 13:00</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <Bed size={14} className="text-indigo-500" />
               </div>
               <span className="text-[10px] font-black text-slate-500">入睡提醒: 22:30</span>
            </div>
         </div>
      </div>

      {/* Female Health Tracking Card - Enhanced Button */}
      <div className={`p-8 rounded-[3rem] shadow-xl relative overflow-hidden transition-all duration-700 ${isCurrentlyInPeriod ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-rose-200' : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-200'}`}>
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-white/20 rounded-2xl shadow-inner backdrop-blur-md"><CalendarDays size={24} strokeWidth={3} /></div>
                 <h3 className="text-xl font-black italic tracking-tighter">生理周期管理</h3>
              </div>
              <button onClick={() => setActiveLogCategory('PERIOD')} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
                <Settings2 size={20} className="opacity-80" />
              </button>
            </div>
            <div className="space-y-6">
               <div className="flex gap-4">
                  <div className="flex-1 bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
                     <span className="text-[9px] font-black uppercase opacity-60">状态</span>
                     <p className="text-sm font-black mt-1">{isCurrentlyInPeriod ? '正处于经期' : '等待开启'}</p>
                  </div>
                  <div className="flex-1 bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
                     <span className="text-[9px] font-black uppercase opacity-60">最近开始</span>
                     <p className="text-sm font-black mt-1">{settings.lastPeriodStart || '--'}</p>
                  </div>
               </div>
               <button 
                 onClick={() => setActiveLogCategory('PERIOD')}
                 className={`w-full py-4 rounded-3xl font-black shadow-lg transition-all active:scale-95 ${isCurrentlyInPeriod ? 'bg-white text-rose-500' : 'bg-rose-500 text-white shadow-rose-200'}`}
               >
                 记录经期详情
               </button>
            </div>
         </div>
      </div>

      {/* Health Trends Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 rounded-[3rem] shadow-2xl shadow-indigo-200 relative overflow-hidden">
         <div className="relative z-10 flex flex-col gap-5">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-white/20 rounded-2xl shadow-inner backdrop-blur-md"><TrendingUp size={24} strokeWidth={3} /></div>
               <h3 className="text-xl font-black italic tracking-tighter">AI 健康趋势深度解析</h3>
            </div>
            <p className="text-xs text-indigo-100 font-medium">深度复盘本周、本月健康信息，由 AI 识别异常点并提供专家级建议。</p>
            <button onClick={() => setShowTrends(true)} className="w-full bg-white text-indigo-600 py-4 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95">
               <Sparkles size={18} /> 开启复盘报告
            </button>
        </div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Category Selection Modal / Entry Form */}
      {activeLogCategory && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-[4rem] p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black italic">
                {activeLogCategory === 'BMI' && '身体指标录入'}
                {activeLogCategory === 'WATER' && '饮水记录'}
                {activeLogCategory === 'INTAKE' && 'AI 食物识别'}
                {activeLogCategory === 'EXERCISE' && '运动消耗'}
                {activeLogCategory === 'SLEEP' && '睡眠时间'}
                {activeLogCategory === 'PERIOD' && '生理期详情录入'}
              </h3>
              <button onClick={() => setActiveLogCategory(null)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-6 pb-6">
              {activeLogCategory === 'BMI' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Ruler size={16} className="text-blue-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">录入当前身高</span>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between">
                      <input 
                        type="number" 
                        defaultValue={stats.height} 
                        onChange={(e) => onUpdateProfile({ height: parseFloat(e.target.value) })}
                        className="bg-transparent font-black text-lg w-full focus:outline-none" 
                        placeholder="身高 (cm)"
                      />
                      <span className="text-xs font-black opacity-30">CM</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Scale size={16} className="text-pink-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">录入当前体重</span>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between">
                      <input 
                        type="number" 
                        defaultValue={stats.weight} 
                        onChange={(e) => onUpdateLog({ weight: parseFloat(e.target.value) })}
                        className="bg-transparent font-black text-lg w-full focus:outline-none" 
                        placeholder="体重 (kg)"
                      />
                      <span className="text-xs font-black opacity-30">KG</span>
                    </div>
                  </div>
                  
                  {bmi && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl flex items-center justify-between border border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">即时计算 BMI</p>
                        <p className={`text-2xl font-black ${bmi.color}`}>{bmi.value}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black ${bmi.color.replace('text-', 'bg-').replace('500', '50')} ${bmi.color}`}>
                        {bmi.status}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeLogCategory === 'WATER' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Droplets size={16} className="text-sky-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">添加补水量</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[200, 350, 500].map(ml => (
                      <button 
                        key={ml}
                        onClick={() => { onUpdateLog({ waterIntake: stats.water + ml }); setActiveLogCategory(null); }}
                        className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-black text-sky-600 active:scale-95 transition"
                      >
                        +{ml}ml
                      </button>
                    ))}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between">
                    <input 
                      type="number" 
                      onBlur={(e) => { onUpdateLog({ waterIntake: stats.water + parseFloat(e.target.value || '0') }); setActiveLogCategory(null); }}
                      className="bg-transparent font-black text-sm w-full focus:outline-none" 
                      placeholder="自定义数值..."
                    />
                    <span className="text-[10px] font-black opacity-30">ML</span>
                  </div>
                </div>
              )}

              {activeLogCategory === 'INTAKE' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Utensils size={16} className="text-orange-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">搜你想吃的</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      value={foodSearch}
                      onChange={(e) => setFoodSearch(e.target.value)}
                      placeholder="如：麻辣烫、新疆炒米粉"
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-4 pr-16 font-bold text-sm"
                    />
                    <button 
                      onClick={handleAiSearch}
                      disabled={aiLoading || !foodSearch}
                      className="absolute right-2 top-2 bottom-2 bg-orange-500 text-white w-12 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition disabled:opacity-50"
                    >
                      {aiLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                    </button>
                  </div>
                  {tempCalPer100g !== null && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-3xl border border-orange-100 dark:border-orange-800 animate-in slide-in-from-top-2">
                      <div className="flex justify-between mb-4">
                        <h4 className="text-sm font-black text-orange-600">AI 预估: {tempCalPer100g.toFixed(0)} kcal / 100g</h4>
                        <Sparkles size={20} className="text-orange-400" />
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          value={foodWeight}
                          onChange={(e) => setFoodWeight(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 font-black text-xs" 
                          placeholder="克数" 
                        />
                        <button onClick={addIntake} className="bg-orange-500 text-white px-6 rounded-xl font-black text-xs">确认</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeLogCategory === 'EXERCISE' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Activity size={16} className="text-green-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">选择运动</span>
                  </div>
                  <select 
                    value={selectedEx.name}
                    onChange={(e) => setSelectedEx(EXERCISE_TYPES.find(ex => ex.name === e.target.value)!)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-4 font-bold text-sm appearance-none cursor-pointer"
                  >
                    {EXERCISE_TYPES.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      value={exValue}
                      onChange={(e) => setExValue(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-4 font-black text-sm"
                      placeholder={selectedEx.isStairs ? "层数" : "分钟"}
                    />
                    <button onClick={addExercise} className="bg-green-500 text-white px-8 rounded-2xl font-black text-sm shadow-lg">记录</button>
                  </div>
                </div>
              )}

              {activeLogCategory === 'SLEEP' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Moon size={16} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">录入睡眠时长</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between">
                    <input 
                      type="number" 
                      defaultValue={stats.sleep}
                      onChange={(e) => onUpdateLog({ sleepHours: parseFloat(e.target.value || '0') })}
                      className="bg-transparent font-black text-lg w-full focus:outline-none" 
                      placeholder="8.0"
                    />
                    <span className="text-[10px] font-black opacity-30">H</span>
                  </div>
                </div>
              )}

              {activeLogCategory === 'PERIOD' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <Calendar size={16} className="text-rose-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">周期详情记录</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-1">开始日期</span>
                        <input 
                          type="date" 
                          value={settings.lastPeriodStart || todayStr} 
                          onChange={(e) => onUpdateSettings({ lastPeriodStart: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-black text-xs" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-1">结束日期</span>
                        <input 
                          type="date" 
                          max={todayStr}
                          value={settings.lastPeriodEnd || ''} 
                          onChange={(e) => {
                            if (new Date(e.target.value) > new Date()) {
                              alert('结束日期不能晚于今日哦~');
                              return;
                            }
                            onUpdateSettings({ lastPeriodEnd: e.target.value });
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl font-black text-xs" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <span className="text-[9px] font-black text-slate-400 uppercase ml-1">经期流量 (出血情况)</span>
                       <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'LIGHT', label: '少量', icon: '💧' },
                            { id: 'MEDIUM', label: '适中', icon: '💧💧' },
                            { id: 'HEAVY', label: '大量', icon: '💧💧💧' }
                          ].map(f => (
                            <button 
                              key={f.id}
                              onClick={() => onUpdateSettings({ lastPeriodFlow: f.id as any })}
                              className={`p-4 rounded-2xl border transition flex flex-col items-center gap-1 ${settings.lastPeriodFlow === f.id ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 text-slate-500'}`}
                            >
                               <span className="text-lg">{f.icon}</span>
                               <span className="text-[9px] font-black">{f.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-2 px-1">
                      <Settings2 size={16} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">周期默认参数</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                        <label className="text-[8px] font-black text-slate-400 block mb-1">平均周期 (天)</label>
                        <input 
                          type="number" 
                          value={settings.cycleLength} 
                          onChange={(e) => onUpdateSettings({ cycleLength: parseInt(e.target.value) })}
                          className="bg-transparent font-black text-sm w-full focus:outline-none"
                        />
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                        <label className="text-[8px] font-black text-slate-400 block mb-1">平均经期 (天)</label>
                        <input 
                          type="number" 
                          value={settings.periodLength} 
                          onChange={(e) => onUpdateSettings({ periodLength: parseInt(e.target.value) })}
                          className="bg-transparent font-black text-sm w-full focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setActiveLogCategory(null)}
                className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg active:scale-95 transition-all shadow-xl"
              >
                保存并返回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trends Modal */}
      {showTrends && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex flex-col justify-end">
           <div className="bg-white dark:bg-slate-950 rounded-t-[4rem] p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black italic">健康趋势分析</h3>
                 <button onClick={() => {setShowTrends(false); setTrendResult(null);}} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-8">
                 {(['WEEK', 'MONTH', 'YEAR', 'CUSTOM'] as const).map(m => (
                   <button key={m} onClick={() => {setTrendMode(m); setTrendResult(null);}} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${trendMode === m ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-500' : 'text-slate-400'}`}>
                     {m === 'WEEK' ? '本周' : m === 'MONTH' ? '本月' : m === 'YEAR' ? '本年' : '自定义'}
                   </button>
                 ))}
              </div>

              {!trendResult ? (
                <button onClick={handleFetchTrends} disabled={trendLoading} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50">
                   {trendLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                   {trendLoading ? '正在多维解析中...' : '生成 AI 健康报告'}
                </button>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                   <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-[2.5rem] border border-amber-100 dark:border-amber-900">
                      <div className="flex items-center gap-2 mb-3">
                         <AlertTriangle size={18} className="text-amber-500" />
                         <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">异常项预警</span>
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                         {trendResult}
                      </div>
                   </div>
                   <button onClick={() => setTrendResult(null)} className="w-full py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-400">重新解析数据</button>
                </div>
              )}
              <button onClick={() => setShowTrends(false)} className="mt-8 w-full bg-slate-900 text-white py-5 rounded-3xl font-black">返回健康中心</button>
           </div>
        </div>
      )}
    </div>
  );
};
