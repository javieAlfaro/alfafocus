import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, FolderKanban, Calendar, BarChart2, Flame, User 
} from 'lucide-react';
import FocusHub from './components/FocusHub';
import ProjectBreakdown from './components/ProjectBreakdown';
import HabitsHeatMap from './components/HabitsHeatMap';
import CalendarPlanner from './components/CalendarPlanner';
import { 
  listTasks, createTask, updateTask, deleteTask, 
  listLists, listFocusSessions, recordFocusSession 
} from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('today'); // today | lists | calendar | habits
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load shared data on mount
  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      setError(null);
      try {
        const [loadedTasks, loadedLists, loadedSessions] = await Promise.all([
          listTasks(),
          listLists(),
          listFocusSessions(),
        ]);
        setTasks(loadedTasks);
        setLists(loadedLists);
        setSessions(loadedSessions);
      } catch (err) {
        setError(err.message || 'Failed to load application data');
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  // Shared task toggle handler (with optimistic update)
  const handleToggleTask = async (task) => {
    const nextStatus = !task.completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: nextStatus } : t));
    try {
      await updateTask(task.id, { completed: nextStatus });
    } catch {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
      setError('Failed to update task');
    }
  };

  // Shared task creation handler
  const handleAddTask = async (newTaskData) => {
    const tempId = 'temp-' + Date.now();
    const optimisticTask = {
      id: tempId,
      title: newTaskData.title,
      category: newTaskData.category || 'WORK',
      priority: newTaskData.priority || 'medium',
      list_id: newTaskData.list_id || 1,
      parent_task_id: newTaskData.parent_task_id || null,
      progress: 0,
      completed: false,
      created_at: new Date().toISOString(),
    };

    setTasks(prev => [optimisticTask, ...prev]);

    try {
      const created = await createTask(newTaskData);
      setTasks(prev => prev.map(t => t.id === tempId ? created : t));
    } catch {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      setError('Failed to create task');
    }
  };

  // Shared task deletion handler (with subtask cascade)
  const handleDeleteTask = async (id) => {
    const previous = tasks;
    setTasks(prev => prev.filter(t => t.id !== id && t.parent_task_id !== id));
    try {
      await deleteTask(id);
    } catch {
      setTasks(previous);
      setError('Failed to delete task');
    }
  };

  // Shared session logger
  const handleLogSession = async (sessionData) => {
    try {
      const logged = await recordFocusSession(sessionData);
      setSessions(prev => [logged, ...prev]);
    } catch (err) {
      console.error('Failed to log session:', err);
    }
  };

  return (
    <div className="flex h-screen bg-[#09090B] text-[#FAFAFA] font-sans antialiased overflow-hidden">
      
      {/* Persistent Left Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-[#09090B] flex flex-col justify-between p-4 shrink-0">
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
            <button 
              onClick={() => setCurrentView('today')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition ${
                currentView === 'today'
                  ? 'bg-zinc-800/80 text-emerald-400 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Today &amp; Focus
            </button>

            <button 
              onClick={() => setCurrentView('lists')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition ${
                currentView === 'lists'
                  ? 'bg-zinc-800/80 text-emerald-400 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <FolderKanban className="w-4 h-4" /> Lists &amp; Projects
            </button>

            <button 
              onClick={() => setCurrentView('calendar')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition ${
                currentView === 'calendar'
                  ? 'bg-zinc-800/80 text-emerald-400 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Calendar className="w-4 h-4" /> Calendar &amp; Planner
            </button>

            <button 
              onClick={() => setCurrentView('habits')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition ${
                currentView === 'habits'
                  ? 'bg-zinc-800/80 text-emerald-400 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" /> Habits &amp; Stats
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

      {/* Dynamic View Container */}
      {currentView === 'today' && (
        <FocusHub 
          tasks={tasks}
          loading={loading}
          error={error}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onLogSession={handleLogSession}
        />
      )}

      {currentView === 'lists' && (
        <ProjectBreakdown 
          tasks={tasks}
          lists={lists}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {currentView === 'calendar' && (
        <CalendarPlanner 
          tasks={tasks}
          sessions={sessions}
        />
      )}

      {currentView === 'habits' && (
        <HabitsHeatMap 
          tasks={tasks}
          sessions={sessions}
        />
      )}

    </div>
  );
}
