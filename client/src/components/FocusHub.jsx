import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Play, Pause, RotateCcw, 
  Plus, Trash2, Clock, AlertCircle, Settings, Radio,
  Target, Trophy, Sparkles, Search, Filter, X 
} from 'lucide-react';
import { TIMER_MODES } from '../hooks/useTimer';
import { localDateKey, sessionDay, taskCompletionDay } from '../utils/calendarDates';

export default function FocusHub({ 
  tasks = [], 
  sessions = [],
  loading = false, 
  error = null, 
  onToggleTask, 
  onAddTask, 
  onDeleteTask, 
  timer, activeTask, onSelectFocusTask, onStartTimer, onOpenTask, ambient,
  onOpenSettings,
  onShowToast
}) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('WORK');
  const { timeLeft, formattedTime, isRunning, isCompleted, hasRun, mode, pause, reset, switchMode, finish } = timer;
  const ambientPlaying = ambient.active !== 'none';
  const toggleQuickAmbient = () => ambientPlaying ? ambient.stop() : ambient.play();

  // Daily target state & calculations
  const [dailyTarget, setDailyTarget] = useState(() => {
    try {
      const stored = localStorage.getItem('alfafocus_daily_target');
      return stored ? parseInt(stored, 10) : 4;
    } catch {
      return 4;
    }
  });

  const handleUpdateTarget = (delta) => {
    const updated = Math.max(1, Math.min(12, dailyTarget + delta));
    setDailyTarget(updated);
    try {
      localStorage.setItem('alfafocus_daily_target', String(updated));
    } catch {}
    if (onShowToast) onShowToast(`Daily target updated to ${updated} blocks`, 'info');
  };

  const todayDateStr = localDateKey();
  const todaySessionsCount = sessions.filter(session => sessionDay(session) === todayDateStr).length;
  const targetPercent = Math.min(100, Math.round((todaySessionsCount / dailyTarget) * 100));
  const isTargetAchieved = todaySessionsCount >= dailyTarget;

  // Active session timer ratio for animated SVG ring
  const totalModeDuration = TIMER_MODES[mode?.toUpperCase()]?.duration || (25 * 60);
  const timerRatio = mode === 'stopwatch' 
    ? ((timeLeft % 60) / 60) 
    : (totalModeDuration > 0 ? Math.max(0, Math.min(1, (totalModeDuration - timeLeft) / totalModeDuration)) : 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const created = await onAddTask({
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      priority: 'high',
      due_date: todayDateStr,
    });
    if (created) setNewTaskTitle('');
  };

  const completedToday = tasks.filter(task => taskCompletionDay(task) === todayDateStr);
  const completedCount = completedToday.length;
  const dailyTasks = tasks.filter(task => task.due_date === todayDateStr || completedToday.includes(task));
  const queue = tasks.filter(task => task.completed
    ? taskCompletionDay(task) === todayDateStr
    : !task.due_date || task.due_date <= todayDateStr);

  // Omni-Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'WORK', 'STUDY', 'PERSONAL', 'HEALTH'];

  const categoryCounts = categories.reduce((acc, cat) => {
    if (cat === 'ALL') {
      acc[cat] = queue.length;
    } else {
      acc[cat] = queue.filter(t => (t.category || 'WORK').toUpperCase() === cat).length;
    }
    return acc;
  }, {});

  const filteredTasks = queue.filter((task) => {
    const matchesSearch = !searchQuery.trim() || (task.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCategory = selectedCategory === 'ALL' || (task.category || 'WORK').toUpperCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groups = [
    ['Overdue', filteredTasks.filter(task => !task.completed && task.due_date && task.due_date < todayDateStr)],
    ['Due today', filteredTasks.filter(task => !task.completed && task.due_date === todayDateStr)],
    ['Completed today', filteredTasks.filter(task => task.completed)],
    ['Unscheduled', filteredTasks.filter(task => !task.completed && !task.due_date)],
  ];

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[#09090B] xl:flex-row xl:overflow-hidden text-[#FAFAFA]">
      
      {/* 1. Main Today's Checklist Area */}
      <main className="min-w-0 flex-1 overflow-auto p-4 xl:p-8">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Today's Focus</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Session notification banner */}


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
            <option value="HEALTH">HEALTH</option>
          </select>
          <button
            type="submit"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition shadow"
          >
            Add
          </button>
        </form>

        {/* Omni-Search & Category Tag Filter Pills */}
        <div className="mb-6 space-y-3">
          {/* Omni Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search tasks across titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-[#18181B] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-0.5 rounded"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-semibold shadow'
                      : 'bg-[#18181B] text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Today's Tasks</h2>
            <span className="text-xs text-zinc-500">
              {filteredTasks.length} shown {filteredTasks.length !== queue.length && `(of ${queue.length} total)`}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">Loading tasks...</div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500 bg-[#18181B] rounded-xl border border-zinc-800">
              No tasks scheduled for today. Add one above to get started!
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-[#18181B] rounded-xl border border-zinc-800 space-y-2">
              <p className="text-sm text-zinc-400">
                No tasks match &ldquo;{searchQuery || selectedCategory}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                Clear Search &amp; Filter
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.filter(([, items]) => items.length > 0).map(([label, items]) => (
                <section key={label} className="space-y-2" aria-label={label}>
                  <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</h3>
                  {items.map(task => (
                <div 
                  key={task.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition ${
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
                      <button type="button" onClick={() => onOpenTask(task.id)} className={`text-left text-sm font-medium ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                        {task.title}
                      </button>
                      {task.progress > 0 && !task.completed && (
                        <div className="w-32 bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${task.progress}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => onSelectFocusTask(task.id)}
                      aria-label={'Select ' + task.title + ' for focus'}
                      className="text-xs text-emerald-400 hover:underline">Focus</button>
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
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 2. Right Panel: Active Focus & Circular Timer */}
      <aside className="flex w-full shrink-0 flex-col justify-between gap-6 border-t border-zinc-800 bg-[#09090B] p-4 xl:w-96 xl:overflow-y-auto xl:border-l xl:border-t-0 xl:p-6">
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

            {/* Circular Timer Ring with Animated SVG Arc */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
                <circle
                  cx="96"
                  cy="96"
                  r="84"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="6"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="84"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeDasharray="527.8"
                  strokeDashoffset={String(527.8 * (1 - timerRatio))}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-linear"
                />
              </svg>
              <div className="text-center relative z-10">
                <span className="text-4xl font-mono font-bold tracking-tight text-white block">
                  {formattedTime}
                </span>
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mt-1 block">
                  {isRunning ? 'Focusing' : hasRun ? 'Paused' : isCompleted ? 'Finished' : 'Ready'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={isRunning ? pause : onStartTimer}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-950/50"
              >
                {isRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4 fill-white" /> {hasRun ? 'Resume Focus' : 'Start Focus'}</>}
              </button>
              <button
                onClick={reset}
                className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {mode === 'stopwatch' && hasRun && (
              <button type="button" onClick={finish} className="mt-2 w-full rounded-lg bg-zinc-800 py-2 text-xs text-emerald-300">
                Finish and log
              </button>
            )}

            {/* Quick Ambient Flow Sound Toggle */}
            <div className="w-full mt-4 pt-3.5 border-t border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <Radio className={`w-3.5 h-3.5 ${ambientPlaying ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                <span className="text-[11px]">
                  Ambient: <strong className="text-zinc-200 font-medium">{ambientPlaying ? ambient.volume === 0 ? 'Muted' : 'Playing' : 'Off'}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={toggleQuickAmbient}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                  ambientPlaying 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900' 
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {ambientPlaying ? 'Pause Ambient' : 'Play ambient sound'}
              </button>
            </div>
          </div>
        </div>

        {/* Gamified Daily Target & Completion Ring */}
        <div className="p-4 rounded-xl bg-[#18181B] border border-zinc-800 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Daily Target</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-0.5">
              <button 
                onClick={() => handleUpdateTarget(-1)} 
                className="text-zinc-400 hover:text-white px-1 font-bold text-xs"
                title="Decrease daily target"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold text-emerald-400">{dailyTarget}</span>
              <button 
                onClick={() => handleUpdateTarget(1)} 
                className="text-zinc-400 hover:text-white px-1 font-bold text-xs"
                title="Increase daily target"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            {/* Target Animated Circular Progress Ring */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke={isTargetAchieved ? "#10b981" : "#34d399"}
                  strokeWidth="5"
                  strokeDasharray="163.3"
                  strokeDashoffset={String(163.3 * (1 - targetPercent / 100))}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className="absolute text-[11px] font-mono font-bold text-white">
                {targetPercent}%
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-200">
                {todaySessionsCount} of {dailyTarget} Sessions
              </p>
              {isTargetAchieved ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> Target Reached!
                </span>
              ) : (
                <p className="text-[11px] text-zinc-500">
                  {dailyTarget - todaySessionsCount} more to hit daily goal
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Daily Tasks Progress Tracker */}
        <div className="p-4 rounded-xl bg-[#18181B] border border-zinc-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-zinc-400 font-medium">Daily Task Checklist</span>
            <span className="text-emerald-400 font-bold">{completedCount} / {dailyTasks.length} Tasks</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${dailyTasks.length ? (completedCount / dailyTasks.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </aside>

    </div>
  );
}
