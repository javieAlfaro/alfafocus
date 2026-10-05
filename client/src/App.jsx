import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, FolderKanban, Calendar, BarChart2, Flame, User, 
  Settings, CheckCircle, AlertCircle, Info, X, Keyboard 
} from 'lucide-react';
import FocusHub from './components/FocusHub';
import ProjectBreakdown from './components/ProjectBreakdown';
import HabitsHeatMap from './components/HabitsHeatMap';
import CalendarPlanner from './components/CalendarPlanner';
import SettingsModal from './components/SettingsModal';
import ShortcutsModal from './components/ShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { 
  listTasks, createTask, updateTask, deleteTask, 
  listLists, createList, listFocusSessions, recordFocusSession 
} from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('today'); // today | lists | calendar | habits
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Global power-user keyboard shortcuts
  useKeyboardShortcuts({
    onToggleTimer: () => {
      window.dispatchEvent(new CustomEvent('alfafocus:toggle-timer'));
    },
    onResetTimer: () => {
      window.dispatchEvent(new CustomEvent('alfafocus:reset-timer'));
    },
    onSelectView: (view) => {
      setCurrentView(view);
      showToast(`Switched to ${view.toUpperCase()} screen`, 'info');
    },
    onToggleShortcutsModal: () => {
      setIsShortcutsOpen((prev) => !prev);
    },
    onCloseModals: () => {
      setIsSettingsOpen(false);
      setIsShortcutsOpen(false);
    },
  });
  
  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

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
      showToast(nextStatus ? 'Task completed! Keep the momentum.' : 'Task marked active', 'info');
    } catch {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
      showToast('Failed to update task', 'error');
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
      due_date: newTaskData.due_date || null,
      list_id: newTaskData.list_id || (lists[0]?.id || 1),
      parent_task_id: newTaskData.parent_task_id || null,
      progress: 0,
      completed: false,
      created_at: new Date().toISOString(),
    };

    setTasks(prev => [optimisticTask, ...prev]);

    try {
      const created = await createTask(newTaskData);
      setTasks(prev => prev.map(t => t.id === tempId ? created : t));
      showToast('Task created successfully', 'success');
    } catch {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      showToast('Failed to create task', 'error');
    }
  };

  // Shared task deletion handler (with subtask cascade)
  const handleDeleteTask = async (id) => {
    const previous = tasks;
    setTasks(prev => prev.filter(t => t.id !== id && t.parent_task_id !== id));
    try {
      await deleteTask(id);
      showToast('Task removed', 'info');
    } catch {
      setTasks(previous);
      showToast('Failed to delete task', 'error');
    }
  };

  // Create list handler
  const handleCreateList = async (listData) => {
    try {
      const created = await createList(listData);
      setLists(prev => [...prev, created]);
      showToast(`Project list "${created.title}" created`, 'success');
    } catch {
      showToast('Failed to create list', 'error');
    }
  };

  // Shared session logger
  const handleLogSession = async (sessionData) => {
    try {
      const logged = await recordFocusSession(sessionData);
      setSessions(prev => [logged, ...prev]);
      showToast(`Logged ${sessionData.duration_minutes || 25}m focus session`, 'success');
    } catch (err) {
      console.error('Failed to log session:', err);
    }
  };

  return (
    <div className="flex h-screen bg-[#09090B] text-[#FAFAFA] font-sans antialiased overflow-hidden relative">
      
      {/* Persistent Left Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-[#09090B] flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center justify-between px-3 py-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/40">
                A
              </div>
              <span className="text-xl font-bold tracking-tight">AlfaFocus</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
                title="Settings & Audio Chimes"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
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

          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs">
                <User className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-200">AlfaFocus Workspace</p>
                <p className="text-[10px] text-zinc-500">Active Session</p>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition"
              title="Preferences"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Dynamic View Container */}
      {currentView === 'today' && (
        <FocusHub 
          tasks={tasks}
          sessions={sessions}
          loading={loading}
          error={error}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onLogSession={handleLogSession}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onShowToast={showToast}
        />
      )}

      {currentView === 'lists' && (
        <ProjectBreakdown 
          tasks={tasks}
          lists={lists}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onCreateList={handleCreateList}
          onShowToast={showToast}
        />
      )}

      {currentView === 'calendar' && (
        <CalendarPlanner 
          tasks={tasks}
          sessions={sessions}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onShowToast={showToast}
        />
      )}

      {currentView === 'habits' && (
        <HabitsHeatMap 
          tasks={tasks}
          sessions={sessions}
          onShowToast={showToast}
        />
      )}

      {/* Settings & Shortcuts Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveToast={showToast}
      />

      <ShortcutsModal 
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#18181B] border border-zinc-700 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-medium text-white">{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="text-zinc-500 hover:text-zinc-300 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
