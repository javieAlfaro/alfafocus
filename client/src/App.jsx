import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckSquare, FolderKanban, Calendar, BarChart2, Flame, User, 
  Settings, CheckCircle, AlertCircle, Info, X, Keyboard, Command,
  LogIn, LogOut 
} from 'lucide-react';
import FocusHub from './components/FocusHub';
import TaskInspector from './components/TaskInspector';
import { useTimer } from './hooks/useTimer';
import { useAmbientAudio } from './hooks/useAmbientAudio';
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
  listLists, createList, updateList, deleteList, listFocusSessions, recordFocusSession,
} from './api';

class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ViewErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#09090B] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Something went wrong in this view</h2>
          <p className="text-xs text-zinc-400 max-w-md">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Return to Today Screen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  const [inspectedTaskId, setInspectedTaskId] = useState(null);
  const [selectedFocusTaskId, setSelectedFocusTaskId] = useState(null);
  const [projectTarget, setProjectTarget] = useState(null);
  const [calendarTarget, setCalendarTarget] = useState(null);
  const [failedSessions, setFailedSessions] = useState([]);
  const workspaceVersion = useRef(0);
  const pendingTasks = useRef(new Set());
  const pendingSessionSaves = useRef(new Set());
  const taskWriteVersion = useRef(0);
  const ambient = useAmbientAudio();
  const inspectedTask = tasks.find(task => task.id === inspectedTaskId);
  const selectedFocusTask = tasks.find(task => task.id === selectedFocusTaskId);

  const timer = useTimer((duration, run) => {
    handleLogSession({
      task_id: run.task?.id ?? null,
      task_title: run.task?.title ?? 'General Focus',
      mode: run.mode,
      duration_minutes: Math.max(1, Math.round(duration / 60)),
      client_session_id: crypto.randomUUID(),
    });
  });

  const startTimer = () => timer.start(selectedFocusTask
    ? { id: selectedFocusTask.id, title: selectedFocusTask.title, category: selectedFocusTask.category }
    : null);
  const toggleTimer = () => {
    if (timer.isRunning) timer.pause();
    else startTimer();
  };

  const loadAllData = async version => {
    setLoading(true);
    setError(null);
    try {
      const [loadedTasks, loadedLists, loadedSessions] = await Promise.all([
        listTasks(), listLists(), listFocusSessions(),
      ]);
      if (workspaceVersion.current !== version) return;
      setTasks(loadedTasks);
      setLists(loadedLists);
      setSessions(loadedSessions);
    } catch (err) {
      if (workspaceVersion.current !== version) return;
      if (err.status === 401) {
        handleLogout();
        showToast('Your session expired. Please sign in again.', 'info');
      } else {
        setError(err.message || 'Failed to load application data');
      }
    } finally {
      if (workspaceVersion.current === version) setLoading(false);
    }
  };

  const userStreak = calculateUserStreak(sessions, tasks);

  const handleLogout = () => {
    workspaceVersion.current++;
    pendingTasks.current.clear();
    pendingSessionSaves.current.clear();
    localStorage.removeItem('alfafocus_token');
    localStorage.removeItem('alfafocus_user');
    setCurrentUser(null);
    setTasks([]);
    setLists([]);
    setSessions([]);
    setFailedSessions([]);
    setInspectedTaskId(null);
    setSelectedFocusTaskId(null);
    setProjectTarget(null);
    setCalendarTarget(null);
    setCurrentView('today');
    setIsCommandPaletteOpen(false);
    setIsSettingsOpen(false);
    setIsShortcutsOpen(false);
    setIsAuthOpen(false);
    timer.switchMode('pomodoro');
    ambient.stop();
    showToast('Signed out of workspace', 'info');
  };

  useKeyboardShortcuts({
    onToggleTimer: currentUser && !inspectedTask && !isCommandPaletteOpen ? toggleTimer : undefined,
    onResetTimer: currentUser && !inspectedTask && !isCommandPaletteOpen ? timer.reset : undefined,
    onSelectView: currentUser && !inspectedTask ? setCurrentView : undefined,
    onToggleShortcutsModal: () => setIsShortcutsOpen(prev => !prev),
    onOpenCommandPalette: () => {
      if (currentUser && !inspectedTask) setIsCommandPaletteOpen(prev => !prev);
    },
    onCloseModals: () => {
      setIsSettingsOpen(false);
      setIsShortcutsOpen(false);
      setIsCommandPaletteOpen(false);
      setIsAuthOpen(false);
      setInspectedTaskId(null);
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

  useEffect(() => {
    if (currentUser) loadAllData(++workspaceVersion.current);
    return () => { workspaceVersion.current++; };
  }, [currentUser?.id]);

  const refreshTasks = async version => {
    while (workspaceVersion.current === version) {
      const writeVersion = taskWriteVersion.current;
      const savedTasks = await listTasks();
      if (workspaceVersion.current !== version) return;
      if (taskWriteVersion.current === writeVersion) {
        setTasks(savedTasks);
        return;
      }
    }
  };

  const handleAddTask = async input => {
    const version = workspaceVersion.current;
    try {
      const created = await createTask(input);
      if (workspaceVersion.current !== version) return null;
      taskWriteVersion.current++;
      setTasks(prev => [created, ...prev]);
      if (!lists.some(list => list.id === created.list_id) && created.list_id !== null) {
        listLists().then(saved => {
          if (workspaceVersion.current === version) setLists(saved);
        }).catch(() => {
          if (workspaceVersion.current === version) showToast('Could not refresh projects', 'error');
        });
      }
      showToast('Task created successfully', 'success');
      return created;
    } catch (err) {
      if (workspaceVersion.current === version) showToast(err.message || 'Failed to create task', 'error');
      return null;
    }
  };

  const handleUpdateTask = async (id, fields) => {
    const version = workspaceVersion.current;
    const pending = pendingTasks.current;
    if (pending.has(id)) return null;
    pending.add(id);
    try {
      const updated = await updateTask(id, fields);
      if (workspaceVersion.current !== version) return null;
      taskWriteVersion.current++;
      setTasks(prev => {
        const descendants = new Set([id]);
        if (Object.hasOwn(fields, 'list_id')) {
          for (const parentId of descendants) {
            for (const task of prev) {
              if (task.parent_task_id === parentId) descendants.add(task.id);
            }
          }
        }
        return prev.map(task => task.id === id ? updated
          : descendants.has(task.id) ? { ...task, list_id: updated.list_id } : task);
      });
      if (updated.completed && updated.recurrence_rule) {
        try {
          await refreshTasks(version);
        } catch {
          if (workspaceVersion.current === version) showToast('Task saved. Reload to refresh the recurring schedule.', 'info');
        }
      }
      return workspaceVersion.current === version ? updated : null;
    } catch (err) {
      if (workspaceVersion.current === version) showToast(err.message || 'Failed to update task', 'error');
      return null;
    } finally {
      if (workspaceVersion.current === version) pending.delete(id);
    }
  };

  const handleToggleTask = task => handleUpdateTask(task.id, { completed: !task.completed });

  const handleDeleteTask = async id => {
    const version = workspaceVersion.current;
    try {
      await deleteTask(id);
      if (workspaceVersion.current !== version) return;
      taskWriteVersion.current++;
      const removed = new Set([id]);
      for (const parentId of removed) {
        for (const task of tasks) {
          if (task.parent_task_id === parentId) removed.add(task.id);
        }
      }
      setTasks(prev => prev.filter(task => !removed.has(task.id)));
      setSessions(prev => prev.map(session =>
        removed.has(session.task_id) ? { ...session, task_id: null } : session));
      showToast('Task removed', 'info');
    } catch (err) {
      if (workspaceVersion.current === version) showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const handleCreateList = async input => {
    const version = workspaceVersion.current;
    try {
      const created = await createList(input);
      if (workspaceVersion.current !== version) return null;
      setLists(prev => [...prev, created]);
      showToast('Project created', 'success');
      return created;
    } catch (err) {
      if (workspaceVersion.current === version) showToast(err.message || 'Failed to create project', 'error');
      return null;
    }
  };

  const handleUpdateList = async (id, fields) => {
    const version = workspaceVersion.current;
    try {
      const updated = await updateList(id, fields);
      if (workspaceVersion.current !== version) return null;
      setLists(prev => prev.map(list => list.id === id ? updated : list));
      showToast('Project updated', 'success');
      return updated;
    } catch (err) {
      if (workspaceVersion.current === version) showToast(err.message || 'Failed to update project', 'error');
      return null;
    }
  };

  const handleDeleteList = async id => {
    const version = workspaceVersion.current;
    const destination = lists.find(list => list.id !== id);
    try {
      await deleteList(id, destination?.id ?? null);
      if (workspaceVersion.current !== version) return;
      taskWriteVersion.current++;
      setLists(prev => prev.filter(list => list.id !== id));
      setTasks(prev => prev.map(task => task.list_id === id ? { ...task, list_id: destination?.id ?? null } : task));
      showToast('Project deleted and tasks preserved', 'info');
    } catch (err) {
      if (workspaceVersion.current === version) showToast(err.message || 'Failed to delete project', 'error');
    }
  };

  const handleLogSession = async data => {
    const version = workspaceVersion.current;
    const id = data.client_session_id;
    if (pendingSessionSaves.current.has(id)) return;
    pendingSessionSaves.current.add(id);
    const linkedTask = tasks.some(task => task.id === data.task_id);
    try {
      const logged = await recordFocusSession(linkedTask ? data : { ...data, task_id: null });
      if (workspaceVersion.current !== version) return;
      setSessions(prev => prev.some(row => row.id === logged.id) ? prev : [logged, ...prev]);
      setFailedSessions(prev => prev.filter(row => row.client_session_id !== id));
      showToast('Saved ' + logged.duration_minutes + 'm focus session', 'success');
    } catch {
      if (workspaceVersion.current !== version) return;
      setFailedSessions(prev => prev.some(row => row.client_session_id === id) ? prev : [...prev, data]);
      showToast('Focus session could not be saved. You can retry it from the sidebar.', 'error');
    } finally {
      if (workspaceVersion.current === version) pendingSessionSaves.current.delete(id);
    }
  };

  const openCalendarDay = date => {
    setCalendarTarget({ date });
    setCurrentView('calendar');
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
          <div role={toast.type === 'error' ? 'alert' : 'status'} className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#18181B] border border-zinc-700 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
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
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#09090B] font-sans text-[#FAFAFA] antialiased xl:h-dvh xl:flex-row xl:overflow-hidden">
      
      {/* Persistent Left Sidebar Navigation */}
      <aside className="flex w-full shrink-0 flex-col justify-between border-b border-zinc-800 bg-[#09090B] p-3 xl:w-64 xl:border-b-0 xl:border-r xl:p-4">
        <div>
          {/* Logo */}
          <div className="mb-2 flex items-center justify-between px-3 py-2 xl:mb-6 xl:py-4">
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
          <nav className="grid grid-cols-2 gap-1 xl:block xl:space-y-1">
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
        <div className="mt-2 space-y-2 border-t border-zinc-800 pt-2 xl:mt-0 xl:space-y-3 xl:pt-4">
          {timer.hasRun && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5">
              <button type="button" onClick={() => setCurrentView('today')} className="block max-w-full truncate text-xs text-emerald-400">
                {timer.runTask?.title ?? 'General Focus'}
              </button>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="font-mono">{timer.formattedTime}</span>
                <button type="button" className="rounded-lg bg-zinc-800 px-2 py-1" onClick={toggleTimer}>
                  {timer.isRunning ? 'Pause focus' : 'Resume focus'}
                </button>
              </div>
            </div>
          )}
          {failedSessions.length > 0 && (
            <button type="button" onClick={() => failedSessions.forEach(handleLogSession)}
              className="w-full rounded-lg border border-amber-700 p-2 text-xs text-amber-300">
              Retry {failedSessions.length} unsaved {failedSessions.length === 1 ? 'session' : 'sessions'}
            </button>
          )}
          <div className="hidden items-center justify-between rounded-lg border border-zinc-800 bg-[#18181B] p-2.5 xl:flex">
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

      {/* Dynamic View Container protected by ErrorBoundary */}
      <ViewErrorBoundary onReset={() => setCurrentView('today')}>
        {currentView === 'today' && (
          <FocusHub 
            tasks={tasks}
            sessions={sessions}
            loading={loading}
            error={error}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            timer={timer}
            activeTask={timer.hasRun ? timer.runTask : selectedFocusTask}
            onSelectFocusTask={setSelectedFocusTaskId}
            onStartTimer={startTimer}
            onOpenTask={setInspectedTaskId}
            ambient={ambient}
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
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            projectTarget={projectTarget}
            onOpenTask={setInspectedTaskId}
            onCreateList={handleCreateList}
            onUpdateList={handleUpdateList}
            onDeleteList={handleDeleteList}
            onShowToast={showToast}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarPlanner
            tasks={tasks}
            calendarTarget={calendarTarget}
            onOpenTask={setInspectedTaskId}
            onUpdateTask={handleUpdateTask}
            sessions={sessions}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onShowToast={showToast}
          />
        )}

        {currentView === 'habits' && (
          <HabitsHeatMap onOpenDay={openCalendarDay}
            tasks={tasks}
            sessions={sessions}
            currentUser={currentUser}
            onShowToast={showToast}
          />
        )}
      </ViewErrorBoundary>

      {inspectedTask && (
        <TaskInspector
          key={inspectedTask.id}
          task={inspectedTask}
          project={lists.find(list => list.id === inspectedTask.list_id)}
          canRepeat={inspectedTask.parent_task_id == null && !tasks.some(task => task.parent_task_id === inspectedTask.id)}
          onSave={handleUpdateTask}
          onClose={() => setInspectedTaskId(null)}
          onOpenProject={() => {
            setProjectTarget({ listId: inspectedTask.list_id, taskId: inspectedTask.id });
            setCurrentView('lists');
            setInspectedTaskId(null);
          }}
          onFocus={() => {
            setSelectedFocusTaskId(inspectedTask.id);
            setCurrentView('today');
            setInspectedTaskId(null);
            if (timer.hasRun) showToast('Task selected for your next focus session', 'info');
          }}
        />
      )}

      {/* Settings & Shortcuts Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveToast={showToast}
        ambient={ambient}
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
        onSelectTask={setInspectedTaskId}
        onToggleTimer={toggleTimer}
        onResetTimer={timer.reset}
        ambient={ambient}
        onShowToast={showToast}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
        onShowToast={showToast}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div role={toast.type === 'error' ? 'alert' : 'status'} className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#18181B] border border-zinc-700 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
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
