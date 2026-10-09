import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, FolderKanban, Calendar, BarChart2, Flame, User, 
  Settings, CheckCircle, AlertCircle, Info, X, Keyboard, Command,
  LogIn, LogOut 
} from 'lucide-react';
import FocusHub from './components/FocusHub';
import ProjectBreakdown from './components/ProjectBreakdown';
import HabitsHeatMap from './components/HabitsHeatMap';
import CalendarPlanner from './components/CalendarPlanner';
import SettingsModal from './components/SettingsModal';
import ShortcutsModal from './components/ShortcutsModal';
import CommandPalette from './components/CommandPalette';
import AuthModal from './components/AuthModal';
import AuthPage from './components/AuthPage';
import AlfaLogo from './components/AlfaLogo';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { calculateUserStreak } from './utils/streak';
import { 
  listTasks, createTask, updateTask, deleteTask, 
  listLists, createList, listFocusSessions, recordFocusSession,
  getMe 
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('alfafocus_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const loadAllData = async () => {
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
  };

  // Compute dynamic consistency streak from user's sessions and completed tasks
  const userStreak = calculateUserStreak(sessions, tasks);

  const handleLogout = () => {
    localStorage.removeItem('alfafocus_token');
    localStorage.removeItem('alfafocus_user');
    setCurrentUser(null);
    showToast('Signed out of workspace', 'info');
    loadAllData();
  };

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
    onOpenCommandPalette: () => {
      setIsCommandPaletteOpen((prev) => !prev);
    },
    onCloseModals: () => {
      setIsSettingsOpen(false);
      setIsShortcutsOpen(false);
      setIsCommandPaletteOpen(false);
      setIsAuthOpen(false);
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

  // Load shared data on mount and whenever authentication status changes
  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser?.id]);

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

  // If unauthenticated, render the dedicated Login / Register landing page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans antialiased relative">
        <AuthPage 
          onAuthSuccess={(user) => {
            setCurrentUser(user);
          }}
          onShowToast={showToast}
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

  return (
    <div className="flex h-screen bg-[#09090B] text-[#FAFAFA] font-sans antialiased overflow-hidden relative">
      
      {/* Persistent Left Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-[#09090B] flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center justify-between px-3 py-4 mb-6">
            <AlfaLogo 
              variant="full" 
              size="md" 
              onClick={() => setCurrentView('today')} 
            />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
                title="Command Palette (Ctrl+K)"
              >
                <Command className="w-4 h-4" />
              </button>
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
              <Flame className={`w-5 h-5 ${userStreak > 0 ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Streak</span>
            </div>
            <span className={`text-sm font-bold ${userStreak > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {userStreak} {userStreak === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <div className="flex items-center justify-between px-2 py-1">
            <div 
              className="flex items-center gap-2.5 truncate cursor-pointer hover:opacity-85 transition"
              onClick={() => !currentUser && setIsAuthOpen(true)}
              title={currentUser ? `Logged in as ${currentUser.username}` : "Click to Sign In"}
            >
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                currentUser 
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400 font-bold' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}>
                {currentUser ? currentUser.username[0]?.toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-200 truncate">
                  {currentUser ? currentUser.username : 'Guest / Evaluator'}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {currentUser ? 'Active Workspace' : 'Click to Sign In'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="p-1 rounded text-zinc-500 hover:text-emerald-400 transition"
                  title="Sign In / Register"
                >
                  <LogIn className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition"
                title="Preferences"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
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
          currentUser={currentUser}
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

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        onSelectView={setCurrentView}
        onShowToast={showToast}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          loadAllData();
        }}
        onShowToast={showToast}
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
