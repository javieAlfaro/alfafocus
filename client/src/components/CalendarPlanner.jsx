import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, 
  CheckCircle2, Circle, Plus, Trash2, Tag, AlertCircle, Check 
} from 'lucide-react';

import { localDateKey, sessionDay } from '../utils/calendarDates';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarPlanner({ 
  tasks = [], 
  sessions = [], 
  onAddTask, onUpdateTask, onOpenTask, calendarTarget,
  onToggleTask, 
  onDeleteTask,
  onShowToast
}) {
  // Dynamic current date reference
  const todayObj = new Date();
  const todayDateStr = localDateKey(todayObj);

  // Calendar viewed month: default to current month
  const [viewDate, setViewDate] = useState(() => new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));
  const [selectedDateStr, setSelectedDateStr] = useState(todayDateStr);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  
  const [scheduleTaskId, setScheduleTaskId] = useState('');
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    if (!calendarTarget) return;
    const [year, month] = calendarTarget.date.split('-').map(Number);
    setViewDate(new Date(year, month - 1, 1));
    setSelectedDateStr(calendarTarget.date);
    setViewMode('month');
  }, [calendarTarget]);

  // Quick-add state for the inspector
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('WORK');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  const currentYear = viewDate.getFullYear();
  const currentMonthIdx = viewDate.getMonth();
  const currentMonthName = `${MONTH_NAMES[currentMonthIdx]} ${currentYear}`;

  const selectedDay = new Date(selectedDateStr + 'T00:00:00');
  const weekStart = new Date(selectedDay);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const shiftPeriod = offset => {
    if (viewMode === 'month') {
      setViewDate(new Date(currentYear, currentMonthIdx + offset, 1));
    } else {
      const next = new Date(selectedDay);
      next.setDate(next.getDate() + offset * 7);
      setSelectedDateStr(localDateKey(next));
      setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const handleGoToday = () => {
    setViewDate(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));
    setSelectedDateStr(todayDateStr);
  };

  const buildDay = date => {
    const dateStr = localDateKey(date);
    return {
      day: date.getDate(),
      dateStr,
      key: dateStr,
      isToday: dateStr === todayDateStr,
      tasks: tasks.filter(task => task.due_date === dateStr),
      sessions: sessions.filter(session => sessionDay(session) === dateStr),
    };
  };

  const monthPadding = Array.from({ length: new Date(currentYear, currentMonthIdx, 1).getDay() },
    (_, index) => ({ empty: true, key: 'pad-' + index }));
  const monthDays = Array.from({ length: new Date(currentYear, currentMonthIdx + 1, 0).getDate() },
    (_, index) => buildDay(new Date(currentYear, currentMonthIdx, index + 1)));
  const calendarCells = [...monthPadding, ...monthDays];
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return buildDay(date);
  });
  const selectedDayCell = buildDay(selectedDay);

  const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Handle Quick Add for selected date
  const handleQuickAdd = async event => {
    event.preventDefault();
    if (!newTaskTitle.trim() || !onAddTask) return;
    const saved = await onAddTask({
      title: newTaskTitle.trim(), category: newTaskCategory,
      priority: newTaskPriority, due_date: selectedDateStr,
    });
    if (saved) {
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleScheduleExisting = async event => {
    event.preventDefault();
    const task = tasks.find(row => String(row.id) === scheduleTaskId);
    if (!task || scheduling) return;
    setScheduling(true);
    const saved = await onUpdateTask(task.id, { due_date: selectedDateStr });
    setScheduling(false);
    if (saved) {
      setScheduleTaskId('');
      onShowToast?.('Scheduled for ' + formattedSelectedDate);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[#09090B] xl:flex-row xl:overflow-hidden text-[#FAFAFA]">
      
      {/* Main Calendar View Area */}
      <main className="min-w-0 flex-1 overflow-auto p-4 xl:p-8 flex flex-col">
        {/* Header Controls */}
        <header className="mb-6 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-white">{viewMode === 'week' ? 'Week of ' + weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : currentMonthName}</h1>
            <div className="flex items-center gap-1 bg-[#18181B] border border-zinc-800 rounded-lg p-1">
              <button 
                onClick={() => shiftPeriod(-1)}
                aria-label={'Previous ' + viewMode}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => shiftPeriod(1)}
                aria-label={'Next ' + viewMode}
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
              onClick={() => {
                if (currentYear !== selectedDay.getFullYear() || currentMonthIdx !== selectedDay.getMonth()) {
                  setSelectedDateStr(localDateKey(viewDate));
                }
                setViewMode('week');
              }}
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
          <div className="grid min-w-[550px] grid-cols-7 gap-3 flex-1">
            {weekDays.map((cell) => {
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
      <aside className="flex w-full shrink-0 flex-col justify-between border-t border-zinc-800 bg-[#09090B] p-4 xl:w-80 xl:overflow-y-auto xl:border-l xl:border-t-0 xl:p-6">
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

          {onUpdateTask && tasks.some(task => !task.completed && task.due_date !== selectedDateStr) && (
            <form onSubmit={handleScheduleExisting} className="mb-6 space-y-2">
              <label className="block text-xs text-zinc-400">
                Schedule an existing task
                <select value={scheduleTaskId} onChange={event => setScheduleTaskId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-xs text-zinc-200">
                  <option value="">Choose a task</option>
                  {tasks.filter(task => !task.completed && task.due_date !== selectedDateStr).map(task => (
                    <option key={task.id} value={String(task.id)}>{task.title}{task.due_date ? ' · ' + task.due_date : ''}</option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={!scheduleTaskId || scheduling}
                className="w-full rounded-lg bg-zinc-800 p-2 text-xs text-emerald-300 disabled:opacity-50">
                {scheduling ? 'Saving…' : 'Schedule existing task'}
              </button>
            </form>
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
                        onClick={() => onToggleTask?.(task)}
                        aria-label={(task.completed ? 'Reopen ' : 'Complete ') + task.title}
                        className="text-zinc-500 hover:text-emerald-400 transition shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>
                      <div className="truncate">
                        <button type="button" onClick={() => onOpenTask?.(task.id)}
                          className={`block max-w-full truncate text-left text-xs hover:underline ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          {task.title}
                        </button>
                        <span className="text-[10px] text-zinc-500">{task.category || 'WORK'}</span>
                      </div>
                    </div>
                    {onDeleteTask && (
                      <button 
                        onClick={() => onDeleteTask(task.id)}
                        aria-label={'Delete ' + task.title}
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
                    {tasks.some(task => task.id === session.task_id) ? (
                      <button type="button" className="text-left text-xs font-semibold text-emerald-300 hover:underline"
                        onClick={() => onOpenTask?.(session.task_id)}>{session.task_title || 'Focus Session'}</button>
                    ) : <p className="text-xs font-semibold text-zinc-100">{session.task_title || 'General Focus'}</p>}
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
