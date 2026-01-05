
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { 
  User, Sun, Moon, Timer, Play, Pause, RotateCcw, Save, 
  Camera, Sparkles, ChevronRight, Heart, Check, Loader2, 
  Image as ImageIcon, X, Zap 
} from 'lucide-react';
import { getDailyHappiness } from '../services/geminiService';

interface Props {
  profile: UserProfile;
  theme: 'LIGHT' | 'DARK';
  onUpdateProfile: (p: Partial<UserProfile>) => void;
  onToggleTheme: () => void;
}

export const ProfileModule: React.FC<Props> = ({ profile, theme, onUpdateProfile, onToggleTheme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [tomatoTime, setTomatoTime] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Happiness State
  const [happiness, setHappiness] = useState<string>('');
  const [isHappinessLoading, setIsHappinessLoading] = useState(false);
  const [isHappinessDone, setIsHappinessDone] = useState(false);

  useEffect(() => {
    const fetchHappiness = async () => {
      setIsHappinessLoading(true);
      const msg = await getDailyHappiness();
      setHappiness(msg);
      setIsHappinessLoading(false);
    };
    fetchHappiness();
  }, []);

  useEffect(() => {
    if (isTimerRunning && tomatoTime > 0) {
      timerRef.current = window.setInterval(() => setTomatoTime(t => t - 1), 1000);
    } else if (tomatoTime === 0) {
      setIsTimerRunning(false);
      alert('专注时刻结束，休息一下吧！');
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, tomatoTime]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTomatoTime(25 * 60);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ avatar: reader.result as string });
        setShowAvatarMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setShowAvatarMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("无法访问相机，请检查权限。");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onUpdateProfile({ avatar: dataUrl });
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black italic tracking-tighter">我的账号</h2>
         <button onClick={onToggleTheme} className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition">
           {theme === 'LIGHT' ? <Moon size={20} className="text-indigo-600" /> : <Sun size={20} className="text-yellow-400" />}
         </button>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] shadow-xl border border-slate-50 dark:border-slate-800 flex items-center gap-6">
         <div className="relative group">
            <button 
              onClick={() => setShowAvatarMenu(true)}
              className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-pink-400 to-orange-400 p-1 shadow-lg hover:scale-105 transition-all focus:outline-none"
            >
               <div className="w-full h-full bg-white dark:bg-slate-800 rounded-[2.2rem] overflow-hidden">
                  <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.nickname}`} alt="avatar" className="w-full h-full object-cover" />
               </div>
            </button>
            <div className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl border-2 border-white dark:border-slate-900 shadow-md pointer-events-none">
              <Camera size={14} />
            </div>
         </div>
         <div className="flex-1">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{profile.nickname || '未命名选手'}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
               {profile.gender === 'MALE' ? '👦 少年' : '👧 少女'} • {profile.age}岁
            </p>
            <button onClick={() => setIsEditing(true)} className="mt-3 flex items-center gap-1 text-[10px] font-black text-pink-500 uppercase tracking-tighter hover:gap-2 transition-all">编辑档案 <ChevronRight size={12} /></button>
         </div>
      </div>

      {/* Avatar Action Menu */}
      {showAvatarMenu && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-md flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-[3rem] p-8 animate-in slide-in-from-bottom-10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black italic">更换头像</h3>
               <button onClick={() => setShowAvatarMenu(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button 
                onClick={startCamera}
                className="flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-blue-500 transition-all active:scale-95"
              >
                <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl"><Camera size={24} /></div>
                <span className="text-sm font-black">拍照上传</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-pink-500 transition-all active:scale-95"
              >
                <div className="p-4 bg-pink-100 text-pink-600 rounded-2xl"><ImageIcon size={24} /></div>
                <span className="text-sm font-black">相册选择</span>
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect} 
            />
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm aspect-square bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/20">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="mt-12 flex items-center gap-8">
            <button 
              onClick={stopCamera}
              className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition"
            >
              <X size={24} />
            </button>
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition group"
            >
              <div className="w-16 h-16 rounded-full border-4 border-slate-900 flex items-center justify-center">
                 <Zap size={24} fill="currentColor" className="text-slate-900 group-hover:scale-125 transition-transform" />
              </div>
            </button>
            <div className="w-16 h-16" /> {/* Spacer */}
          </div>
          <p className="mt-8 text-white/40 text-[10px] font-black uppercase tracking-widest">点击中心按钮即刻捕捉</p>
        </div>
      )}

      {/* Today's Little Happiness Section */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-orange-950/20 p-8 rounded-[3.5rem] border border-orange-100 dark:border-orange-900/30 relative overflow-hidden group">
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2.5 bg-orange-400 text-white rounded-2xl shadow-lg shadow-orange-200">
                  <Heart size={20} fill="white" />
               </div>
               <h3 className="text-lg font-black italic text-slate-800 dark:text-orange-200">今日幸福小事</h3>
            </div>
            
            <div className="min-h-[60px] flex items-center">
               {isHappinessLoading ? (
                  <div className="flex items-center gap-2 text-slate-400">
                     <Loader2 size={16} className="animate-spin" />
                     <span className="text-xs font-bold">AI 正在捕捉美好瞬间...</span>
                  </div>
               ) : (
                  <p className={`text-lg font-black leading-tight tracking-tight ${isHappinessDone ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                     {happiness}
                  </p>
               )}
            </div>

            <div className="mt-6 flex justify-end">
               <button 
                  onClick={() => setIsHappinessDone(!isHappinessDone)}
                  className={`px-8 py-3.5 rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 shadow-lg flex items-center gap-2 ${isHappinessDone ? 'bg-green-500 text-white shadow-green-100' : 'bg-white text-orange-500 shadow-orange-100'}`}
               >
                  {isHappinessDone ? <Check size={18} strokeWidth={3} /> : null}
                  {isHappinessDone ? '已完成美好' : '标记完成'}
               </button>
            </div>
         </div>
         <div className="absolute -right-6 -top-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
            <Sparkles size={120} className="text-orange-400" />
         </div>
      </div>

      {/* Pomodoro Timer */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
         <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 opacity-60">
               <Timer size={18} />
               <span className="text-[10px] font-black uppercase tracking-widest">番茄钟 • 沉浸专注模式</span>
            </div>
            <div className="text-7xl font-black tracking-tighter my-4 font-mono">{formatTime(tomatoTime)}</div>
            <div className="flex gap-4">
               <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-3xl flex items-center justify-center transition-all active:scale-90">
                 {isTimerRunning ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
               </button>
               <button onClick={handleResetTimer} className="w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-3xl flex items-center justify-center transition-all active:scale-90">
                 <RotateCcw size={32} />
               </button>
            </div>
         </div>
         <div className="absolute top-0 right-0 p-10 opacity-10"><Sparkles size={120} /></div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[120] bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-10 animate-in zoom-in-95 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h4 className="text-2xl font-black italic mb-8">完善你的名片</h4>
              <div className="space-y-6">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">昵称</label>
                   <input type="text" value={profile.nickname} onChange={e => onUpdateProfile({nickname: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">性别</label>
                      <select value={profile.gender} onChange={e => onUpdateProfile({gender: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 font-bold">
                        <option value="MALE">男</option>
                        <option value="FEMALE">女</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">年龄</label>
                      <input type="number" value={profile.age} onChange={e => onUpdateProfile({age: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 font-bold" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">身高 (cm)</label>
                      <input type="number" value={profile.height} onChange={e => onUpdateProfile({height: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">体重 (kg)</label>
                      <input type="number" value={profile.weight} onChange={e => onUpdateProfile({weight: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 font-bold" />
                    </div>
                 </div>
                 <button onClick={() => setIsEditing(false)} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black shadow-xl mt-4 flex items-center justify-center gap-2 active:scale-95 transition">
                   <Save size={20} /> 保存档案
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
