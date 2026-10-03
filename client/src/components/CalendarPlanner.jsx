import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, 
  CheckCircle2, Circle, Plus, Trash2, Tag, AlertCircle, Check 
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarPlanner({ 
  tasks = [], 
  sessions = [], 
  onAddTask, 
  onToggleTask, 
  onDeleteTask,
  onShowToast
}) {
  // Calendar viewed month: default to October 2026
  const [viewDate, setViewDate] = useState(new Date(2026, 9, 1));
  const [selectedDateStr, setSelectedDateStr] = useState('2026-10-03');
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  
  // Quick-add state for the inspector
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('WORK');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  const currentYear = viewDate.getFullYear();
  const currentMonthIdx = viewDate.getMonth();
  const currentMonthName = `${MONTH_NAMES[currentMonthIdx]} ${currentYear}`;

  // Calculate calendar layout
  const firstDayOfMonth = new Date(currentYear, currentMonthIdx, 1);
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const startDayOffset = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

  // Navigate months
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonthIdx - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonthIdx + 1, 1));
  };

  const handleGoToday = () => {
    setViewDate(new Date(2026, 9, 1));
    setSelectedDateStr('2026-10-03');
  };

  // Build Month cells
  const calendarCells = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push({ empty: true, key: `pad-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasks.filter(t => t.due_date === dateStr || (!t.due_date && dateStr === '2026-10-03'));
    const daySessions = sessions.filter(s => s.completed_at?.startsWith(dateStr));
    
    calendarCells.push({
      empty: false,
      day,
      dateStr,
      tasks: dayTasks,
      sessions: daySessions,
      isToday: dateStr === '2026-10-03',
      isSelected: dateStr === selectedDateStr,
      key: `day-${dateStr}`
    });
  }

  // Selected date details
  const selectedDayCell = calendarCells.find(c => !c.empty && c.dateStr === selectedDateStr) || {
    tasks: tasks.filter(t => t.due_date === selectedDateStr),
    sessions: sessions.filter(s => s.completed_at?.startsWith(selectedDateStr)),
  };

  const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Handle Quick Add for selected date
  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (onAddTask) {
      onAddTask({
        title: newTaskTitle.trim(),
        category: newTaskCategory,
        priority: newTaskPriority,
        due_date: selectedDateStr,
      });
      if (onShowToast) onShowToast(`Task scheduled for ${selectedDateStr}`, 'success');
    }
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090B] text-[#FAFAFA]">
      
      {/* Main Calendar View Area */}
      <main className="flex-1 p-8 overflow-y-auto flex flex-col">
        {/* Header Controls */}
        <header className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-white">{currentMonthName}</h1>
            <div className="flex items-center gap-1 bg-[#18181B] border border-zinc-800 rounded-lg p-1">
              <button 
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={handleGoToday}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg text-emerald-400 border border-zinc-700 transition"
            >
              Today
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 p-1 bg-[#18181B] border border-zinc-800 rounded-xl text-xs">
            <button 
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 font-semibold rounded-lg transition ${
                viewMode === 'month' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Month
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 font-semibold rounded-lg transition ${
                viewMode === 'week' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Week
            </button>
          </div>
        </header>

        {viewMode === 'month' ? (
          <>
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* 7-column Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
              {calendarCells.map((cell) => {
                if (cell.empty) {
                  return (
                    <div 
                      key={cell.key} 
                      className="min-h-[100px] bg-zinc-950/40 rounded-xl border border-zinc-900/60"
                    />
                  );
                }

                const isSelected = cell.dateStr === selectedDateStr;

                return (
                  <div
                    key={cell.key}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[100px] p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-zinc-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/60' 
                        : cell.isToday 
                          ? 'bg-[#18181B] border-emerald-800/80 hover:border-emerald-700' 
                          : 'bg-[#18181B] border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-semibold ${
                        cell.isToday 
                          ? 'text-emerald-400 font-bold' 
                          : isSelected 
                            ? 'text-white' 
                            : 'text-zinc-400'
                      }`}>
                        {cell.day}
                      </span>
                      {cell.isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      )}
                    </div>

                    {/* Task and Focus Badges inside cell */}
                    <div className="space-y-1 overflow-hidden flex-1">
                      {cell.tasks.slice(0, 2).map((t) => (
                        <div 
                          key={t.id}
                          className={`truncate px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${
                            t.completed 
                              ? 'bg-zinc-800/60 text-zinc-500 line-through' 
                              : t.category === 'WORK' 
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                : t.category === 'STUDY'
                                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                                  : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <span className="truncate">{t.title}</span>
                        </div>
                      ))}

                      {cell.tasks.length > 2 && (
                        <div className="text-[9px] text-zinc-400 font-semibold px-1">
                          +{cell.tasks.length - 2} more
                        </div>
                      )}

                      {cell.sessions.length > 0 && (
                        <div className="truncate px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-900 text-emerald-400 border border-zinc-800">
                          {cell.sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)}m focus
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Week View Mode */
          <div className="grid grid-cols-7 gap-3 flex-1">
            {calendarCells.filter(c => !c.empty).slice(0, 7).map((cell) => {
              const isSelected = cell.dateStr === selectedDateStr;
              return (
                <div 
                  key={cell.key}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-zinc-800/90 border-emerald-500 ring-1 ring-emerald-500' 
                      : 'bg-[#18181B] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-zinc-400 font-medium">Day {cell.day}</span>
                      {cell.isToday && <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-400 font-bold">TODAY</span>}
                    </div>
                    <div className="space-y-2">
                      {cell.tasks.map(t => (
                        <div key={t.id} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                          <p className={`font-medium ${t.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                            {t.title}
                          </p>
                          <span className="text-[10px] text-emerald-400 mt-1 block">{t.category || 'WORK'}</span>
                        </div>
                      ))}
                      {cell.tasks.length === 0 && (
                        <p className="text-[11px] text-zinc-600 italic">No tasks</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedDateStr(cell.dateStr); setIsAddingTask(true); }}
                    className="w-full mt-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs flex items-center justify-center gap-1 border border-zinc-800"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Right Selected Date Inspector Panel */}
      <aside className="w-80 border-l border-zinc-800 bg-[#09090B] p-6 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="mb-6">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              Date Inspector
            </span>
            <h2 className="text-lg font-bold text-white leading-tight">{formattedSelectedDate}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Tasks &amp; Focus Blocks</p>
          </div>

          {/* Quick Schedule Form Toggle */}
          {isAddingTask ? (
            <form onSubmit={handleQuickAdd} className="mb-6 p-4 rounded-xl bg-[#18181B] border border-emerald-800/80 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-emerald-400">
                <span>Schedule New Item</span>
                <button 
                  type="button" 
                  onClick={() => setIsAddingTask(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
              <input 
                type="text"
                placeholder="Session or task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-[11px] text-zinc-300"
                >
                  <option value="WORK">Work</option>
                  <option value="STUDY">Study</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="HEALTH">Health</option>
                </select>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-[11px] text-zinc-300"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition"
              >
                Confirm Schedule
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingTask(true)}
              className="w-full mb-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold text-xs rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Schedule on this Day
            </button>
          )}

          {/* Tasks for this day */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Tasks Scheduled</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {selectedDayCell.tasks?.filter(t => t.completed).length || 0} / {selectedDayCell.tasks?.length || 0}
              </span>
            </h3>

            {selectedDayCell.tasks && selectedDayCell.tasks.length > 0 ? (
              <div className="space-y-2">
                {selectedDayCell.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button 
                        onClick={() => onToggleTask && onToggleTask(task)}
                        className="text-zinc-500 hover:text-emerald-400 transition shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>
                      <div className="truncate">
                        <p className={`text-xs truncate ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          {task.title}
                        </p>
                        <span className="text-[10px] text-zinc-500">{task.category || 'WORK'}</span>
                      </div>
                    </div>
                    {onDeleteTask && (
                      <button 
                        onClick={() => onDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center">
                <AlertCircle className="w-5 h-5 text-zinc-600 mx-auto mb-1.5" />
                <p className="text-xs text-zinc-400">No tasks on this date</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">Click schedule above to plan ahead</p>
              </div>
            )}
          </div>

          {/* Focus Sessions list */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Focus Sessions Logged
            </h3>
            {selectedDayCell.sessions && selectedDayCell.sessions.length > 0 ? (
              <div className="space-y-2">
                {selectedDayCell.sessions.map((session, sIdx) => (
                  <div key={session.id || sIdx} className="p-3 rounded-xl bg-[#18181B] border border-zinc-800">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-zinc-400 font-mono">
                        {session.duration_minutes || 25} Minutes
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[9px] font-bold uppercase">
                        {session.mode || 'POMODORO'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-100">{session.task_title || 'General Focus'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">No focus sessions recorded on this day.</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 text-center text-[11px] text-zinc-500">
          Syncs with Today &amp; Focus Hub
        </div>
      </aside>

    </div>
  );
}
