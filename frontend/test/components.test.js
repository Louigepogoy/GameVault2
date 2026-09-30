import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import EmptyState from '~/components/EmptyState.vue';
import GameFormModal from '~/components/GameFormModal.vue';

// Keep the form test about the form: a plain wrapper instead of the animated sheet,
// and a plain input instead of the search-as-you-type title field.
const stubs = {
  BaseSheet: { props: ['open', 'title'], template: '<div v-if="open"><slot /></div>' },
  TitleLookup: {
    props: ['modelValue', 'id'],
    emits: ['update:modelValue'],
    template:
      '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
};

const mountForm = (props = {}) =>
  mountSuspended(GameFormModal, { props: { open: true, ...props }, global: { stubs } });

describe('GameFormModal validation', () => {
  it('requires a title', async () => {
    const wrapper = await mountForm();
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('Title is required.');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('rejects a cover URL that is not http(s) and hours out of range', async () => {
    const wrapper = await mountForm();
    await wrapper.find('#f-title').setValue('Hades');
    await wrapper.find('#f-cover').setValue('ftp://example.com/cover.png');
    await wrapper.find('#f-hours').setValue('-3');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('Enter a valid http(s) URL.');
    expect(wrapper.text()).toContain('Enter hours from 0 to 100,000.');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('emits a clean payload when valid', async () => {
    const wrapper = await mountForm();
    await wrapper.find('#f-title').setValue('  Hades  ');
    await wrapper.find('#f-platform').setValue(' PC ');
    await wrapper.find('#f-hours').setValue('12.5');
    await wrapper.find('#f-cover').setValue('https://example.com/hades.jpg');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')[0][0]).toEqual({
      title: 'Hades',
      platform: 'PC',
      genre: null,
      status: 'backlog',
      rating: null,
      hours_played: 12.5,
      cover_url: 'https://example.com/hades.jpg',
      notes: null,
    });
  });

  it('fills the form when editing a game', async () => {
    const wrapper = await mountForm({ game: { id: 1, title: 'Celeste', status: 'completed', rating: 4 } });
    expect(wrapper.find('#f-title').element.value).toBe('Celeste');
    expect(wrapper.find('#f-status').element.value).toBe('completed');
    expect(wrapper.text()).toContain('Save Changes');
  });
});

describe('EmptyState', () => {
  it('shows the default message', async () => {
    const wrapper = await mountSuspended(EmptyState);
    expect(wrapper.text()).toContain('No games found.');
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
  });

  it('shows a custom title, message and actions', async () => {
    const wrapper = await mountSuspended(EmptyState, {
      props: { title: 'Your vault is empty.', message: 'Add a game.' },
      slots: { default: '<button>Add Game</button>' },
    });
    expect(wrapper.text()).toContain('Your vault is empty.');
    expect(wrapper.text()).toContain('Add a game.');
    expect(wrapper.find('button').text()).toBe('Add Game');
  });
});
