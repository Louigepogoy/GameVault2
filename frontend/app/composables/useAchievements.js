/**
 * Celebrates newly unlocked achievements: a gold toast, plus a light haptic tap
 * inside the Capacitor app. On the web the haptic is skipped.
 */
export function useAchievements() {
  const toast = useToast();

  function haptic() {
    try {
      // Capacitor puts its bridge on window in the native app. The Haptics plugin exists
      // there once installed (npm i @capacitor/haptics && npx cap sync); otherwise no-op.
      const cap = window.Capacitor;
      if (cap?.isNativePlatform?.()) cap.Plugins?.Haptics?.impact?.({ style: 'LIGHT' });
    } catch {
      // Never let a haptic break the app.
    }
  }

  function celebrate(list) {
    if (import.meta.server || !list?.length) return;
    list.forEach((a, i) => {
      // Stagger several unlocks so each gets its moment.
      setTimeout(() => {
        toast.show(`${a.icon} Achievement unlocked: ${a.title}`, 'achievement', { duration: 5000 });
        haptic();
      }, i * 700);
    });
  }

  return { celebrate };
}
