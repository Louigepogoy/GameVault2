import { animate } from 'motion-v';

/**
 * A number that counts up (or down) to `source` whenever it changes,
 * like a scoreboard. Jumps straight to the value when reduced motion is on.
 */
export function useCountUp(source, { duration = 0.9, decimals = 0 } = {}) {
  // Start at 0 (also in the server render) so the count-up doesn't flash the final value first.
  const display = ref(0);
  const round = (n) => Number(n.toFixed(decimals));
  let controls;

  const run = (to, from) => {
    controls?.stop();
    if (to == null) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from == null) {
      display.value = to;
      return;
    }
    controls = animate(from, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (display.value = round(v)),
    });
  };

  onMounted(() => {
    // Count up from zero on first view.
    const to = toValue(source);
    if (to != null) run(to, 0);
    watch(() => toValue(source), (to, from) => run(to, from ?? display.value));
  });
  onBeforeUnmount(() => controls?.stop());

  return display;
}
