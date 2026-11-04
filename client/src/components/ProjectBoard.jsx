import React, { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

const lanes = [
  { id: 'todo', label: 'To Do', dot: 'bg-zinc-500' },
  { id: 'in_progress', label: 'In Progress', dot: 'bg-amber-400' },
  { id: 'done', label: 'Completed', dot: 'bg-emerald-400' },
];

export default function ProjectBoard({ tasks, onMove, onOpenTask, getSubtasks }) {
  const [pendingMoves, setPendingMoves] = useState({});

  const move = async (taskId, status) => {
    const task = tasks.find(row => String(row.id) === taskId);
    if (!task || !onMove || pendingMoves[taskId]) return;
    setPendingMoves(prev => ({ ...prev, [taskId]: status }));
    try {
      await onMove(task.id, { status });
    } finally {
      setPendingMoves(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    }
  };

  const handleDrop = ({ draggableId, source, destination }) => {
    if (destination && destination.droppableId !== source.droppableId) {
      move(draggableId, destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDrop}>
      <div className="grid min-w-[600px] grid-cols-3 items-start gap-4 pb-6">
        {lanes.map(lane => {
          const cards = tasks.filter(task => (pendingMoves[task.id] ?? task.status) === lane.id);
          return (
            <section key={lane.id} aria-label={lane.label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className={'h-2 w-2 rounded-full ' + lane.dot} />
                {lane.label} <span className="ml-auto text-xs text-zinc-400">{cards.length}</span>
              </h3>
              <Droppable droppableId={lane.id}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={'min-h-28 space-y-2 rounded-lg ' + (snapshot.isDraggingOver ? 'bg-emerald-950/50' : '')}>
                    {cards.length === 0 && <p className="py-4 text-center text-xs text-zinc-500">Drop a task here</p>}
                    {cards.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index} isDragDisabled={Boolean(pendingMoves[task.id])}>
                        {(card, state) => (
                          <article ref={card.innerRef} {...card.draggableProps}
                            className={'rounded-lg border bg-zinc-900 p-3 ' + (state.isDragging ? 'border-emerald-500' : 'border-zinc-800')}>
                            <div className="flex items-start gap-2">
                              <span {...card.dragHandleProps} aria-label={'Drag ' + task.title} className="cursor-grab text-zinc-400">
                                <GripVertical aria-hidden="true" className="h-4 w-4" />
                              </span>
                              <button type="button" onClick={() => onOpenTask?.(task.id)}
                                className="break-words text-left text-sm font-medium text-zinc-100 hover:underline">{task.title}</button>
                            </div>
                            <div className="mt-2 space-y-2">
                              <p className="text-[11px] text-zinc-400">
                                {[task.category, task.due_date, getSubtasks(task.id).length ? getSubtasks(task.id).length + ' subtasks' : null].filter(Boolean).join(' · ')}
                              </p>
                              <select aria-label={'Move ' + task.title + ' to…'} value={lane.id}
                                disabled={Boolean(pendingMoves[task.id])}
                                onChange={event => move(String(task.id), event.target.value)}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 p-1 text-xs text-zinc-300">
                                {lanes.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                              </select>
                            </div>
                          </article>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </section>
          );
        })}
      </div>
    </DragDropContext>
  );
}
