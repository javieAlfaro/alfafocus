import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Play, Pause, RotateCcw, 
  Plus, Trash2, Clock, AlertCircle, Settings 
} from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import { USING_MOCK_API } from '../api';
import DemoNotice from './DemoNotice';

export default function FocusHub({ 
  tasks = [], 
  loading = false, 
  error = null, 
  onToggleTask, 
  onAddTask, 
  onDeleteTask, 
  onLogSession,
  onOpenSettings,
  onShowToast
}) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('WORK');
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [sessionNotice, setSessionNotice] = useState(null);

  // Active task fallback
  const activeTask = tasks.find(t => t.id === activeTaskId) || tasks[0] || null;

  // Timer completion callback
  const handleTimerComplete = (duration) => {
    const minutes = Math.max(1, Math.round(duration / 60));
    if (onLogSession) {
      onLogSession({
        task_id: activeTask ? activeTask.id : null,
        task_title: activeTask ? activeTask.title : 'General Focus',
        duration_minutes: minutes,
        mode,
      });
    }
    setSessionNotice(`Focus session completed! Logged ${minutes}m to your activity record.`);
    setTimeout(() => setSessionNotice(null), 6000);
  };

  const { formattedTime, isRunning, mode, start, pause, reset, switchMode } = useTimer(handleTimerComplete);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask({
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      priority: 'high',
    });
    setNewTaskTitle('');
    if (onShowToast) onShowToast('Task added to Today', 'success');
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090B] text-[#FAFAFA]">
      
      {/* 1. Main Today's Checklist Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Today's Focus</h1>
            <p className="text-sm text-zinc-400 mt-1">Saturday, October 3, 2026</p>
          </div>
          <div className="flex items-center gap-3">
            {USING_MOCK_API && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Demo Mode Active
              </span>
            )}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-[#18181B] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                title="Settings & Audio Preferences"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Demo Notice */}
        <div className="mb-6">
          <DemoNotice />
        </div>

        {/* Session notification banner */}
        {sessionNotice && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2.5 animate-fadeIn">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{sessionNotice}</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Quick Add Form */}
        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Plus className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text"
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#18181B] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <select 
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value)}
            className="px-3.5 py-3 bg-[#18181B] border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="WORK">WORK</option>
            <option value="PERSONAL">PERSONAL</option>
            <option value="STUDY">STUDY</option>
          </select>
          <button
            type="submit"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition shadow"
          >
            Add
          </button>
        </form>

        {/* Task List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Today's Tasks</h2>
            <span className="text-xs text-zinc-500">{tasks.length} total</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500 bg-[#18181B] rounded-xl border border-zinc-800">
              No tasks scheduled for today. Add one above to get started!
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => setActiveTaskId(task.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                    activeTask?.id === task.id 
                      ? 'bg-zinc-800/60 border-emerald-500/50' 
                      : 'bg-[#18181B] border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 mr-4">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onToggleTask(task); }}
                      className="text-zinc-400 hover:text-emerald-400 transition"
                      aria-label="Toggle task completion"
                    >
                      {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                        {task.title}
                      </p>
                      {task.progress > 0 && !task.completed && (
                        <div className="w-32 bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${task.progress}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                      {task.category || 'WORK'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded transition opacity-60 hover:opacity-100"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 2. Right Panel: Active Focus & Circular Timer */}
      <aside className="w-96 border-l border-zinc-800 bg-[#09090B] p-6 flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Active Task Banner */}
          <div className="p-4 rounded-xl bg-[#18181B] border border-zinc-800">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              Currently Focusing
            </span>
            <h3 className="font-semibold text-sm text-zinc-100 line-clamp-1">
              {activeTask ? activeTask.title : 'Select a task to focus'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{activeTask?.category || 'Focus Session'}</p>
          </div>

          {/* Pomodoro Timer Card */}
          <div className="p-6 rounded-2xl bg-[#18181B] border border-zinc-800 flex flex-col items-center">
            
            {/* Mode Pills */}
            <div className="flex gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-8">
              {['pomodoro', 'deepwork', 'stopwatch'].map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    mode === m 
                      ? 'bg-emerald-600 text-white font-semibold shadow' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {m === 'pomodoro' ? 'Pomo' : m === 'deepwork' ? 'Deep' : 'Stopwatch'}
                </button>
              ))}
            </div>

            {/* Circular Timer Ring */}
            <div className="relative w-48 h-48 rounded-full border-4 border-zinc-800 flex items-center justify-center mb-8">
              <div className="text-center">
                <span className="text-4xl font-mono font-bold tracking-tight text-white block">
                  {formattedTime}
                </span>
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mt-1 block">
                  {isRunning ? 'Focusing' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={isRunning ? pause : start}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-950/50"
              >
                {isRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4 fill-white" /> Start Focus</>}
              </button>
              <button
                onClick={reset}
                className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Daily Progress Tracker */}
        <div className="p-4 rounded-xl bg-[#18181B] border border-zinc-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-zinc-400 font-medium">Daily Progress</span>
            <span className="text-emerald-400 font-bold">{completedCount} / {tasks.length} Tasks</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </aside>

    </div>
  );
}
