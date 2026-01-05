
import React, { useState, useMemo } from 'react';
import { FinanceRecord } from '../types';
import { Plus, Wallet, Trash2, X, BarChart3, TrendingUp, Calendar, ArrowRight, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Props {
  records: FinanceRecord[];
  onAddRecord: (record: FinanceRecord) => void;
  onDeleteRecord?: (id: string) => void;
}

type ViewMode = 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';

const CATEGORY_MAP: Record<string, { color: string, icon: string }> = {
  '餐饮': { color: '#FF8042', icon: '🍱' },
  '交通': { color: '#0088FE', icon: '🚗' },
  '购物': { color: '#FFBB28', icon: '🛍️' },
  '娱乐': { color: '#00C49F', icon: '🎮' },
  '住房': { color: '#8884d8', icon: '🏠' },
  '医疗': { color: '#FF5F6D', icon: '💊' },
  '人情往来': { color: '#6C5CE7', icon: '🤝' },
  '其他': { color: '#A9A9A9', icon: '📦' }
};

export const FinanceModule: React.FC<Props> = ({ records, onAddRecord, onDeleteRecord }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsMode, setStatsMode] = useState<ViewMode>('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<Partial<FinanceRecord>>({ type: 'EXPENSE', amount: 0, category: '餐饮', note: '', date: todayStr });

  // Highlight max expense of current month
  const maxMonthlyExpenseId = useMemo(() => {
    const now = new Date();
    const currentMonthRecords = records.filter(r => {
      const d = new Date(r.date);
      return r.type === 'EXPENSE' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    if (currentMonthRecords.length === 0) return null;
    return currentMonthRecords.reduce((prev, curr) => prev.amount > curr.amount ? prev : curr).id;
  }, [records]);

  const statistics = useMemo(() => {
    const filter = (r: FinanceRecord) => {
      const d = new Date(r.date);
      const now = new Date();
      if (statsMode === 'WEEK') return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (statsMode === 'MONTH') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (statsMode === 'YEAR') return d.getFullYear() === now.getFullYear();
      if (statsMode === 'CUSTOM') return r.date >= startDate && r.date <= endDate;
      return true;
    };

    const filtered = records.filter(filter);
    const expenseData = filtered.filter(r => r.type === 'EXPENSE').reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(expenseData).map(([name, value]) => ({ name, value }));

    // Monthly Bar Data for Year View
    let barData: any[] = [];
    if (statsMode === 'YEAR') {
      const months = Array.from({ length: 12 }, (_, i) => i);
      barData = months.map(m => {
        const mRecords = filtered.filter(r => new Date(r.date).getMonth() === m);
        return {
          month: `${m + 1}月`,
          收入: mRecords.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0),
          支出: mRecords.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0),
        };
      });
    }

    return { filtered, pieData, barData };
  }, [records, statsMode, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">我的金库</h2>
        <button onClick={() => setShowAdd(true)} className="bg-pink-500 text-white p-3 rounded-2xl shadow-lg shadow-pink-200 active:scale-95 transition-all"><Plus size={24} strokeWidth={3} /></button>
      </div>

      {/* Main Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-4">
           <div className="flex justify-between items-start">
              <div>
                 <span className="text-indigo-100 text-[10px] font-black tracking-widest uppercase">本月结余</span>
                 <div className="text-4xl font-black tracking-tighter mt-1">¥{records.reduce((a, b) => b.type === 'INCOME' ? a + b.amount : a - b.amount, 0).toFixed(2)}</div>
              </div>
              <Wallet size={32} className="opacity-40" />
           </div>
           <button onClick={() => setShowStats(true)} className="mt-4 bg-white/20 hover:bg-white/30 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 backdrop-blur-md transition-all">
             <BarChart3 size={16} /> 查看多维分析
           </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Recent List */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">最近收支</h3>
        {records.slice().reverse().map(r => (
          <div key={r.id} className={`group bg-white dark:bg-slate-900 p-4 rounded-3xl border ${maxMonthlyExpenseId === r.id ? 'border-pink-500 ring-2 ring-pink-100 dark:ring-0' : 'border-slate-100 dark:border-slate-800'} flex items-center justify-between shadow-sm hover:scale-[1.02] transition-all`}>
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner">{CATEGORY_MAP[r.category]?.icon || '💰'}</div>
                <div>
                   <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                     {r.category}
                     {maxMonthlyExpenseId === r.id && <span className="bg-pink-500 text-white text-[8px] px-1.5 py-0.5 rounded-md">月度巨轮</span>}
                   </div>
                   <div className="text-[9px] font-bold text-slate-400 uppercase">{r.date} {r.note && `• ${r.note}`}</div>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <span className={`text-sm font-black ${r.type === 'INCOME' ? 'text-green-500' : 'text-slate-900 dark:text-slate-100'}`}>{r.type === 'INCOME' ? '+' : '-'}¥{r.amount.toFixed(1)}</span>
                <button onClick={() => onDeleteRecord?.(r.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
             </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black italic">快速记一笔</h3>
                <button onClick={() => setShowAdd(false)}><X className="text-slate-300" /></button>
              </div>
              <div className="space-y-6">
                 <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <button onClick={() => setForm({...form, type:'EXPENSE'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${form.type==='EXPENSE' ? 'bg-white shadow-md text-pink-500' : 'text-slate-400'}`}>支出</button>
                    <button onClick={() => setForm({...form, type:'INCOME'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${form.type==='INCOME' ? 'bg-white shadow-md text-blue-500' : 'text-slate-400'}`}>收入</button>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="0.00" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-2xl font-black w-full" />
                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-[10px] font-black" />
                 </div>
                 <div className="grid grid-cols-4 gap-2">
                    {Object.keys(CATEGORY_MAP).map(cat => (
                      <button key={cat} onClick={() => setForm({...form, category: cat})} className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${form.category === cat ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}>
                         <span className="text-xl">{CATEGORY_MAP[cat].icon}</span>
                         <span className="text-[8px] font-black">{cat}</span>
                      </button>
                    ))}
                 </div>
                 <button onClick={() => {onAddRecord(form as any); setShowAdd(false);}} className="w-full bg-pink-500 text-white py-5 rounded-3xl font-black shadow-xl shadow-pink-200">存入账本</button>
              </div>
           </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStats && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xl flex flex-col justify-end">
           <div className="bg-white dark:bg-slate-950 rounded-t-[4rem] p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black tracking-tighter">多维财务复盘</h3>
                 <button onClick={() => {setShowStats(false); setSelectedCategory(null);}} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-6">
                 {(['WEEK', 'MONTH', 'YEAR', 'CUSTOM'] as const).map(m => (
                   <button key={m} onClick={() => {setStatsMode(m); setSelectedCategory(null);}} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${statsMode === m ? 'bg-white dark:bg-slate-800 shadow-sm text-pink-500' : 'text-slate-400'}`}>
                     {m === 'WEEK' ? '周' : m === 'MONTH' ? '月' : m === 'YEAR' ? '年' : '自定义'}
                   </button>
                 ))}
              </div>

              {statsMode === 'CUSTOM' && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                   <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-xs font-black" />
                   <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-xs font-black" />
                </div>
              )}

              <div className="space-y-12">
                 <div className="h-64 relative">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">支出分布 (饼图)</h4>
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={statistics.pieData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" onClick={(data) => setSelectedCategory(data.name)}>
                            {statistics.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_MAP[entry.name]?.color || '#8884d8'} />)}
                         </Pie>
                         <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', fontWeight: 'bold'}} />
                         <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                      </PieChart>
                   </ResponsiveContainer>
                 </div>

                 {selectedCategory && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2.5rem] border border-pink-100 dark:border-pink-900 animate-in slide-in-from-top-4">
                       <div className="flex items-center justify-between mb-4">
                          <h5 className="text-xs font-black text-pink-500">【{selectedCategory}】详情</h5>
                          <button onClick={() => setSelectedCategory(null)} className="text-[10px] text-slate-400 font-bold uppercase">清空</button>
                       </div>
                       <div className="space-y-2">
                          {statistics.filtered.filter(r => r.category === selectedCategory).map(r => (
                            <div key={r.id} className="flex justify-between items-center text-[10px] font-bold py-2 border-b border-pink-50 dark:border-pink-950 last:border-0">
                               <span className="text-slate-400">{r.date} {r.note}</span>
                               <span className={r.type === 'INCOME' ? 'text-green-500' : 'text-slate-800 dark:text-slate-200'}>¥{r.amount.toFixed(1)}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {statsMode === 'YEAR' && (
                    <div className="h-64">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">年度收支趋势 (月度)</h4>
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statistics.barData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                             <YAxis hide />
                             <Tooltip cursor={{fill: 'transparent'}} />
                             <Bar dataKey="收入" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                             <Bar dataKey="支出" fill="#ec4899" radius={[4, 4, 0, 0]} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 )}
              </div>
              <button onClick={() => setShowStats(false)} className="mt-12 w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg">完成复盘</button>
           </div>
        </div>
      )}
    </div>
  );
};
