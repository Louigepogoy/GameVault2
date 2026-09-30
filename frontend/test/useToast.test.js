import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useToast', () => {
  let toast;
  beforeEach(() => {
    vi.useFakeTimers();
    toast = useToast();
    toast.toasts.value = [];
  });
  afterEach(() => vi.useRealTimers());

  it('shows a toast and removes it after its duration', () => {
    toast.success('Saved');
    expect(toast.toasts.value).toMatchObject([{ message: 'Saved', type: 'success' }]);
    vi.advanceTimersByTime(3499);
    expect(toast.toasts.value).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('keeps errors on screen longer', () => {
    toast.error('Oops');
    vi.advanceTimersByTime(4000);
    expect(toast.toasts.value).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('runs onClose when dismissed or timed out, but not when its action is used', () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    toast.info('Deleted', { action: { label: 'Undo', onClick }, onClose });
    toast.runAction(toast.toasts.value[0]);
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();

    toast.info('Deleted again', { onClose, duration: 1000 });
    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('pauses while hovered and resumes afterwards', () => {
    toast.success('Hover me', { duration: 1000 });
    const { id } = toast.toasts.value[0];
    vi.advanceTimersByTime(400);
    toast.pause(id);
    vi.advanceTimersByTime(5000);
    expect(toast.toasts.value).toHaveLength(1);
    toast.resume(id);
    vi.advanceTimersByTime(800);
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('keeps at most 4 on screen, closing the oldest normally', () => {
    const onClose = vi.fn();
    toast.info('first', { onClose });
    for (const m of ['2', '3', '4', '5']) toast.info(m);
    expect(toast.toasts.value.map((t) => t.message)).toEqual(['2', '3', '4', '5']);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
