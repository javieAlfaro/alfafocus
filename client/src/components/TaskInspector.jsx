import React, { useEffect, useRef, useState } from 'react';

export default function TaskInspector({ task, project, canRepeat, onSave, onClose, onFocus, onOpenProject }) {
  const dialog = useRef(null);
  const [dueDate, setDueDate] = useState(task.due_date ?? '');
  const [recurrence, setRecurrence] = useState(task.recurrence_rule ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dialog.current.showModal();
  }, []);

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const saved = await onSave(task.id, { due_date: dueDate || null, recurrence_rule: recurrence || null });
    setSaving(false);
    if (saved) onClose();
    else setError('Could not save this task. Check the schedule and try again.');
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="task-inspector-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-700 bg-[#18181B] p-5 text-zinc-100 backdrop:bg-black/65"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-emerald-400">{project?.title ?? 'Unassigned project'}</p>
          <h2 id="task-inspector-title" className="mt-1 text-lg font-semibold">{task.title}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg px-2 text-sm text-zinc-300">Close</button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          Due date
          <input
            type="date" value={dueDate} onChange={event => setDueDate(event.target.value)}
            required={Boolean(recurrence)}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 [color-scheme:dark]"
          />
        </label>
        {canRepeat && (
          <label className="block text-sm">
            Repeat
            <select value={recurrence} onChange={event => setRecurrence(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2">
              <option value="">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
            </select>
            {recurrence && <span className="mt-1 block text-xs text-zinc-400">The next occurrence is created when this task is completed.</span>}
          </label>
        )}
        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        <button type="submit" disabled={saving} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold disabled:opacity-50">
          {saving ? 'Saving…' : 'Save schedule'}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-700 pt-4">
        <button type="button" onClick={onOpenProject} className="rounded-lg bg-zinc-800 px-3 py-2 text-sm">Open in Project</button>
        <button type="button" onClick={onFocus} className="rounded-lg bg-zinc-800 px-3 py-2 text-sm">Focus</button>
      </div>
    </dialog>
  );
}
