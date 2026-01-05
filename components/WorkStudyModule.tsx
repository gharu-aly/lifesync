
import React, { useState, useRef } from 'react';
import { Task } from '../types';
import { Sparkles, Plus, Loader2, X, Star, Calendar, MessageSquareQuote, Mic, MicOff } from 'lucide-react';
import { WeeklySchedule } from './WeeklySchedule';
import { parseAiTask, getDailySummary, parseVoiceTask } from '../services/geminiService';

interface Props {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onAddTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const WorkStudyModule: React.FC<Props> = ({ tasks, onUpdateTask, onAddTask, onDeleteTask }) => {
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSmartAdd = async () => {
    if (!input.trim()) return;
    setIsParsing(true);
    const parsed = await parseAiTask(input);
    if (parsed) {
      onAddTask({
        id: Date.now().toString(),
        title: parsed.title,
        category: parsed.category,
        status: 'TODO',
        priority: parsed.isPriority ? 'HIGH' : 'MEDIUM',
        isPriority: parsed.isPriority,
        dueDate: `${parsed.date}T${parsed.time}`,
        duration: 60
      });
      setInput('');
    }
    setIsParsing(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsParsing(true);
          const parsed = await parseVoiceTask(base64Audio, 'audio/webm');
          if (parsed) {
            onAddTask({
              id: Date.now().toString(),
              title: parsed.title,
              category: parsed.category,
              status: 'TODO',
              priority: parsed.isPriority ? 'HIGH' : 'MEDIUM',
              isPriority: parsed.isPriority,
              dueDate: `${parsed.date}T${parsed.time}`,
              duration: 60
            });
          }
          setIsParsing(false);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      alert("无法访问麦克风，请检查权限。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const generateSummary = async () => {
    setIsSummarizing(true);
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.dueDate.startsWith(today));
    const result = await getDailySummary(todayTasks);
    setSummary(result);
    setIsSummarizing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 italic tracking-tighter">日程与任务</h2>
        <button 
          onClick={generateSummary}
          disabled={isSummarizing}
          className="bg-indigo-500 text-white px-4 py-2 rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-2 text-[10px] font-black uppercase active:scale-95 transition-all disabled:opacity-50"
        >
          {isSummarizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          今日总结
        </button>
      </div>

      {/* AI Smart Input with Voice Support */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800 flex items-center relative group">
         <div className="pl-5 text-indigo-500"><Sparkles size={18} /></div>
         <input 
           type="text" 
           value={input}
           onChange={(e) => setInput(e.target.value)}
           placeholder={isRecording ? "正在倾听您的计划..." : "AI 智能创建：明天下午3点重点会议..."}
           className={`flex-1 bg-transparent px-3 py-4 text-sm font-bold focus:outline-none transition-all ${isRecording ? 'placeholder-indigo-400 italic' : ''}`}
           onKeyDown={(e) => e.key === 'Enter' && handleSmartAdd()}
           disabled={isRecording}
         />
         
         <div className="flex items-center gap-1.5 pr-1">
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 relative ${
                isRecording 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 animate-pulse' 
                  : 'bg-indigo-50 dark:bg-slate-800 text-indigo-500 hover:bg-indigo-100'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              {isRecording && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              )}
            </button>
            
            <button 
              onClick={handleSmartAdd}
              disabled={isParsing || !input.trim() || isRecording}
              className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition disabled:opacity-30"
            >
              {isParsing ? <Loader2 size={20} className="animate-spin" /> : <Plus size={24} strokeWidth={3} />}
            </button>
         </div>
      </div>

      {/* AI Summary Card */}
      {summary && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800 shadow-sm animate-in slide-in-from-top-4 relative group">
           <button onClick={() => setSummary(null)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500"><X size={16} /></button>
           <div className="flex items-center gap-2 mb-3 text-indigo-500">
             <MessageSquareQuote size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest">今日玩家速报</span>
           </div>
           <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
             {summary}
           </p>
        </div>
      )}

      {/* Optimized Weekly Schedule */}
      <WeeklySchedule tasks={tasks} onAddTask={onAddTask} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} />
    </div>
  );
};
