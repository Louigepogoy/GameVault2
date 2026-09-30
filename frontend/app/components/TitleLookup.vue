<script setup>
import { Gamepad2, Loader2 } from 'lucide-vue-next';

// Title input that suggests matching games (with cover art) as you type.
defineOptions({ inheritAttrs: false });
const model = defineModel({ type: String, default: '' });
const emit = defineEmits(['select']);
const props = defineProps({
  id: { type: String, required: true },
});

const api = useApi();

const results = ref([]);
const loading = ref(false);
const searched = ref(false);
const focused = ref(false);
const active = ref(-1);
const typed = ref(false); // only search after the user types, not when the form opens
let timer;
let requestId = 0;

const listId = computed(() => `${props.id}-list`);
const open = computed(() => focused.value && typed.value && (loading.value || searched.value));

watch(model, (value) => {
  if (!typed.value) return;
  clearTimeout(timer);
  const q = value.trim();
  if (q.length < 2) {
    results.value = [];
    searched.value = false;
    loading.value = false;
    return;
  }
  loading.value = true;
  timer = setTimeout(() => search(q), 350);
});

async function search(q) {
  const id = ++requestId;
  try {
    const { results: found } = await api.lookupGames(q);
    if (id !== requestId) return; // a newer search is running
    results.value = found;
    active.value = -1;
  } catch {
    if (id === requestId) results.value = [];
  } finally {
    if (id === requestId) {
      loading.value = false;
      searched.value = true;
    }
  }
}

function onInput() {
  typed.value = true;
}

function choose(result) {
  typed.value = false; // setting the title below must not trigger another search
  // Cancel any search still waiting or in flight.
  clearTimeout(timer);
  requestId++;
  loading.value = false;
  model.value = result.title;
  results.value = [];
  searched.value = false;
  emit('select', result);
}

function onKeydown(e) {
  if (!open.value) return;
  const count = results.value.length;
  if (e.key === 'ArrowDown' && count) {
    e.preventDefault();
    active.value = (active.value + 1) % count;
  } else if (e.key === 'ArrowUp' && count) {
    e.preventDefault();
    active.value = (active.value - 1 + count) % count;
  } else if (e.key === 'Enter' && active.value >= 0) {
    e.preventDefault(); // don't submit the form
    choose(results.value[active.value]);
  } else if (e.key === 'Escape') {
    e.stopPropagation(); // close the list, not the whole dialog
    typed.value = false;
    searched.value = false;
  }
}

const meta = (r) => [r.genre, r.year, r.source].filter(Boolean).join(' · ');
const failed = reactive(new Set());

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="lookup">
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      class="field"
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="active >= 0 ? `${listId}-${active}` : undefined"
      @input="onInput"
      @keydown="onKeydown"
      @focus="focused = true"
      @blur="focused = false"
    />
    <Loader2 v-if="loading" class="spinner" :size="18" aria-hidden="true" />

    <div v-if="open" class="panel">
      <ul v-if="results.length" :id="listId" class="options" role="listbox" aria-label="Matching games">
        <li
          v-for="(r, i) in results"
          :id="`${listId}-${i}`"
          :key="`${r.source}-${r.title}`"
          class="option"
          :class="{ active: i === active }"
          role="option"
          :aria-selected="i === active"
          @mousedown.prevent="choose(r)"
          @mouseenter="active = i"
        >
          <span class="thumb">
            <img
              v-if="!failed.has(r.cover_url)"
              :src="r.cover_url"
              alt=""
              referrerpolicy="no-referrer"
              @error="failed.add(r.cover_url)"
            />
            <Gamepad2 v-else :size="18" />
          </span>
          <span class="text">
            <span class="name">{{ r.title }}</span>
            <span class="meta">{{ meta(r) }}</span>
          </span>
        </li>
      </ul>
      <p v-else-if="loading" class="note" role="status">Searching games...</p>
      <p v-else class="note" role="status">No matches found. You can still type any title.</p>
    </div>
  </div>
</template>

<style scoped>
.lookup {
  position: relative;
}

.field {
  padding-right: 42px;
}

.spinner {
  position: absolute;
  top: 14px;
  right: 14px;
  color: var(--accent-soft);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  max-height: 320px;
  overflow-y: auto;
  border-radius: 12px;
  border: 1px solid var(--border-strong);
  background: var(--surface-solid);
  box-shadow: var(--shadow);
}

.options {
  list-style: none;
  margin: 0;
  padding: 6px;
}

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 10px;
  cursor: pointer;
}

.option.active {
  background: var(--surface-2);
  outline: 1px solid var(--border-strong);
}

.thumb {
  display: grid;
  place-items: center;
  width: 36px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-2);
  color: var(--accent-soft);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.name {
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
}

.note {
  margin: 0;
  padding: 12px 14px;
  color: var(--text-muted);
  font-weight: 600;
}
</style>
