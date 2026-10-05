import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Active Focus Timer',
      items: [
        { keys: ['Space'], description: 'Start / Pause active countdown timer' },
        { keys: ['R'], description: 'Reset timer to mode initial duration' },
      ],
    },
    {
      title: 'Screen & View Navigation',
      items: [
        { keys: ['1'], description: 'Switch to Today & Focus Hub' },
        { keys: ['2'], description: 'Switch to Lists & Projects Breakdown' },
        { keys: ['3'], description: 'Switch to Calendar & Day Planner' },
        { keys: ['4'], description: 'Switch to Habits & 12-Week Heat Map' },
      ],
    },
    {
      title: 'Productivity & Spotlight',
      items: [
        { keys: ['Ctrl', 'K'], description: 'Open Spotlight Command Palette' },
        { keys: ['?'], description: 'Show this keyboard shortcuts cheat sheet' },
        { keys: ['Esc'], description: 'Close any active modal or menu' },
      ],
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#18181B] border border-zinc-800 rounded-2xl shadow-2xl p-6 text-[#FAFAFA] space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-zinc-400">Power-user hotkeys for speed and flow</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-5">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2.5">
              <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div 
                    key={item.description}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70"
                  >
                    <span className="text-xs text-zinc-300 font-medium">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {item.keys.map((k) => (
                        <kbd 
                          key={k}
                          className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[11px] font-semibold border border-zinc-700 shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-xs text-zinc-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-[10px]">Esc</kbd> anytime to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
