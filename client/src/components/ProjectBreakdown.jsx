import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderPlus, ChevronRight, ChevronDown, CheckCircle2, Circle, 
  Plus, MoreVertical, Trash2, Clock, CheckSquare, Calendar, Tag, Flag,
  Kanban, List as ListIcon, ArrowRight, ArrowLeft, Edit3, Palette,
  AlertCircle, X
} from 'lucide-react';

const COLOR_PALETTE = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#6366F1', // Indigo
];

export default function ProjectBreakdown({ 
  tasks = [], 
  lists = [], 
  onToggleTask, 
  onAddTask, 
  onUpdateTask,
  onDeleteTask,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onShowToast
}) {
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id || 1);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'
  const [expandedTasks, setExpandedTasks] = useState({ 1: true, 2: true });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtaskForId, setAddingSubtaskForId] = useState(null);
  
  // List creation state
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#10B981');

  // List editing and deletion modals
  const [editingList, setEditingList] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editColor, setEditColor] = useState('#10B981');
  const [listToDelete, setListToDelete] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Root task creation state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('WORK');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const taskInputRef = useRef(null);

  // Keep selectedListId valid when lists change
  useEffect(() => {
    if (lists.length > 0 && !lists.some(l => l.id === selectedListId)) {
      setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId]);

  const activeList = lists.find(l => l.id === selectedListId) || lists[0];
  const listTasks = tasks.filter(t => t.list_id === selectedListId || (!t.list_id && selectedListId === 1));

  // Separate root tasks from nested subtasks
  const rootTasks = listTasks.filter(t => !t.parent_task_id);
  const getSubtasks = (parentId) => listTasks.filter(t => t.parent_task_id === parentId);

  const toggleExpand = (id) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateRootTask = (e) => {
    e?.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask({
      title: newTaskTitle.trim(),
      list_id: selectedListId,
      priority: newTaskPriority,
      category: newTaskCategory,
      due_date: newTaskDueDate || null,
    });
    setNewTaskTitle('');
    setNewTaskDueDate('');
    if (onShowToast) onShowToast(`Task added to ${activeList?.title || 'project'}`, 'success');
  };

  const handleAddSubtask = (parentId) => {
    if (!newSubtaskTitle.trim()) return;
    onAddTask({
      title: newSubtaskTitle.trim(),
      parent_task_id: parentId,
      list_id: selectedListId,
      category: activeList?.title?.toUpperCase() || 'WORK',
      priority: 'medium',
    });
    setNewSubtaskTitle('');
    setAddingSubtaskForId(null);
    if (onShowToast) onShowToast('Subtask added', 'success');
  };

  const handleOpenEditModal = (list, e) => {
    e.stopPropagation();
    setEditingList(list);
    setEditTitle(list.title);
    setEditColor(list.color || '#10B981');
    setActiveMenuId(null);
  };

  const handleSaveEditList = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingList) return;
    if (onUpdateList) {
      onUpdateList(editingList.id, { title: editTitle.trim(), color: editColor });
    }
    setEditingList(null);
  };

  const handleConfirmDelete = () => {
    if (!listToDelete || !onDeleteList) return;
    onDeleteList(listToDelete.id);
    setListToDelete(null);
    setActiveMenuId(null);
  };

  // Calculate list progress
  const totalTasks = listTasks.length;
  const completedTasks = listTasks.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Kanban column grouping
  const todoTasks = rootTasks.filter(t => {
    if (t.completed) return false;
    const sub = getSubtasks(t.id);
    const completedSub = sub.filter(st => st.completed).length;
    return sub.length === 0 || completedSub === 0;
  });

  const inProgressTasks = rootTasks.filter(t => {
    if (t.completed) return false;
    const sub = getSubtasks(t.id);
    const completedSub = sub.filter(st => st.completed).length;
    return (sub.length > 0 && completedSub > 0) || (t.progress > 0 && t.progress < 100);
  });

  const doneTasks = rootTasks.filter(t => t.completed);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090B] text-[#FAFAFA]">
      
      {/* Sub-sidebar: Project Folders / Lists */}
      <aside className="w-64 border-r border-zinc-800 bg-[#09090B] p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Project Folders</span>
            <button 
              onClick={() => setIsCreatingList(!isCreatingList)}
              className="text-zinc-400 hover:text-emerald-400 p-1 rounded-md hover:bg-zinc-800 transition" 
              title="New Project Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {/* New List Inline Form */}
          {isCreatingList && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newListName.trim()) return;
                if (onCreateList) {
                  onCreateList({ title: newListName.trim(), color: newListColor });
                }
                setNewListName('');
                setIsCreatingList(false);
              }}
              className="mb-3 p-3 rounded-xl bg-zinc-900 border border-zinc-700 space-y-2.5 animate-in fade-in duration-150"
            >
              <input
                type="text"
                placeholder="Folder title..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                autoFocus
                className="w-full px-2.5 py-1.5 bg-[#18181B] border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />

              {/* Color Palette Picker */}
              <div className="flex items-center gap-1.5 pt-1">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewListColor(color)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      newListColor === color ? 'scale-125 ring-2 ring-white/60' : 'hover:scale-110 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              <div className="flex gap-1.5 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingList(false)}
                  className="px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-semibold hover:bg-emerald-500 shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* Project List Items */}
          <div className="space-y-1">
            {lists.map((list) => {
              const count = tasks.filter(t => t.list_id === list.id || (!t.list_id && list.id === 1)).length;
              const isSelected = selectedListId === list.id;
              const isMenuOpen = activeMenuId === list.id;

              return (
                <div key={list.id} className="relative group">
                  <div
                    onClick={() => setSelectedListId(list.id)}
                    role="button"
                    tabIndex={0}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition cursor-pointer ${
                      isSelected 
                        ? 'bg-zinc-800 text-white font-medium shadow-sm' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: list.color || '#10B981' }}></span>
                      <span className="truncate">{list.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-500 font-mono">{count}</span>

                      {/* Project Options Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : list.id);
                        }}
                        className={`p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/50 transition opacity-0 group-hover:opacity-100 ${
                          isMenuOpen ? 'opacity-100 bg-zinc-700/50 text-white' : ''
                        }`}
                        title="Project options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Project Dropdown Menu */}
                  {isMenuOpen && (
                    <div 
                      className="absolute right-2 top-full mt-1 z-30 w-36 bg-[#18181B] border border-zinc-700 rounded-xl shadow-2xl py-1 text-xs animate-in fade-in duration-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleOpenEditModal(list, e)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Edit Folder</span>
                      </button>

                      {lists.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setListToDelete(list);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Folder</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* List summary */}
        <div className="p-3.5 bg-[#18181B] rounded-2xl border border-zinc-800 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeList?.color || '#10B981' }} />
            <p className="font-semibold text-zinc-200 truncate">{activeList?.title}</p>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">{completedTasks} of {totalTasks} completed</p>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </aside>

      {/* Main Breakdown Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-6 flex flex-wrap justify-between items-end gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <span>Projects</span>
              <span>&rsaquo;</span>
              <span className="text-zinc-300">{activeList?.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeList?.color || '#10B981' }} />
              <h1 className="text-2xl font-bold tracking-tight text-white">{activeList?.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* View Mode Toggle: List vs Board */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Hierarchical Tree List View"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  viewMode === 'board'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Kanban Columns View"
              >
                <LayoutKanban className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </button>
            </div>

            {/* Overall Progress Stats */}
            <div className="hidden sm:block">
              <span className="text-xs text-zinc-500 block">Overall Progress</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-32 bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <span className="text-sm font-bold text-emerald-400">{progressPercent}%</span>
              </div>
            </div>

            <div className="text-right border-l border-zinc-800 pl-6 hidden sm:block">
              <span className="text-xs text-zinc-500 block">Completed</span>
              <span className="text-sm font-bold text-zinc-200">{completedTasks} / {totalTasks} Tasks</span>
            </div>
          </div>
        </header>

        {/* Quick Add Root Task Bar (Available in both List and Board views) */}
        <form 
          onSubmit={handleCreateRootTask}
          className="mb-6 p-3 bg-[#18181B] border border-zinc-800 rounded-2xl shadow-sm focus-within:border-emerald-500/50 transition-all max-w-5xl"
        >
          <div className="flex items-center gap-3 px-2 py-1">
            <Plus className="w-5 h-5 text-emerald-400 shrink-0" />
            <input 
              ref={taskInputRef}
              type="text"
              placeholder={`Add a new task to ${activeList?.title || 'this project'}... (Press Enter)`}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-zinc-800/80 px-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Priority Select */}
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                {['low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTaskPriority(p)}
                    className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition ${
                      newTaskPriority === p
                        ? p === 'high' ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                          : p === 'medium' ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                          : 'bg-zinc-700 text-zinc-200 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Category Select */}
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-700"
              >
                {['WORK', 'STUDY', 'PERSONAL', 'HEALTH'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Due Date Input */}
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <input 
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="bg-transparent text-[11px] text-zinc-300 focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition shadow-sm"
            >
              Add Task
            </button>
          </div>
        </form>

        {/* ===================== VIEW MODE 1: KANBAN BOARD ===================== */}
        {viewMode === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl pb-8">
            
            {/* Column 1: To Do */}
            <div className="bg-[#121215] border border-zinc-800/90 rounded-2xl p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">To Do</span>
                </div>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">{todoTasks.length}</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {todoTasks.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-8">No tasks in To Do</p>
                ) : (
                  todoTasks.map(task => {
                    const subtasks = getSubtasks(task.id);
                    return (
                      <div key={task.id} className="bg-[#18181B] border border-zinc-800 rounded-xl p-3.5 space-y-2.5 hover:border-zinc-700 transition shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <button 
                            onClick={() => onToggleTask(task)}
                            className="mt-0.5 text-zinc-400 hover:text-emerald-400 transition"
                          >
                            <Circle className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-medium text-zinc-100 flex-1 leading-snug">{task.title}</span>
                          <button 
                            onClick={() => onDeleteTask(task.id)}
                            className="text-zinc-600 hover:text-rose-400 p-0.5 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {subtasks.length > 0 && (
                          <div className="text-[11px] text-zinc-500 font-mono">
                            0/{subtasks.length} subtasks
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                              task.priority === 'high' ? 'bg-rose-500/20 text-rose-300' :
                              task.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {task.priority || 'medium'}
                            </span>
                            {lists.length > 1 && onUpdateTask && (
                              <select
                                value={task.list_id || selectedListId}
                                onChange={(e) => onUpdateTask(task.id, { list_id: Number(e.target.value) || e.target.value })}
                                className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 rounded px-1.5 py-0.5 focus:outline-none"
                                title="Move to folder"
                              >
                                {lists.map(l => (
                                  <option key={l.id} value={l.id}>{l.title}</option>
                                ))}
                              </select>
                            )}
                          </div>

                          <button
                            onClick={() => onToggleTask(task)}
                            className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition"
                            title="Mark Completed"
                          >
                            <span>Done</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="bg-[#121215] border border-zinc-800/90 rounded-2xl p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">In Progress</span>
                </div>
                <span className="text-xs bg-zinc-800 text-amber-400 px-2 py-0.5 rounded-full font-mono">{inProgressTasks.length}</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {inProgressTasks.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-8">No tasks in progress</p>
                ) : (
                  inProgressTasks.map(task => {
                    const subtasks = getSubtasks(task.id);
                    const subCompleted = subtasks.filter(st => st.completed).length;
                    const subProgress = subtasks.length > 0 ? Math.round((subCompleted / subtasks.length) * 100) : 0;

                    return (
                      <div key={task.id} className="bg-[#18181B] border border-zinc-800 rounded-xl p-3.5 space-y-2.5 hover:border-zinc-700 transition shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <button 
                            onClick={() => onToggleTask(task)}
                            className="mt-0.5 text-zinc-400 hover:text-emerald-400 transition"
                          >
                            <Circle className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-medium text-zinc-100 flex-1 leading-snug">{task.title}</span>
                          <button 
                            onClick={() => onDeleteTask(task.id)}
                            className="text-zinc-600 hover:text-rose-400 p-0.5 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {subtasks.length > 0 && (
                          <div className="space-y-1">
                            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                              <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${subProgress}%` }} />
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">{subCompleted}/{subtasks.length} subtasks ({subProgress}%)</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                          <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            task.priority === 'high' ? 'bg-rose-500/20 text-rose-300' :
                            task.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {task.priority || 'medium'}
                          </span>

                          <button
                            onClick={() => onToggleTask(task)}
                            className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition"
                            title="Mark Completed"
                          >
                            <span>Complete</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Done */}
            <div className="bg-[#121215] border border-zinc-800/90 rounded-2xl p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Done</span>
                </div>
                <span className="text-xs bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded-full font-mono">{doneTasks.length}</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {doneTasks.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-8">No completed tasks yet</p>
                ) : (
                  doneTasks.map(task => (
                    <div key={task.id} className="bg-[#18181B] border border-zinc-800 rounded-xl p-3.5 space-y-2 opacity-75 hover:opacity-100 transition shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <button 
                          onClick={() => onToggleTask(task)}
                          className="mt-0.5 text-emerald-400 hover:text-zinc-400 transition"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </button>
                        <span className="text-xs font-medium text-zinc-400 line-through flex-1 leading-snug">{task.title}</span>
                        <button 
                          onClick={() => onDeleteTask(task.id)}
                          className="text-zinc-600 hover:text-rose-400 p-0.5 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                          {task.category || 'WORK'}
                        </span>
                        <button
                          onClick={() => onToggleTask(task)}
                          className="text-[10px] flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition"
                          title="Move back to To Do"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Reopen</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        ) : (
          /* ===================== VIEW MODE 2: HIERARCHICAL TREE LIST ===================== */
          <div className="space-y-4 max-w-5xl">
            {rootTasks.length === 0 ? (
              <div className="p-12 text-center bg-[#18181B] rounded-2xl border border-zinc-800/80 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                  <CheckSquare className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200">No tasks in {activeList?.title || 'this project'} yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Break your project down into achievable goals. Use the creator bar above to add your first task.
                </p>
                <button
                  type="button"
                  onClick={() => taskInputRef.current?.focus()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Create First Task
                </button>
              </div>
            ) : (
              rootTasks.map((task) => {
                const subtasks = getSubtasks(task.id);
                const isExpanded = !!expandedTasks[task.id];
                const subtasksCompleted = subtasks.filter(st => st.completed).length;
                const subtaskProgress = subtasks.length > 0 
                  ? Math.round((subtasksCompleted / subtasks.length) * 100) 
                  : (task.completed ? 100 : 0);

                return (
                  <div key={task.id} className="bg-[#18181B] border border-zinc-800 rounded-xl overflow-hidden shadow-sm transition hover:border-zinc-700">
                    
                    {/* Parent Task Bar */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {subtasks.length > 0 ? (
                          <button 
                            onClick={() => toggleExpand(task.id)}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        ) : (
                          <div className="w-6"></div>
                        )}

                        <button 
                          onClick={() => onToggleTask(task)}
                          className="text-zinc-400 hover:text-emerald-400 transition"
                        >
                          {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-semibold truncate block ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                            {task.title}
                          </span>
                          {subtasks.length > 0 && (
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${subtaskProgress}%` }}></div>
                              </div>
                              <span className="text-[11px] text-zinc-500 font-mono">
                                {subtasksCompleted}/{subtasks.length} subtasks ({subtaskProgress}%)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Priority Badge */}
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          task.priority === 'high' ? 'bg-rose-500/20 text-rose-300' :
                          task.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {task.priority || 'medium'}
                        </span>

                        {/* Move Task to Another List Dropdown */}
                        {lists.length > 1 && onUpdateTask && (
                          <select
                            value={task.list_id || selectedListId}
                            onChange={(e) => onUpdateTask(task.id, { list_id: Number(e.target.value) || e.target.value })}
                            className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 rounded-lg px-2 py-1 focus:outline-none"
                            title="Move task to another folder"
                          >
                            {lists.map(l => (
                              <option key={l.id} value={l.id}>📁 {l.title}</option>
                            ))}
                          </select>
                        )}

                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {task.category || 'WORK'}
                        </span>
                        
                        <button 
                          onClick={() => setAddingSubtaskForId(addingSubtaskForId === task.id ? null : task.id)}
                          className="text-xs flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition"
                          title="Add nested subtask"
                        >
                          <Plus className="w-3.5 h-3.5" /> Subtask
                        </button>
                        
                        <button 
                          onClick={() => onDeleteTask(task.id)}
                          className="text-zinc-500 hover:text-red-400 p-1 rounded transition"
                          title="Delete task and subtasks"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Add Subtask Inline Form */}
                    {addingSubtaskForId === task.id && (
                      <div className="px-6 py-3 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center gap-2">
                        <input 
                          type="text"
                          placeholder="Add nested subtask title..."
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(task.id); }}
                          className="flex-1 bg-[#18181B] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleAddSubtask(task.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                        >
                          Add
                        </button>
                        <button 
                          onClick={() => setAddingSubtaskForId(null)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Nested Subtask Tree Children */}
                    {isExpanded && subtasks.length > 0 && (
                      <div className="bg-[#09090B]/50 border-t border-zinc-800/80 divide-y divide-zinc-800/40">
                        {subtasks.map((st) => (
                          <div key={st.id} className="py-2.5 px-6 pl-14 flex items-center justify-between gap-3 hover:bg-zinc-900/40 transition">
                            <div className="flex items-center gap-3 flex-1">
                              <button 
                                onClick={() => onToggleTask(st)}
                                className="text-zinc-400 hover:text-emerald-400 transition"
                              >
                                {st.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                              </button>
                              <span className={`text-xs ${st.completed ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>
                                {st.title}
                              </span>
                            </div>

                            <button 
                              onClick={() => onDeleteTask(st.id)}
                              className="text-zinc-600 hover:text-red-400 p-1 rounded transition opacity-40 hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Edit Project Folder Modal */}
      {editingList && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-zinc-700 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Edit Project Folder</span>
              </h3>
              <button 
                onClick={() => setEditingList(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditList} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Folder Name</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-2">Accent Color</label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        editColor === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingList(null)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Folder Confirmation Modal */}
      {listToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-zinc-700 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete "{listToDelete.title}"?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">This action will remove the folder.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              💡 <strong>Safe Preservation:</strong> All tasks inside this folder will automatically be preserved and moved to your default project list.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setListToDelete(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
