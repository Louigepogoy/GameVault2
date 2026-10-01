import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import ChipSelect from '~/components/ChipSelect.vue';
import { PLATFORM_PREFS, STATUSES, defaultPlatform } from '~/utils/constants';

describe('ChipSelect', () => {
  it('toggles options on and off and marks them pressed', async () => {
    const wrapper = await mountSuspended(ChipSelect, {
      props: { options: PLATFORM_PREFS, label: 'Platforms', modelValue: ['PC'] },
    });
    const [pc, playstation] = wrapper.findAll('button');
    expect(pc.attributes('aria-pressed')).toBe('true');
    expect(playstation.attributes('aria-pressed')).toBe('false');

    await playstation.trigger('click');
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toEqual(['PC', 'PlayStation']);

    await wrapper.setProps({ modelValue: ['PC', 'PlayStation'] });
    await pc.trigger('click');
    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toEqual(['PlayStation']);
  });

  it('accepts plain strings as options', async () => {
    const wrapper = await mountSuspended(ChipSelect, {
      props: { options: ['RPG', 'Puzzle'], label: 'Genres', modelValue: [] },
    });
    expect(wrapper.findAll('button').map((b) => b.text())).toEqual(['RPG', 'Puzzle']);
    expect(wrapper.find('[role="group"]').attributes('aria-label')).toBe('Genres');
  });
});

describe('preferences helpers', () => {
  it('turns the first favorite platform group into a console name', () => {
    expect(defaultPlatform(['Mobile', 'PC'])).toBe('Android');
    expect(defaultPlatform(['Switch'])).toBe('Nintendo Switch');
    expect(defaultPlatform([])).toBeNull();
  });

  it('includes Wishlist as a status', () => {
    expect(STATUSES.map((s) => s.value)).toContain('wishlist');
  });
});
