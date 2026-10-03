import React, { useState } from 'react';
import { 
  FolderPlus, ChevronRight, ChevronDown, CheckCircle2, Circle, 
  Plus, MoreVertical, Trash2, Clock, CheckSquare
} from 'lucide-react';

export default function ProjectBreakdown({ 
  tasks = [], 
  lists = [], 
  onToggleTask, 
  onAddTask, 
  onDeleteTask,
  onCreateList,
  onShowToast
}) {
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id || 1);
  const [expandedTasks, setExpandedTasks] = useState({ 1: true, 2: true });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtaskForId, setAddingSubtaskForId] = useState(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const activeList = lists.find(l => l.id === selectedListId) || lists[0];
  const listTasks = tasks.filter(t => t.list_id === selectedListId || (!t.list_id && selectedListId === 1));

  // Separate root tasks from nested subtasks
  const rootTasks = listTasks.filter(t => !t.parent_task_id);
  const getSubtasks = (parentId) => listTasks.filter(t => t.parent_task_id === parentId);

  const toggleExpand = (id) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
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
  };

  // Calculate list progress
  const totalTasks = listTasks.length;
  const completedTasks = listTasks.filter(t => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090B] text-[#FAFAFA]">
      
      {/* Sub-sidebar: Project Folders / Lists */}
      <aside className="w-56 border-r border-zinc-800 bg-[#09090B] p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Project Lists</span>
            <button 
              onClick={() => setIsCreatingList(!isCreatingList)}
              className="text-zinc-400 hover:text-emerald-400 transition" 
              title="New List"
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
                  onCreateList({ title: newListName.trim(), color: '#10B981' });
                }
                setNewListName('');
                setIsCreatingList(false);
              }}
              className="mb-3 p-2 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2"
            >
              <input
                type="text"
                placeholder="List name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                autoFocus
                className="w-full px-2 py-1 bg-[#18181B] border border-zinc-700 rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreatingList(false)}
                  className="px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-500"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1">
            {lists.map((list) => {
              const count = tasks.filter(t => t.list_id === list.id || (!t.list_id && list.id === 1)).length;
              const isSelected = selectedListId === list.id;
              return (
                <button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                    isSelected 
                      ? 'bg-zinc-800 text-white font-medium shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: list.color }}></span>
                    <span className="truncate">{list.title}</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List summary */}
        <div className="p-3 bg-[#18181B] rounded-xl border border-zinc-800 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-200">{activeList?.title}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{completedTasks} of {totalTasks} completed</p>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </aside>

      {/* Main Breakdown Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-6 flex justify-between items-end border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <span>Projects</span>
              <span>&rsaquo;</span>
              <span>{activeList?.title}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{activeList?.title}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-zinc-500 block">Overall Progress</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-36 bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <span className="text-sm font-bold text-emerald-400">{progressPercent}%</span>
              </div>
            </div>

            <div className="text-right border-l border-zinc-800 pl-6">
              <span className="text-xs text-zinc-500 block">Completed</span>
              <span className="text-sm font-bold text-zinc-200">{completedTasks} / {totalTasks} Tasks</span>
            </div>
          </div>
        </header>

        {/* Hierarchical Task List */}
        <div className="space-y-4 max-w-4xl">
          {rootTasks.length === 0 ? (
            <div className="p-8 text-center bg-[#18181B] rounded-2xl border border-zinc-800 text-zinc-500 text-sm">
              No tasks in this project yet. Add tasks from the Today screen or create one below.
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
                    <div className="flex items-center gap-3 flex-1">
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

                      <div className="flex-1">
                        <span className={`text-sm font-semibold ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
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

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {task.category || 'WORK'}
                      </span>
                      <button 
                        onClick={() => setAddingSubtaskForId(addingSubtaskForId === task.id ? null : task.id)}
                        className="text-xs flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition"
                        title="Add subtask"
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
      </main>

    </div>
  );
}
