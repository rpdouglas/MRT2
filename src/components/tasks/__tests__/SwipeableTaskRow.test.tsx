/**
 * src/components/tasks/__tests__/SwipeableTaskRow.test.tsx
 * PROJ-97: no test file existed before the native-touch-handler replacement
 * for @use-gesture/react — this covers the behavior the swap needed to
 * preserve: distance+velocity thresholds in both directions, axis-locking
 * away from vertical scroll gestures, isLogView disabling swipe entirely,
 * and touchcancel resetting cleanly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SwipeableTaskRow from '../SwipeableTaskRow';
import type { Task } from '../../../lib/tasks';

const baseTask: Task = {
  id: 'task-1',
  uid: 'user-1',
  title: 'Call sponsor',
  completed: false,
  isRecurring: false,
  frequency: 'once',
  currentStreak: 0,
  priority: 'Medium',
  createdAt: new Date(),
};

function renderRow(overrides: Partial<Task> = {}, props: Partial<React.ComponentProps<typeof SwipeableTaskRow>> = {}) {
  const onToggle = vi.fn();
  const onSwipeComplete = vi.fn(() => true);
  const onUpdateTask = vi.fn();
  const onDelete = vi.fn();
  const onEdit = vi.fn();

  render(
    <BrowserRouter>
      <SwipeableTaskRow
        task={{ ...baseTask, ...overrides }}
        onToggle={onToggle}
        onSwipeComplete={onSwipeComplete}
        onUpdateTask={onUpdateTask}
        onDelete={onDelete}
        onEdit={onEdit}
        {...props}
      />
    </BrowserRouter>,
  );

  return { onToggle, onSwipeComplete, onUpdateTask, onDelete, onEdit };
}

// The draggable layer is the outer wrapper around TaskRow's content — found
// via the task title text, then walking to its swipe-bound ancestor. Matched
// on `transform` rather than `touch-action`: jsdom's CSSOM doesn't recognize
// touch-action and silently drops it from the serialized style attribute
// (a jsdom limitation, not a real rendering bug — it's present in a browser).
function getSwipeSurface(): HTMLElement {
  const title = screen.getByText('Call sponsor');
  const surface = title.closest('[style*="transform"]') as HTMLElement | null;
  if (!surface) throw new Error('Swipe surface not found');
  return surface;
}

function touch(clientX: number, clientY: number) {
  return { clientX, clientY } as Touch;
}

describe('SwipeableTaskRow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the task', () => {
    renderRow();
    expect(screen.getByText('Call sponsor')).toBeInTheDocument();
  });

  it('completes the task on a fast rightward swipe past threshold', () => {
    const { onSwipeComplete } = renderRow();
    const surface = getSwipeSurface();

    fireEvent.touchStart(surface, { touches: [touch(0, 0)] });
    fireEvent.touchMove(surface, { touches: [touch(90, 0)] });
    vi.advanceTimersByTime(50); // 90px / 50ms = 1.8px/ms, comfortably over VELOCITY_THRESHOLD (0.3)
    fireEvent.touchEnd(surface, { changedTouches: [touch(90, 0)] });

    expect(onSwipeComplete).toHaveBeenCalledWith(expect.objectContaining({ id: 'task-1' }));
  });

  it('opens the forgiveness sheet on a fast leftward swipe past threshold', () => {
    renderRow();
    const surface = getSwipeSurface();

    fireEvent.touchStart(surface, { touches: [touch(0, 0)] });
    fireEvent.touchMove(surface, { touches: [touch(-90, 0)] });
    vi.advanceTimersByTime(50);
    fireEvent.touchEnd(surface, { changedTouches: [touch(-90, 0)] });

    expect(screen.getByText(/Move this to tomorrow\?|streak is safe|Recovery continues tomorrow/)).toBeInTheDocument();
  });

  it('does not complete the task when movement stays under the distance threshold', () => {
    const { onSwipeComplete } = renderRow();
    const surface = getSwipeSurface();

    fireEvent.touchStart(surface, { touches: [touch(0, 0)] });
    fireEvent.touchMove(surface, { touches: [touch(40, 0)] }); // under SWIPE_THRESHOLD (80)
    vi.advanceTimersByTime(50);
    fireEvent.touchEnd(surface, { changedTouches: [touch(40, 0)] });

    expect(onSwipeComplete).not.toHaveBeenCalled();
  });

  it('does not complete the task when a large movement happens too slowly', () => {
    const { onSwipeComplete } = renderRow();
    const surface = getSwipeSurface();

    fireEvent.touchStart(surface, { touches: [touch(0, 0)] });
    fireEvent.touchMove(surface, { touches: [touch(90, 0)] });
    vi.advanceTimersByTime(2000); // 90px / 2000ms = 0.045px/ms, under VELOCITY_THRESHOLD (0.3)
    fireEvent.touchEnd(surface, { changedTouches: [touch(90, 0)] });

    expect(onSwipeComplete).not.toHaveBeenCalled();
  });

  it('ignores a predominantly-vertical gesture (scroll) even if it ends past the horizontal threshold', () => {
    const { onSwipeComplete } = renderRow();
    const surface = getSwipeSurface();

    fireEvent.touchStart(surface, { touches: [touch(0, 0)] });
    // Vertical movement dominates at the axis-lock decision point.
    fireEvent.touchMove(surface, { touches: [touch(5, 30)] });
    vi.advanceTimersByTime(50);
    fireEvent.touchEnd(surface, { changedTouches: [touch(90, 30)] });

    expect(onSwipeComplete).not.toHaveBeenCalled();
  });

  it('does nothing on swipe in log view', () => {
    const { onSwipeComplete } = renderRow({}, { isLogView: true });
    const surface = getSwipeSurface();

    fireEvent.touchStart(surface, { touches: [touch(0, 0)] });
    fireEvent.touchMove(surface, { touches: [touch(90, 0)] });
    vi.advanceTimersByTime(50);
    fireEvent.touchEnd(surface, { changedTouches: [touch(90, 0)] });

    expect(onSwipeComplete).not.toHaveBeenCalled();
  });

  it('resets cleanly on touchcancel without triggering an action', () => {
    const { onSwipeComplete } = renderRow();
    const surface = getSwipeSurface();

    fireEvent.touchStart(surface, { touches: [touch(0, 0)] });
    fireEvent.touchMove(surface, { touches: [touch(90, 0)] });
    fireEvent.touchCancel(surface);
    vi.advanceTimersByTime(50);
    fireEvent.touchEnd(surface, { changedTouches: [touch(90, 0)] });

    expect(onSwipeComplete).not.toHaveBeenCalled();
  });
});
