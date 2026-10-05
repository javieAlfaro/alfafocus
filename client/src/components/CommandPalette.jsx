import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, CheckSquare, FolderKanban, Calendar, BarChart2, 
  Play, Pause, RotateCcw, Radio, Sparkles, ArrowRight, CornerDownLeft 
} from 'lucide-react';
import { startAmbientSound, stopAmbientSound } from '../utils/audioAlerts';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  tasks = [], 
  onSelectView, 
  onSelectTask,
  onShowToast 
}) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static commands list
  const baseCommands = [
    // Views
    {
      id: 'view-today',
      category: 'Navigation',
      label: 'Switch to Today & Focus',
      icon: CheckSquare,
      action: () => { onSelectView('today'); onClose(); },
    },
    {
      id: 'view-lists',
      category: 'Navigation',
      label: 'Switch to Lists & Projects',
      icon: FolderKanban,
      action: () => { onSelectView('lists'); onClose(); },
    },
    {
      id: 'view-calendar',
      category: 'Navigation',
      label: 'Switch to Calendar & Planner',
      icon: Calendar,
      action: () => { onSelectView('calendar'); onClose(); },
    },
    {
      id: 'view-habits',
      category: 'Navigation',
      label: 'Switch to Habits & Heat Map',
      icon: BarChart2,
      action: () => { onSelectView('habits'); onClose(); },
    },
    // Timer controls
    {
      id: 'timer-toggle',
      category: 'Focus Timer',
      label: 'Start / Pause Active Timer',
      icon: Play,
      action: () => {
        window.dispatchEvent(new CustomEvent('alfafocus:toggle-timer'));
        if (onShowToast) onShowToast('Toggled active timer', 'info');
        onClose();
      },
    },
    {
      id: 'timer-reset',
      category: 'Focus Timer',
      label: 'Reset Focus Timer',
      icon: RotateCcw,
      action: () => {
        window.dispatchEvent(new CustomEvent('alfafocus:reset-timer'));
        if (onShowToast) onShowToast('Timer reset', 'info');
        onClose();
      },
    },
    // Ambient sound
    {
      id: 'audio-alpha',
      category: 'Ambient Flow',
      label: 'Play Alpha Waves (10Hz Binaural Beats)',
      icon: Radio,
      action: () => {
        startAmbientSound('binaural', 0.35);
        if (onShowToast) onShowToast('Playing 10Hz Alpha Waves', 'success');
        onClose();
      },
    },
    {
      id: 'audio-rain',
      category: 'Ambient Flow',
      label: 'Play Gentle Rain (Brownian Noise)',
      icon: Radio,
      action: () => {
        startAmbientSound('rain', 0.35);
        if (onShowToast) onShowToast('Playing Gentle Rain flow', 'success');
        onClose();
      },
    },
    {
      id: 'audio-whitenoise',
      category: 'Ambient Flow',
      label: 'Play White Noise Static',
      icon: Radio,
      action: () => {
        startAmbientSound('whitenoise', 0.3);
        if (onShowToast) onShowToast('Playing White Noise', 'success');
        onClose();
      },
    },
    {
      id: 'audio-stop',
      category: 'Ambient Flow',
      label: 'Stop Ambient Background Sound',
      icon: Radio,
      action: () => {
        stopAmbientSound();
        if (onShowToast) onShowToast('Ambient audio stopped', 'info');
        onClose();
      },
    },
  ];

  // Dynamic task commands
  const taskCommands = tasks.slice(0, 10).map((t) => ({
    id: `task-${t.id}`,
    category: 'Jump to Task',
    label: t.title,
    badge: t.category || 'WORK',
    icon: CheckSquare,
    action: () => {
      if (onSelectTask) onSelectTask(t.id);
      onSelectView('today');
      if (onShowToast) onShowToast(`Selected "${t.title}"`, 'info');
      onClose();
    },
  }));

  const allItems = [...baseCommands, ...taskCommands];

  const filteredItems = allItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation inside palette
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#18181B] border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden text-[#FAFAFA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800 gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            placeholder="Type a command, jump to a task, or search screen..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px] border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No matching commands or tasks found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition ${
                    isSelected
                      ? 'bg-emerald-950/50 text-white border border-emerald-700/60 shadow-sm'
                      : 'text-zinc-300 hover:bg-zinc-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-medium truncate">{item.label}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 uppercase">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.2 rounded bg-zinc-800 font-mono text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.2 rounded bg-zinc-800 font-mono text-[10px]">↓</kbd>
            <span>Select:</span>
            <kbd className="px-1.5 py-0.2 rounded bg-zinc-800 font-mono text-[10px]">↵</kbd>
          </div>
          <span>Spotlight Palette</span>
        </div>
      </div>
    </div>
  );
}
