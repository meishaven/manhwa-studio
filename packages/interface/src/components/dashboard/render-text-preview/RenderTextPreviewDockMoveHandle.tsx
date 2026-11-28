import React, { useRef } from 'react';
import { GripVertical, LocateFixed } from 'lucide-react';

interface RenderTextPreviewDockMoveHandleProps {
  dockLeft: number;
  dockTop: number;
  dockRef: React.RefObject<HTMLDivElement | null>;
  dockPointerDownRef: React.RefObject<boolean>;
  syncInlineEditorSelection: () => void;
  onDockPositionChange: (
    position: { left: number; top: number } | null,
    persist?: boolean,
  ) => void;
  noir?: boolean;
}

interface DockDragState {
  pointerId: number;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
}

export default function RenderTextPreviewDockMoveHandle({
  dockLeft,
  dockTop,
  dockRef,
  dockPointerDownRef,
  syncInlineEditorSelection,
  onDockPositionChange,
  noir = false,
}: RenderTextPreviewDockMoveHandleProps) {
  const dragRef = useRef<DockDragState | null>(null);
  const positionFromEvent = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return null;
    const width = dockRef.current?.offsetWidth ?? 440;
    const height = dockRef.current?.offsetHeight ?? 150;
    return {
      left: Math.max(8, Math.min(
        drag.startLeft + event.clientX - drag.startX,
        Math.max(8, window.innerWidth - width - 8),
      )),
      top: Math.max(8, Math.min(
        drag.startTop + event.clientY - drag.startY,
        Math.max(8, window.innerHeight - height - 8),
      )),
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dockPointerDownRef.current = true;
    syncInlineEditorSelection();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: dockLeft,
      startTop: dockTop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const position = positionFromEvent(event);
    if (position) onDockPositionChange(position, false);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const position = positionFromEvent(event);
    dragRef.current = null;
    if (position) onDockPositionChange(position, true);
  };

  return (
    <div className={noir
      ? 'relative flex h-8 items-center gap-1 border-b border-paper/10 px-1'
      : 'flex h-8 items-center gap-1 border-b border-paper/10 px-1'}>
      <button
        type="button"
        className="flex h-7 min-w-0 flex-1 cursor-grab touch-none items-center gap-2 rounded px-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-paper-dim transition-colors hover:bg-paper/10 hover:text-paper active:cursor-grabbing"
        title="Drag anywhere along this bar to move the toolbar"
        aria-label="Drag this bar to move the toolbar"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <GripVertical size={12} />
        Move toolbar
      </button>
      <button
        type="button"
        className="grid h-7 w-7 shrink-0 place-items-center rounded text-paper-dim transition-colors hover:bg-paper/10 hover:text-paper"
        title="Return toolbar to automatic position"
        aria-label="Return toolbar to automatic position"
        onClick={() => onDockPositionChange(null, true)}
      >
        <LocateFixed size={noir ? 11 : 12} />
      </button>
    </div>
  );
}
