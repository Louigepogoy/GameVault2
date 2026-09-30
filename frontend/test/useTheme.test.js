import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';

describe('useTheme', () => {
  // useCookie writes the browser cookie on the next tick.
  it('defaults to dark and toggles, remembering the choice in a cookie', async () => {
    const { theme, toggle } = useTheme();
    expect(theme.value).toBe('dark');

    toggle();
    await nextTick();
    expect(theme.value).toBe('light');
    expect(document.cookie).toContain('gamevault-theme=light');

    toggle();
    await nextTick();
    expect(theme.value).toBe('dark');
    expect(document.cookie).toContain('gamevault-theme=dark');
  });

  it('shares one theme between callers', () => {
    const a = useTheme();
    const b = useTheme();
    a.toggle();
    expect(b.theme.value).toBe(a.theme.value);
  });
});
