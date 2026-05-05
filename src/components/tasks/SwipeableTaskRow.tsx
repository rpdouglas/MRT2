import { useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { addDays, startOfDay } from 'date-fns';
import TaskRow from './TaskRow';
import ForgivenessTapSheet from './ForgivenessTapSheet';
import type { Task } from '../../lib/tasks';

const SWIPE_THRESHOLD = 80;
const SWIPE_THRESHOLD_NARROW = 60; // screens ≤360px
const VELOCITY_THRESHOLD = 0.3;    // px/ms

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

  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], last, cancel }) => {
      if (isLogView) {
        cancel?.();
        return;
      }

      if (!last) {
        setSwipeX(mx);
        if (!isDragging) setIsDragging(true);
        return;
      }

      setIsDragging(false);
      setSwipeX(0);

      if (mx >= threshold && vx >= VELOCITY_THRESHOLD) {
        const shouldAnimate = onSwipeComplete(task);
        if (shouldAnimate) {
          setIsSlidingOut(true);
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([40]);
          }
        }
      } else if (mx <= -threshold && vx >= VELOCITY_THRESHOLD) {
        setIsForgivenessTapOpen(true);
      }
    },
    {
      axis: 'x',
      pointer: { touch: true, mouse: false },
      threshold: [10, 0],
    },
  );

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
          {...bind()}
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
