import { useEffect } from 'react';

/**
 * Global Keyboard Shortcuts Hook
 * 
 * Safely captures power-user hotkeys without interfering when the user is 
 * actively typing into input fields, textareas, or dropdowns.
 */
export function useKeyboardShortcuts({
  onToggleTimer,
  onResetTimer,
  onSelectView,
  onToggleShortcutsModal,
  onOpenCommandPalette,
  onCloseModals,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore keystrokes if focused inside an editable field
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.isContentEditable);

      // 1. Command Palette: Ctrl+K or Cmd+K works even inside inputs
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (onOpenCommandPalette) onOpenCommandPalette();
        return;
      }

      // 2. Escape: Always closes active modals
      if (event.key === 'Escape') {
        if (onCloseModals) onCloseModals();
        return;
      }

      // If user is typing in a form or input, don't trigger hotkeys
      if (isInputFocused) return;

      // 3. Space: Toggle timer start/pause
      if (event.code === 'Space') {
        event.preventDefault();
        if (onToggleTimer) onToggleTimer();
        return;
      }

      // 4. 'R': Reset timer
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        if (onResetTimer) onResetTimer();
        return;
      }

      // 5. '1'-'4': View switching
      if (event.key === '1') {
        event.preventDefault();
        if (onSelectView) onSelectView('today');
        return;
      }
      if (event.key === '2') {
        event.preventDefault();
        if (onSelectView) onSelectView('lists');
        return;
      }
      if (event.key === '3') {
        event.preventDefault();
        if (onSelectView) onSelectView('calendar');
        return;
      }
      if (event.key === '4') {
        event.preventDefault();
        if (onSelectView) onSelectView('habits');
        return;
      }

      // 6. '?': Shortcuts cheat sheet
      if (event.key === '?') {
        event.preventDefault();
        if (onToggleShortcutsModal) onToggleShortcutsModal();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onToggleTimer,
    onResetTimer,
    onSelectView,
    onToggleShortcutsModal,
    onOpenCommandPalette,
    onCloseModals,
  ]);
}
