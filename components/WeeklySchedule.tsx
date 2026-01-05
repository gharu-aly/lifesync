
import React, { useMemo, useState, useRef } from 'react';
import { Task } from '../types';
import { Trash2, Calendar, CheckCircle2, Circle, Clock, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const WeeklySchedule: React.FC<Props> = ({ tasks, onUpdateTask, onDeleteTask }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [swipedTaskId, setSwipedTaskId] = useState<string | null>(null);
  const touchStartRef = useRef<number | null>(null);

  const days = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i - 3); // Start 3 days ago for context
      return {
        full: d.toISOString().split('T')[0],
        display: d.toLocaleDateString('zh-CN', { weekday: 'narrow' }),
        dateNum: d.getDate(),
        isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
      };
    });
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.dueDate.startsWith(selectedDate))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [tasks, selectedDate]);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (!touchStartRef.current) return;
    const diff = touchStartRef.current - e.touches[0].clientX;
    if (diff > 50) setSwipedTaskId(id);
    if (diff < -50) setSwipedTaskId(null);
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'WORK': return { color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-100 dark:border-rose-900/50' };
      case 'STUDY': return { color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-100 dark:border-green-900/50' };
      case 'ENTERTAINMENT': return { color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-100 dark:border-amber-900/50' };
      default: return { color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-100 dark:border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Horizontal Date Picker */}
      <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar -mx-4 px-4 mask-fade-edges">
        {days.map(day => (
          <button
            key={day.full}
            onClick={() => { setSelectedDate(day.full); setSwipedTaskId(null); }}
            className={`flex-shrink-0 w-16 h-20 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
              selectedDate === day.full 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110 z-10' 
                : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-50 dark:border-slate-800'
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-widest ${selectedDate === day.full ? 'opacity-70' : ''}`}>{day.display}</span>
            <span className="text-xl font-black">{day.dateNum}</span>
            {day.isToday && <div className={`w-1 h-1 rounded-full mt-1 ${selectedDate === day.full ? 'bg-white' : 'bg-indigo-500'}`} />}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] py-16 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800">
             <Calendar size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
             <p className="text-sm font-black text-slate-300 dark:text-slate-700 italic">今日暂无日程规划</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const theme = getCategoryTheme(task.category);
            const isSwiped = swipedTaskId === task.id;
            
            return (
              <div 
                key={task.id} 
                className={`relative overflow-hidden rounded-3xl group ${task.isPriority ? 'ring-1 ring-amber-400/30' : ''}`}
                onTouchStart={(e) => handleTouchStart(e, task.id)}
                onTouchMove={(e) => handleTouchMove(e, task.id)}
              >
                {/* Delete Button (Behind Card) */}
                <button 
                  onClick={() => onDeleteTask(task.id)}
                  className="absolute right-0 top-0 bottom-0 w-24 bg-rose-500 text-white flex items-center justify-center transition-all"
                >
                  <Trash2 size={24} />
                </button>

                {/* Task Card */}
                <div 
                  style={{ transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)' }}
                  className={`relative z-10 bg-white dark:bg-slate-900 p-5 border ${task.isPriority ? 'border-amber-200 dark:border-amber-900/50' : theme.border} transition-transform duration-300 flex items-center gap-4`}
                >
                  <button 
                    onClick={() => onUpdateTask({ ...task, status: task.status === 'DONE' ? 'TODO' : 'DONE' })}
                    className={`transition-colors ${task.status === 'DONE' ? 'text-green-500' : 'text-slate-200 dark:text-slate-700'}`}
                  >
                    {task.status === 'DONE' ? <CheckCircle2 size={24} strokeWidth={3} /> : <Circle size={24} strokeWidth={3} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${theme.bg} ${theme.color}`}>
                        {task.category === 'WORK' ? '工作' : task.category === 'STUDY' ? '学习' : '娱乐'}
                      </span>
                      {task.isPriority && (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 text-[8px] font-black uppercase tracking-widest">
                          <Star size={8} fill="currentColor" /> 重点
                        </span>
                      )}
                    </div>
                    <h4 className={`text-sm font-black truncate ${task.status === 'DONE' ? 'text-slate-300 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400">
                       <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {task.dueDate.split('T')[1]}
                       </div>
                       {task.duration && (
                         <div className="flex items-center gap-1">
                            <span>{task.duration} 分钟</span>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setSwipedTaskId(isSwiped ? null : task.id)} className="p-2 text-slate-300">
                      <ChevronRight size={16} className={isSwiped ? 'rotate-180 transition' : 'transition'} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-fade-edges {
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>
    </div>
  );
};
