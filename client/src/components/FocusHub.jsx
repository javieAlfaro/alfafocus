import React, { useState, useEffect } from 'react';
import { 
  Flame, CheckCircle2, Circle, Play, Pause, RotateCcw, 
  Plus, Calendar, CheckSquare, BarChart2, Trash2, User, Clock, AlertCircle
} from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import { listTasks, createTask, updateTask, deleteTask, recordFocusSession, USING_MOCK_API } from '../api';
import DemoNotice from './DemoNotice';

export default function FocusHub() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('WORK');
  const [activeTask, setActiveTask] = useState(null);
  const [sessionNotice, setSessionNotice] = useState(null);

  // Load tasks on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await listTasks();
      setTasks(data);
      if (data.length > 0) {
        setActiveTask(data[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  // Timer completion handler
  const handleTimerComplete = async (duration) => {
    try {
      await recordFocusSession({
        taskId: activeTask ? activeTask.id : null,
        taskTitle: activeTask ? activeTask.title : 'General Focus',
        duration_minutes: Math.max(1, Math.round(duration / 60)),
        mode,
      });
      setSessionNotice(`Focus session completed! Logged ${Math.round(duration / 60)}m to your activity record.`);
      setTimeout(() => setSessionNotice(null), 6000);
    } catch (err) {
      console.error('Failed to log session:', err);
    }
  };

  const { formattedTime, isRunning, mode, start, pause, reset, switchMode } = useTimer(handleTimerComplete);

  const handleToggleTask = async (task) => {
    const nextStatus = !task.completed;
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: nextStatus } : t));
    try {
      await updateTask(task.id, { completed: nextStatus });
    } catch (err) {
      // Revert on error
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
      setError('Failed to update task');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const optimisticId = 'temp-' + Date.now();
    const tempTask = {
      id: optimisticId,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      priority: 'high',
      progress: 0,
      completed: false,
    };

    setTasks([tempTask, ...tasks]);
    setNewTaskTitle('');

    try {
      const created = await createTask({
        title: tempTask.title,
        category: tempTask.category,
        priority: tempTask.priority,
      });
      setTasks(prev => prev.map(t => t.id === optimisticId ? created : t));
      if (!activeTask) setActiveTask(created);
    } catch (err) {
      setTasks(prev => prev.filter(t => t.id !== optimisticId));
      setError('Failed to create task');
    }
  };

  const handleDeleteTask = async (e, id) => {
    e.stopPropagation();
    const previous = tasks;
    setTasks(tasks.filter(t => t.id !== id));
    if (activeTask?.id === id) {
      setActiveTask(tasks.find(t => t.id !== id) || null);
    }
    try {
      await deleteTask(id);
    } catch (err) {
      setTasks(previous);
      setError('Failed to delete task');
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="flex h-screen bg-[#09090B] text-[#FAFAFA] font-sans antialiased overflow-hidden">
      
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-[#09090B] flex flex-col justify-between p-4">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/40">
              A
            </div>
            <span className="text-xl font-bold tracking-tight">AlfaFocus</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/80 text-emerald-400 font-medium text-sm">
              <CheckSquare className="w-4 h-4" /> Today
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 font-medium text-sm transition">
              <CheckSquare className="w-4 h-4" /> Lists & Projects
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 font-medium text-sm transition">
              <Calendar className="w-4 h-4" /> Calendar
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 font-medium text-sm transition">
              <BarChart2 className="w-4 h-4" /> Habits & Stats
            </button>
          </nav>
        </div>

        {/* Bottom User & Streak Profile */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#18181B] border border-zinc-800">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Streak</span>
            </div>
            <span className="text-sm font-bold text-emerald-400">7 Days</span>
          </div>

          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs">
              <User className="w-4 h-4 text-zinc-300" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-zinc-200">Javier Alfaro</p>
              <p className="text-[10px] text-zinc-500">Student Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Today's Checklist Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-6 flex justify-between items-baseline">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Today's Focus</h1>
            <p className="text-sm text-zinc-400 mt-1">October 02, 2026</p>
          </div>
          {USING_MOCK_API && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Demo Mode Active
            </span>
          )}
        </header>

        {/* Course Demo Notice component */}
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
            <button onClick={loadData} className="text-xs font-semibold underline hover:text-white">Retry</button>
          </div>
        )}

        {/* Quick Add Form */}
        <form onSubmit={handleAddTask} className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Plus className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text"
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#18181B] border border-zinc-800 rounded-xl text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
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
                  onClick={() => setActiveTask(task)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                    activeTask?.id === task.id 
                      ? 'bg-zinc-800/60 border-emerald-500/50' 
                      : 'bg-[#18181B] border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 mr-4">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleToggleTask(task); }}
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
                      onClick={(e) => handleDeleteTask(e, task.id)}
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

      {/* 3. Right Panel: Active Focus & Circular Timer */}
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
