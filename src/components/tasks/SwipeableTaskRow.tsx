import { useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { addDays, startOfDay } from 'date-fns';
import TaskRow from './TaskRow';
import ForgivenessTapSheet from './ForgivenessTapSheet';
import type { Task } from '../../lib/tasks';

const SWIPE_THRESHOLD = 80;
const SWIPE_THRESHOLD_NARROW = 60; // screens ≤360px
const VELOCITY_THRESHOLD = 0.3;    // px/ms
const AXIS_LOCK_THRESHOLD = 10;    // px of movement before committing to horizontal vs. vertical

interface SwipeableTaskRowProps {
  task: Task;
  onToggle: (params: { task: Task; isCompleting: boolean }) => void;
  onSwipeComplete: (task: Task) => boolean; // returns false if intercepted (future task modal)
  onUpdateTask: (params: { id: string } & Partial<Task>) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  isLogView?: boolean;
}

export default function SwipeableTaskRow({
  task,
  onToggle,
  onSwipeComplete,
  onUpdateTask,
  onDelete,
  onEdit,
  isLogView = false,
}: SwipeableTaskRowProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSlidingOut, setIsSlidingOut] = useState(false);
  const [isForgivenessTapOpen, setIsForgivenessTapOpen] = useState(false);

  const threshold =
    typeof window !== 'undefined' && window.innerWidth <= 360
      ? SWIPE_THRESHOLD_NARROW
      : SWIPE_THRESHOLD;

  // Native touch tracking replaces @use-gesture/react (PROJ-97 — the package
  // hasn't shipped a release since March 2024 and this was its only call
  // site). isHorizontalRef is the axis-lock decision: null until
  // AXIS_LOCK_THRESHOLD px of movement lets us tell a horizontal swipe from
  // a vertical scroll; once decided, it's held for the rest of the gesture,
  // matching @use-gesture's axis:'x' locking behavior. touchAction: 'pan-y'
  // below does the real work of not fighting native vertical scroll — the
  // browser never attempts native horizontal panning on this element, so
  // there's no preventDefault()-vs-passive-listener fight to get right.
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isHorizontalRef = useRef<boolean | null>(null);

  const resetGesture = () => {
    touchStartRef.current = null;
    isHorizontalRef.current = null;
    setIsDragging(false);
    setSwipeX(0);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (isLogView) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    isHorizontalRef.current = null;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isLogView || !touchStartRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;

    if (isHorizontalRef.current === null) {
      if (Math.abs(dx) < AXIS_LOCK_THRESHOLD && Math.abs(dy) < AXIS_LOCK_THRESHOLD) return;
      isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontalRef.current) return; // vertical scroll — let the browser handle it

    setSwipeX(dx);
    if (!isDragging) setIsDragging(true);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (isLogView || !touchStartRef.current) return;
    const wasHorizontal = isHorizontalRef.current;
    const start = touchStartRef.current;
    const t = e.changedTouches[0];
    resetGesture();

    if (!wasHorizontal) return;

    const dx = t.clientX - start.x;
    const dt = Math.max(1, Date.now() - start.time);
    const vx = Math.abs(dx) / dt; // px/ms, same units @use-gesture reported

    if (dx >= threshold && vx >= VELOCITY_THRESHOLD) {
      const shouldAnimate = onSwipeComplete(task);
      if (shouldAnimate) {
        setIsSlidingOut(true);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([40]);
        }
      }
    } else if (dx <= -threshold && vx >= VELOCITY_THRESHOLD) {
      setIsForgivenessTapOpen(true);
    }
  };

  const handleMoveToTomorrow = () => {
    const tomorrow = addDays(startOfDay(new Date()), 1);
    onUpdateTask({ id: task.id!, dueDate: tomorrow });
    setIsForgivenessTapOpen(false);
  };

  const handleKeepForToday = () => {
    setIsForgivenessTapOpen(false);
  };

  const clampedX = Math.max(-100, Math.min(200, swipeX));
  const rightRevealOpacity = clampedX > 0 ? Math.min(1, clampedX / threshold) : 0;
  const leftRevealOpacity = clampedX < 0 ? Math.min(1, -clampedX / threshold) : 0;

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Green reveal layer — right swipe to complete */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-green-500 flex items-center pl-5"
          style={{ opacity: rightRevealOpacity }}
        >
          <CheckCircleIcon className="h-7 w-7 text-white" />
        </div>

        {/* Amber reveal layer — left swipe to skip */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-amber-400 flex items-center justify-end pr-5"
          style={{ opacity: leftRevealOpacity }}
        >
          <ArrowRightIcon className="h-7 w-7 text-white" />
        </div>

        {/* Task card — slides over the reveal layers */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={resetGesture}
          style={{
            transform: isSlidingOut
              ? 'translateX(110%)'
              : `translateX(${clampedX}px)`,
            transition: isDragging
              ? 'none'
              : isSlidingOut
              ? 'transform 0.25s ease-in'
              : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            touchAction: 'pan-y',
            userSelect: 'none',
          }}
        >
          <TaskRow
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            isLogView={isLogView}
          />
        </div>
      </div>

      <ForgivenessTapSheet
        isOpen={isForgivenessTapOpen}
        task={task}
        onMoveToTomorrow={handleMoveToTomorrow}
        onKeepForToday={handleKeepForToday}
      />
    </>
  );
}
