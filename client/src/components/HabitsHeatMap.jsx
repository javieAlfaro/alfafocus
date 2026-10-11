import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, Clock, CheckCircle2, TrendingUp, Droplets, BookOpen, 
  Award, Download, Plus, Trash2, PieChart, Sparkles, ChevronDown, Info 
} from 'lucide-react';
import { calculateUserStreak } from '../utils/streak';

export default function HabitsHeatMap({ sessions = [], tasks = [], currentUser, onShowToast }) {
  const habitsStorageKey = currentUser?.id ? `alfafocus_habits_${currentUser.id}` : 'alfafocus_habits_guest';

  // Habit tracking state with per-user localStorage persistence (default empty for new accounts)
  const [habits, setHabits] = useState(() => {
    try {
      const stored = localStorage.getItem(habitsStorageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);

  // Sync state if currentUser changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(habitsStorageKey);
      setHabits(stored ? JSON.parse(stored) : []);
    } catch {
      setHabits([]);
    }
  }, [habitsStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(habitsStorageKey, JSON.stringify(habits));
    } catch {}
  }, [habits, habitsStorageKey]);

  const toggleHabitDay = (habitId, dayIndex) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const nextHist = [...h.history];
        nextHist[dayIndex] = !nextHist[dayIndex];
        const nextStreak = nextHist.filter(Boolean).length;
        return { ...h, history: nextHist, streak: nextStreak };
      }
      return h;
    }));
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const newHabit = {
      id: Date.now(),
      title: newHabitTitle.trim(),
      icon: 'focus',
      streak: 0,
      history: [false, false, false, false, false, false, false],
    };
    setHabits([...habits, newHabit]);
    setNewHabitTitle('');
    setIsAddingHabit(false);
    if (onShowToast) onShowToast('New habit routine added', 'success');
  };

  const handleDeleteHabit = (id) => {
    setHabits(habits.filter(h => h.id !== id));
    if (onShowToast) onShowToast('Habit removed', 'info');
  };

  // GitHub-style Calendar State
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [intensityMetric, setIntensityMetric] = useState('focus'); // 'focus' | 'tasks'
  const [showMetricDropdown, setShowMetricDropdown] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);

  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  // Helper to format local date YYYY-MM-DD
  const toLocalDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatLongDate = (d) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Generate 53 weeks (~371 days) of calendar data strictly from real sessions and tasks
  const { weeks, monthLabels, yearFocusMinutes, yearSessionsCount, yearTasksCount } = useMemo(() => {
    const now = new Date();
    const isCurrentYear = selectedYear === currentYear;

    let startDate;
    if (isCurrentYear) {
      // Rolling 52 weeks ending on the current week's Saturday
      const currentDayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat
      const thisSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDayOfWeek);
      startDate = new Date(thisSunday.getFullYear(), thisSunday.getMonth(), thisSunday.getDate() - (52 * 7));
    } else {
      // Past calendar year: Sunday on or before Jan 1
      const firstDay = new Date(selectedYear, 0, 1);
      const startDayOfWeek = firstDay.getDay();
      startDate = new Date(selectedYear, 0, 1 - startDayOfWeek);
    }

    const calculatedWeeks = [];
    let curr = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    let totalMins = 0;
    let totalSessions = 0;
    let totalTasks = 0;

    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(curr);
        const dateStr = toLocalDateKey(dateObj);
        const isFuture = isCurrentYear && dateObj > now;
        const isOutsideYear = !isCurrentYear && dateObj.getFullYear() !== selectedYear;

        // Check real sessions for this date
        const daySessions = sessions.filter(s => (s.completed_at || s.created_at || '').startsWith(dateStr));
        const minutes = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
        const sessionCount = daySessions.length;

        // Check completed tasks for this date
        const dayTasks = tasks.filter(t => t.completed && ((t.completed_at || '').startsWith(dateStr) || (!t.completed_at && t.due_date === dateStr)));
        const tasksCount = dayTasks.length;

        if (!isFuture && !isOutsideYear) {
          totalMins += minutes;
          totalSessions += sessionCount;
          totalTasks += tasksCount;
        }

        let level = 0;
        if (intensityMetric === 'focus') {
          if (minutes > 90) level = 4;
          else if (minutes > 50) level = 3;
          else if (minutes > 25) level = 2;
          else if (minutes > 0) level = 1;
        } else {
          if (tasksCount >= 5) level = 4;
          else if (tasksCount >= 3) level = 3;
          else if (tasksCount >= 2) level = 2;
          else if (tasksCount >= 1) level = 1;
        }

        const formattedDate = formatLongDate(dateObj);
        let statusSummary = '';
        if (isFuture) {
          statusSummary = `${formattedDate} (Upcoming)`;
        } else if (minutes > 0 || tasksCount > 0) {
          statusSummary = `${formattedDate}: ${minutes}m focused (${sessionCount} session${sessionCount !== 1 ? 's' : ''}) · ${tasksCount} task${tasksCount !== 1 ? 's' : ''} completed`;
        } else {
          statusSummary = `No activity on ${formattedDate}`;
        }

        week.push({
          dateObj,
          dateStr,
          dayOfWeek: d,
          isFuture,
          isOutsideYear,
          minutes,
          sessionCount,
          tasksCount,
          level,
          formattedDate,
          statusSummary
        });

        curr.setDate(curr.getDate() + 1);
      }
      calculatedWeeks.push(week);
    }

    // Calculate month labels aligned to week columns
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    let prevMonth = -1;
    let prevCol = -99;

    calculatedWeeks.forEach((week, colIdx) => {
      // Find if day 1 of a month falls in this week, or if first column
      const firstOfMonth = week.find(day => day.dateObj.getDate() === 1 && !day.isOutsideYear);
      if (firstOfMonth) {
        const m = firstOfMonth.dateObj.getMonth();
        if (colIdx - prevCol >= 2) {
          labels.push({ colIndex: colIdx, label: monthNames[m] });
          prevCol = colIdx;
          prevMonth = m;
        }
      } else if (colIdx === 0) {
        const validDay = week.find(day => !day.isOutsideYear) || week[0];
        const m = validDay.dateObj.getMonth();
        labels.push({ colIndex: 0, label: monthNames[m] });
        prevCol = 0;
        prevMonth = m;
      }
    });

    return {
      weeks: calculatedWeeks,
      monthLabels: labels,
      yearFocusMinutes: totalMins,
      yearSessionsCount: totalSessions,
      yearTasksCount: totalTasks
    };
  }, [selectedYear, currentYear, sessions, tasks, intensityMetric]);

  const yearFocusHours = (yearFocusMinutes / 60).toFixed(1);

  // GitHub dark theme tile coloring
  const getTileColor = (level, isFuture, isOutsideYear) => {
    if (isFuture || isOutsideYear) {
      return 'bg-zinc-900/30 border border-zinc-800/30 opacity-20 cursor-default';
    }
    switch (level) {
      case 4: return 'bg-[#39d353] border border-[#39d353]/30 shadow-[0_0_8px_rgba(57,211,83,0.35)]'; // Bright neon green
      case 3: return 'bg-[#26a641] border border-[#26a641]/30'; // Vibrant green
      case 2: return 'bg-[#006d32] border border-[#006d32]/30'; // Medium-dark green
      case 1: return 'bg-[#0e4429] border border-[#0e4429]/30'; // Deep emerald green
      default: return 'bg-[#161b22] border border-[#21262d]/60'; // GitHub empty square
    }
  };

  // Dynamic Metrics Engine
  const activeStreak = calculateUserStreak(sessions, tasks);
  const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const totalTasksCount = tasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  let consistencyScore = 0;
  let consistencyLabel = 'No activity yet';
  if (totalTasksCount > 0 || sessions.length > 0) {
    consistencyScore = Math.min(100, Math.round((completionRate * 0.6) + (Math.min(activeStreak, 7) / 7 * 40)));
    if (consistencyScore >= 80) consistencyLabel = 'Top Tier Productivity';
    else if (consistencyScore >= 50) consistencyLabel = 'Steady Momentum';
    else consistencyLabel = 'Building Consistency';
  }

  // Category distribution calculation
  const categoryMinutes = {
    WORK: 0,
    STUDY: 0,
    PERSONAL: 0,
    HEALTH: 0,
  };

  tasks.forEach(t => {
    const cat = (t.category || 'WORK').toUpperCase();
    if (categoryMinutes[cat] !== undefined) {
      categoryMinutes[cat] += t.completed ? 45 : 20;
    }
  });

  sessions.forEach(s => {
    categoryMinutes.WORK += s.duration_minutes || 25;
  });

  const totalCatMins = Object.values(categoryMinutes).reduce((a, b) => a + b, 0);
  const hasCategoryData = totalCatMins > 0;

  // CSV Export Handler
  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Title / Item', 'Category', 'Duration (Mins)', 'Status'],
      ...sessions.map(s => [
        s.completed_at ? s.completed_at.slice(0, 10) : '2026-10-03',
        `Focus Session (${s.mode || 'pomodoro'})`,
        `"${(s.task_title || 'General Focus').replace(/"/g, '""')}"`,
        'WORK',
        s.duration_minutes || 25,
        'Completed'
      ]),
      ...tasks.map(t => [
        t.due_date || t.created_at?.slice(0, 10) || '2026-10-03',
        'Task',
        `"${t.title.replace(/"/g, '""')}"`,
        t.category || 'WORK',
        t.completed ? 25 : 0,
        t.completed ? 'Completed' : 'Pending'
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `alfafocus-productivity-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast('Productivity report CSV downloaded', 'success');
  };

  const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#09090B] text-[#FAFAFA]">
      
      {/* Header with Export CTA */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Habits &amp; Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track daily focus intensity, consistency streaks, and export productivity audits.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold text-xs rounded-xl border border-zinc-700 transition shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </header>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
            <span>Active Streak</span>
            <Flame className={`w-4 h-4 ${activeStreak > 0 ? 'text-emerald-400' : 'text-zinc-500'}`} />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">
            {activeStreak} <span className="text-sm font-normal text-zinc-400">{activeStreak === 1 ? 'Day' : 'Days'}</span>
          </p>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.round((activeStreak / 7) * 100))}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
            <span>Focus Hours</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{totalFocusHours} <span className="text-sm font-normal text-zinc-400">hrs</span></p>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            {sessions.length === 0 ? 'No sessions logged yet' : `${sessions.length} session${sessions.length > 1 ? 's' : ''} recorded`}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
            <span>Tasks Progress</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{completedTasksCount} <span className="text-sm font-normal text-zinc-400">/ {totalTasksCount}</span></p>
          <p className="text-[11px] text-zinc-400 mt-2">
            {totalTasksCount === 0 ? 'No tasks created yet' : `${completionRate}% Completion Rate`}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-900/40 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2">
            <span>Consistency Score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{consistencyScore}%</p>
          <p className="text-[11px] text-emerald-400/90 mt-2 font-medium">{consistencyLabel}</p>
        </div>
      </div>

      {/* GitHub-Style Focus Intensity Heat Map Card */}
      <section className="mb-8">
        {/* Top Header: Total Year Contributions & Settings Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              {intensityMetric === 'focus' 
                ? `${yearFocusHours} hours focused in the ${selectedYear === currentYear ? 'last year' : selectedYear}`
                : `${yearTasksCount} tasks completed in the ${selectedYear === currentYear ? 'last year' : selectedYear}`
              }
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {yearSessionsCount} focus sessions recorded · {yearTasksCount} completed tasks
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMetricDropdown(!showMetricDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition"
            >
              <span>Contribution settings</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMetricDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showMetricDropdown && (
              <div className="absolute right-0 mt-2 w-60 p-2 bg-[#161b22] border border-zinc-700/80 rounded-xl shadow-2xl z-30 text-xs">
                <div className="text-[10px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider">
                  Color Intensity Metric
                </div>
                <button
                  type="button"
                  onClick={() => { setIntensityMetric('focus'); setShowMetricDropdown(false); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition ${
                    intensityMetric === 'focus' 
                      ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/40' 
                      : 'text-zinc-300 hover:bg-zinc-800/80'
                  }`}
                >
                  <div>
                    <p className="font-semibold">Focus Time (Default)</p>
                    <p className="text-[10px] text-zinc-400">Measures deep work duration</p>
                  </div>
                  {intensityMetric === 'focus' && <span className="text-emerald-400">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => { setIntensityMetric('tasks'); setShowMetricDropdown(false); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition mt-1 ${
                    intensityMetric === 'tasks' 
                      ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/40' 
                      : 'text-zinc-300 hover:bg-zinc-800/80'
                  }`}
                >
                  <div>
                    <p className="font-semibold">Tasks Completed</p>
                    <p className="text-[10px] text-zinc-400">Measures volume of tasks done</p>
                  </div>
                  {intensityMetric === 'tasks' && <span className="text-emerald-400">✓</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Card and Year Buttons Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Main GitHub Calendar Box */}
          <div className="flex-1 w-full p-4 sm:p-5 rounded-xl bg-[#0d1117] border border-zinc-800 shadow-sm overflow-hidden">
            
            {/* Live Hover Status */}
            <div className="h-5 mb-2 text-xs text-zinc-400 flex items-center">
              {hoveredDay ? (
                <span className="text-zinc-200 font-medium">
                  {hoveredDay.statusSummary}
                </span>
              ) : (
                <span className="text-zinc-500">
                  Hover over a day square to view activity details
                </span>
              )}
            </div>

            {/* Scrollable 53-week Grid */}
            <div className="overflow-x-auto pb-1">
              <div className="inline-flex flex-col min-w-max">
                {/* Month labels on X-axis */}
                <div className="relative h-5 ml-8 text-[11px] text-zinc-400 select-none">
                  {monthLabels.map(({ colIndex, label }, idx) => (
                    <span
                      key={`${label}-${colIndex}-${idx}`}
                      className="absolute top-0"
                      style={{ left: `${colIndex * 14}px` }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {/* Day labels and Squares Grid */}
                <div className="flex gap-[3px]">
                  {/* Day labels column on Y-axis */}
                  <div className="flex flex-col gap-[3px] text-[10px] text-zinc-500 w-8 select-none pt-0.5">
                    <span className="h-[11px] leading-[11px]"></span>
                    <span className="h-[11px] leading-[11px]">Mon</span>
                    <span className="h-[11px] leading-[11px]"></span>
                    <span className="h-[11px] leading-[11px]">Wed</span>
                    <span className="h-[11px] leading-[11px]"></span>
                    <span className="h-[11px] leading-[11px]">Fri</span>
                    <span className="h-[11px] leading-[11px]"></span>
                  </div>

                  {/* 53 Columns */}
                  <div className="flex gap-[3px]">
                    {weeks.map((week, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-[3px]">
                        {week.map((day) => (
                          <div
                            key={day.dateStr}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            title={day.isFuture ? `${day.formattedDate} (Upcoming)` : day.statusSummary}
                            className={`w-[11px] h-[11px] rounded-[2px] transition-transform hover:scale-125 cursor-pointer ${getTileColor(day.level, day.isFuture, day.isOutsideYear)}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row inside Box: Learn Link & Legend */}
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
              <button
                type="button"
                onClick={() => setShowInfoModal(!showInfoModal)}
                className="text-zinc-400 hover:text-emerald-400 text-[11px] flex items-center gap-1.5 transition"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Learn how we measure focus intensity</span>
              </button>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400 select-none">
                <span>Less</span>
                <div className="flex gap-[3px]">
                  <span className="w-[11px] h-[11px] rounded-[2px] bg-[#161b22] border border-[#21262d]/60" title="Level 0: No activity"></span>
                  <span className="w-[11px] h-[11px] rounded-[2px] bg-[#0e4429]" title="Level 1: 1–25m focus"></span>
                  <span className="w-[11px] h-[11px] rounded-[2px] bg-[#006d32]" title="Level 2: 26–50m focus"></span>
                  <span className="w-[11px] h-[11px] rounded-[2px] bg-[#26a641]" title="Level 3: 51–90m focus"></span>
                  <span className="w-[11px] h-[11px] rounded-[2px] bg-[#39d353]" title="Level 4: 90+ mins focus"></span>
                </div>
                <span>More</span>
              </div>
            </div>

            {/* Collapsible Info Drawer */}
            {showInfoModal && (
              <div className="mt-3 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-xs text-zinc-300 space-y-1.5">
                <p className="font-semibold text-white">Focus Intensity Calibration:</p>
                <p className="text-zinc-400 text-[11px]">
                  {intensityMetric === 'focus' 
                    ? 'Square colors represent focused deep work minutes logged across Pomodoro and Stopwatch sessions: Level 1 (1–25m), Level 2 (26–50m), Level 3 (51–90m), Level 4 (>90m).'
                    : 'Square colors represent tasks checked off on that day: Level 1 (1 task), Level 2 (2 tasks), Level 3 (3–4 tasks), Level 4 (5+ tasks).'
                  }
                </p>
                <p className="text-[11px] text-emerald-400 font-medium">
                  Hovering any square displays both your focused time and completed task count for that day.
                </p>
              </div>
            )}
          </div>

          {/* GitHub-Style Vertical Year Selector Column on the Right */}
          <div className="flex flex-row lg:flex-col gap-2 shrink-0 self-start">
            {availableYears.map(yr => {
              const isActive = selectedYear === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition text-left min-w-[70px] ${
                    isActive 
                      ? 'bg-[#1f6feb] text-white shadow-sm' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80 bg-[#161b22] border border-zinc-800/60'
                  }`}
                >
                  {yr}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom Grid: Category Time Breakdown & Habit Routines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Time Allocation Breakdown */}
        <div className="p-6 rounded-2xl bg-[#18181B] border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Category Time Distribution
            </h2>
            <span className="text-xs text-zinc-400">All-time</span>
          </div>

          {hasCategoryData ? (
            <div className="space-y-4">
              {/* Visual segmented progress bar */}
              <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
                <div 
                  style={{ width: `${(categoryMinutes.WORK / totalCatMins) * 100}%` }} 
                  className="bg-emerald-500 h-full" 
                  title="Work" 
                />
                <div 
                  style={{ width: `${(categoryMinutes.STUDY / totalCatMins) * 100}%` }} 
                  className="bg-purple-500 h-full" 
                  title="Study" 
                />
                <div 
                  style={{ width: `${(categoryMinutes.PERSONAL / totalCatMins) * 100}%` }} 
                  className="bg-amber-500 h-full" 
                  title="Personal" 
                />
                <div 
                  style={{ width: `${(categoryMinutes.HEALTH / totalCatMins) * 100}%` }} 
                  className="bg-teal-500 h-full" 
                  title="Health" 
                />
              </div>

              {/* Category rows */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Work & Projects', key: 'WORK', color: 'bg-emerald-500', mins: categoryMinutes.WORK },
                  { label: 'Study & Coursework', key: 'STUDY', color: 'bg-purple-500', mins: categoryMinutes.STUDY },
                  { label: 'Personal & Creative', key: 'PERSONAL', color: 'bg-amber-500', mins: categoryMinutes.PERSONAL },
                  { label: 'Health & Wellness', key: 'HEALTH', color: 'bg-teal-500', mins: categoryMinutes.HEALTH },
                ].map(cat => (
                  <div key={cat.key} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                      <span className="text-xs font-medium text-zinc-300">{cat.label}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-xs text-zinc-400">
                      <span className="font-mono text-white font-bold">{Math.round((cat.mins / totalCatMins) * 100)}%</span>
                      <span>{cat.mins} mins</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 px-4 text-center border border-dashed border-zinc-800/80 rounded-xl text-zinc-500 text-xs">
              <PieChart className="w-6 h-6 text-zinc-600 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-zinc-400">No category activity recorded</p>
              <p className="text-[11px] text-zinc-600 mt-1">Complete tasks or log focus sessions to view time breakdown.</p>
            </div>
          )}
        </div>

        {/* Daily Habits Tracker */}
        <div className="p-6 rounded-2xl bg-[#18181B] border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-white">Daily Habit Routines</h2>
            <button
              onClick={() => setIsAddingHabit(!isAddingHabit)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Habit
            </button>
          </div>

          {/* Add Habit inline form */}
          {isAddingHabit && (
            <form onSubmit={handleAddHabit} className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="E.g. Drink 2L water, Read 10 pages..."
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                autoFocus
                className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition"
              >
                Add
              </button>
            </form>
          )}

          {habits.length > 0 ? (
            <div className="space-y-3">
              {habits.map((habit) => (
                <div key={habit.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
                      {habit.icon === 'water' ? <Droplets className="w-4 h-4" /> : habit.icon === 'book' ? <BookOpen className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{habit.title}</p>
                      <p className="text-xs text-emerald-400 font-medium">{habit.streak} day streak</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Weekly Bubbles */}
                    <div className="flex items-center gap-1.5">
                      {habit.history.map((done, dIdx) => (
                        <button
                          key={dIdx}
                          onClick={() => toggleHabitDay(habit.id, dIdx)}
                          className={`w-7 h-7 rounded-lg flex flex-col items-center justify-center text-[10px] font-semibold transition ${
                            done 
                              ? 'bg-emerald-600 text-white font-bold' 
                              : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                          title={`${daysLabels[dIdx]} - Click to toggle`}
                        >
                          {daysLabels[dIdx]}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-rose-400 transition ml-1"
                      title="Delete habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 text-center border border-dashed border-zinc-800/80 rounded-xl text-zinc-500 text-xs">
              <Sparkles className="w-6 h-6 text-zinc-600 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-zinc-400">No habit routines added yet</p>
              <p className="text-[11px] text-zinc-600 mt-1">Click &quot;+ New Habit&quot; above to start tracking daily routines.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
