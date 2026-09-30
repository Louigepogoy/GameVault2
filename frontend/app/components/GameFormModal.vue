<script setup>
import { CheckCircle2, Gamepad2, Star } from 'lucide-vue-next';
import { GENRES, PLATFORMS, STATUSES } from '~/utils/constants';

const props = defineProps({
  open: { type: Boolean, default: false },
  game: { type: Object, default: null }, // null = add mode
  saving: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'submit']);

const empty = () => ({
  title: '',
  platform: '',
  genre: '',
  status: 'backlog',
  rating: null,
  hours_played: '',
  cover_url: '',
  notes: '',
});

const form = reactive(empty());
const errors = reactive({ title: '', cover_url: '', hours_played: '' });
const previewFailed = ref(false);
const filledNote = ref('');

const isEdit = computed(() => !!props.game);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const source = props.game ?? {};
    Object.assign(form, empty(), Object.fromEntries(
      Object.keys(empty()).map((k) => [k, source[k] ?? empty()[k]]),
    ));
    errors.title = '';
    errors.cover_url = '';
    errors.hours_played = '';
    filledNote.value = '';
  },
  { immediate: true },
);

watch(() => form.cover_url, () => (previewFailed.value = false));

const validCoverUrl = computed(() => /^https?:\/\/\S+$/i.test(form.cover_url.trim()));

// Picked a suggestion from the title search: fill in what we know about the game.
function onPick(game) {
  const filled = [];
  if (game.cover_url) {
    form.cover_url = game.cover_url;
    filled.push('cover');
  }
  if (game.genre && !form.genre.trim()) {
    form.genre = game.genre;
    filled.push('genre');
  }
  if (game.platform && !form.platform.trim()) {
    form.platform = game.platform;
    filled.push('platform');
  }
  errors.title = '';
  filledNote.value = filled.length ? `${filled.join(', ')} filled in from ${game.source}` : '';
}

function setRating(n) {
  form.rating = form.rating === n ? null : n;
}

function submit() {
  errors.title = form.title.trim() ? '' : 'Title is required.';
  errors.cover_url = form.cover_url.trim() && !validCoverUrl.value ? 'Enter a valid http(s) URL.' : '';
  const hours = form.hours_played === '' || form.hours_played === null ? null : Number(form.hours_played);
  errors.hours_played = hours !== null && !(hours >= 0 && hours <= 100000) ? 'Enter hours from 0 to 100,000.' : '';
  if (errors.title || errors.cover_url || errors.hours_played) return;

  emit('submit', {
    title: form.title.trim(),
    platform: form.platform.trim() || null,
    genre: form.genre.trim() || null,
    status: form.status,
    rating: form.rating,
    hours_played: hours,
    cover_url: form.cover_url.trim() || null,
    notes: form.notes.trim() || null,
  });
}
</script>

<template>
  <BaseSheet :open="open" :title="isEdit ? 'Edit Game' : 'Add Game'" @close="emit('close')">
    <form class="form" novalidate @submit.prevent="submit">
      <div class="group">
        <label for="f-title">Title <span class="req" aria-hidden="true">*</span></label>
        <TitleLookup
          id="f-title"
          v-model="form.title"
          :class="{ invalid: errors.title }"
          maxlength="200"
          placeholder="Type to search, e.g. Elden Ring"
          autofocus
          required
          :aria-invalid="!!errors.title"
          aria-describedby="f-title-err f-title-note"
          @select="onPick"
        />
        <p v-if="errors.title" id="f-title-err" class="error">{{ errors.title }}</p>
        <p v-else-if="filledNote" id="f-title-note" class="filled" role="status">
          <CheckCircle2 :size="16" aria-hidden="true" />
          {{ filledNote.charAt(0).toUpperCase() + filledNote.slice(1) }}
        </p>
      </div>

      <div class="two-col">
        <div class="group">
          <label for="f-platform">Platform</label>
          <input
            id="f-platform"
            v-model="form.platform"
            class="field"
            list="platform-options"
            maxlength="100"
            placeholder="e.g. PC"
            autocomplete="off"
          />
          <datalist id="platform-options">
            <option v-for="p in PLATFORMS" :key="p" :value="p" />
          </datalist>
        </div>
        <div class="group">
          <label for="f-genre">Genre</label>
          <input
            id="f-genre"
            v-model="form.genre"
            class="field"
            list="genre-options"
            maxlength="100"
            placeholder="e.g. RPG"
            autocomplete="off"
          />
          <datalist id="genre-options">
            <option v-for="g in GENRES" :key="g" :value="g" />
          </datalist>
        </div>
      </div>

      <div class="two-col">
        <div class="group">
          <label for="f-status">Status</label>
          <select id="f-status" v-model="form.status" class="field">
            <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="group">
          <label for="f-hours">Hours played</label>
          <input
            id="f-hours"
            v-model="form.hours_played"
            class="field"
            :class="{ invalid: errors.hours_played }"
            type="number"
            inputmode="decimal"
            min="0"
            max="100000"
            step="0.5"
            placeholder="e.g. 25"
            :aria-invalid="!!errors.hours_played"
            aria-describedby="f-hours-err"
          />
          <p v-if="errors.hours_played" id="f-hours-err" class="error">{{ errors.hours_played }}</p>
        </div>
      </div>

      <div class="group">
        <span id="rating-label" class="label">Rating</span>
        <div class="rating" role="radiogroup" aria-labelledby="rating-label">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="star-btn"
            role="radio"
            :aria-checked="form.rating === n"
            :aria-label="`${n} star${n > 1 ? 's' : ''}`"
            @click="setRating(n)"
          >
            <Star :size="24" :class="{ filled: form.rating && n <= form.rating }" />
          </button>
        </div>
      </div>

      <div class="group">
        <label for="f-cover">Cover URL</label>
        <div class="cover-row">
          <input
            id="f-cover"
            v-model="form.cover_url"
            class="field"
            :class="{ invalid: errors.cover_url }"
            type="url"
            inputmode="url"
            placeholder="https://..."
            autocomplete="off"
            :aria-invalid="!!errors.cover_url"
            aria-describedby="f-cover-err"
          />
          <div class="cover-preview" aria-hidden="true">
            <img
              v-if="validCoverUrl && !previewFailed"
              :src="form.cover_url.trim()"
              alt=""
              referrerpolicy="no-referrer"
              @error="previewFailed = true"
            />
            <Gamepad2 v-else :size="20" />
          </div>
        </div>
        <p v-if="errors.cover_url" id="f-cover-err" class="error">{{ errors.cover_url }}</p>
      </div>

      <div class="group">
        <label for="f-notes">Notes</label>
        <textarea
          id="f-notes"
          v-model="form.notes"
          class="field"
          rows="3"
          maxlength="5000"
          placeholder="Thoughts, progress, reminders..."
        />
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" @click="emit('close')">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Game' }}
        </button>
      </div>
    </form>
  </BaseSheet>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

label,
.label {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.02em;
}

.req {
  color: var(--accent-soft);
}

.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

@media (min-width: 480px) {
  .two-col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.field.invalid {
  border-color: var(--red);
}

.filled {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--green);
  font-size: 14px;
  font-weight: 600;
}

.error {
  margin: 0;
  color: var(--red);
  font-size: 14px;
  font-weight: 600;
}

textarea.field {
  resize: vertical;
  min-height: 90px;
}

.rating {
  display: flex;
  min-height: 46px;
  align-items: center;
}

.star-btn {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: none;
  background: none;
  color: var(--text-muted);
  padding: 0;
  flex-shrink: 1;
  min-width: 36px;
}

.star-btn .filled {
  color: #fbbf24;
  fill: #fbbf24;
}

.cover-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cover-preview {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--accent-soft);
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 10px;
  margin-top: 6px;
}

@media (min-width: 640px) {
  .form-actions {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
