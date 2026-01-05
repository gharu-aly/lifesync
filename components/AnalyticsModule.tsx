
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getDeeperAnalysis } from '../services/geminiService';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  state: AppState;
}

export const AnalyticsModule: React.FC<Props> = ({ state }) => {
  const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'YEAR'>('WEEK');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const healthData = useMemo(() => {
    return state.healthLogs.slice(-7).map(log => ({
      name: log.date.split('-').slice(2).join(''),
      weight: log.weight,
      calories: log.caloriesIn,
      water: log.waterIntake
    }));
  }, [state.healthLogs]);

  const financeData = useMemo(() => {
    const expenseByCategory: Record<string, number> = {};
    state.financeRecords.forEach(r => {
      if (r.type === 'EXPENSE') {
        expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + r.amount;
      }
    });
    return Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  }, [state.financeRecords]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const triggerAIAnalysis = async () => {
    setIsLoading(true);
    const result = await getDeeperAnalysis(timeRange, { 
      health: state.healthLogs.slice(-10), 
      finance: state.financeRecords.slice(-10),
      tasks: state.tasks.slice(-10)
    });
    setAiAnalysis(result);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">深度分析</h2>
        <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl">
          {(['WEEK', 'MONTH'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${timeRange === range ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              {range === 'WEEK' ? '本周' : '本月'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Weight Trend - Full Width Mobile */}
        <div className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm h-64">
          <h3 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">体重趋势回顾</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={healthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#cbd5e1'}} />
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }} 
              />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Pie - Full Width Mobile */}
        <div className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm h-64">
          <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">支出类目占比</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={financeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {financeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Analysis Button & Report */}
      <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="text-yellow-300" size={20} />
            <h3 className="text-lg font-black tracking-tight">AI 智能周期分析</h3>
          </div>
          
          {aiAnalysis ? (
            <div className="bg-white/10 p-5 rounded-2xl border border-white/10 text-xs leading-relaxed text-indigo-50 backdrop-blur-sm">
              <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>') }} />
            </div>
          ) : (
            <>
              <p className="text-indigo-100 text-xs mb-5 font-medium">
                聚合您的健康、习惯与财务轨迹，揭示潜在的生活规律与提升建议。
              </p>
              <button 
                onClick={triggerAIAnalysis}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-white text-indigo-600 px-6 py-4 rounded-2xl font-black transition disabled:opacity-50 active:scale-95 shadow-lg"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} />}
                <span>{isLoading ? '解析中...' : '生成多维报告'}</span>
                {!isLoading && <ArrowRight size={16} className="ml-1" />}
              </button>
            </>
          )}
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};
