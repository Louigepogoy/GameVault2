<script setup>
import { Clock, Gamepad2, Heart, Pencil, Play, Square, Star, Trash2 } from 'lucide-vue-next';
import { STATUS_LABELS, formatHours, timeAgo } from '~/utils/constants';
import { launchLinkFor } from '~/utils/launch';

const props = defineProps({
  game: { type: Object, required: true },
});
const emit = defineEmits(['toggle-favorite', 'edit', 'delete', 'open', 'play', 'stop']);

const { active, busy } = useSession();
const isPlaying = computed(() => active.value?.game_id === props.game.id);
// Can "Start playing" also open the game on this device? (Checked in the browser only.)
const launchable = ref(false);
onMounted(() => (launchable.value = !!launchLinkFor(props.game)));
watch(
  () => [props.game.launch_url, props.game.cover_url],
  () => (launchable.value = !!launchLinkFor(props.game)),
);

// "Added 3 days ago". Set after mount so server and browser clocks can't disagree.
const added = ref('');
onMounted(() => (added.value = props.game.created_at ? `Added ${timeAgo(props.game.created_at)}` : ''));

// The heart pops only when you tap it, not when the page loads.
const popped = ref(false);
function toggleFavorite() {
  popped.value = true;
  emit('toggle-favorite', props.game);
}

// Fall back to the placeholder if the cover URL fails to load.
const coverFailed = ref(false);
const coverImg = ref(null);
watch(
  () => props.game.cover_url,
  () => (coverFailed.value = false),
);

// A server-rendered image can fail before hydration attaches @error, so check once mounted.
onMounted(() => {
  const img = coverImg.value;
  if (img && img.complete && img.naturalWidth === 0) coverFailed.value = true;
});
</script>

<template>
  <article class="card game-card" :class="{ playing: isPlaying }">
    <button
      type="button"
      class="cover"
      :aria-label="`Details and play sessions for ${game.title}`"
      @click="emit('open', game)"
    >
      <img
        v-if="game.cover_url && !coverFailed"
        ref="coverImg"
        :src="game.cover_url"
        :alt="`${game.title} cover`"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="coverFailed = true"
      />
      <div v-else class="cover-placeholder" aria-hidden="true">
        <Gamepad2 :size="30" />
      </div>
    </button>

    <div class="info">
      <h3 class="title">
        <button type="button" class="title-btn" @click="emit('open', game)">{{ game.title }}</button>
      </h3>
      <p class="meta">
        <span>{{ game.platform || 'Unknown platform' }}</span>
        <template v-if="game.genre">
          <span class="dot" aria-hidden="true">•</span>
          <span>{{ game.genre }}</span>
        </template>
      </p>

      <div class="row">
        <span class="badge" :class="`badge-${game.status}`">{{ STATUS_LABELS[game.status] }}</span>
        <span v-if="game.hours_played" class="hours" :aria-label="`${formatHours(game.hours_played)} played`">
          <Clock :size="14" aria-hidden="true" />
          {{ formatHours(game.hours_played) }}
        </span>
        <span
          class="stars"
          role="img"
          :aria-label="game.rating ? `Rated ${game.rating} out of 5` : 'Not rated'"
        >
          <Star
            v-for="n in 5"
            :key="n"
            :size="15"
            :class="{ filled: game.rating && n <= game.rating }"
            aria-hidden="true"
          />
        </span>
      </div>

      <p v-if="game.notes" class="notes">{{ game.notes }}</p>

      <div class="actions">
        <button
          v-if="isPlaying"
          type="button"
          class="icon-btn play-btn is-playing"
          :disabled="busy"
          :aria-label="`Stop playing ${game.title}`"
          title="Stop session"
          @click="emit('stop', game)"
        >
          <Square :size="16" fill="currentColor" />
        </button>
        <button
          v-else
          type="button"
          class="icon-btn play-btn"
          :disabled="busy"
          :aria-label="`Start playing ${game.title}`"
          :title="launchable ? 'Start the timer and open the game' : 'Start a play session'"
          @click="emit('play', game)"
        >
          <Play :size="18" />
        </button>
        <button
          type="button"
          class="icon-btn fav-btn"
          :class="{ active: game.favorite }"
          :aria-pressed="game.favorite"
          :aria-label="
            game.favorite ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`
          "
          @click="toggleFavorite"
        >
          <Motion
            :key="String(game.favorite)"
            as="span"
            class="heart"
            :initial="popped ? { scale: game.favorite ? 0.3 : 0.8 } : false"
            :animate="{ scale: 1 }"
            :transition="{ type: 'spring', stiffness: 600, damping: game.favorite ? 10 : 25 }"
          >
            <Heart :size="19" :fill="game.favorite ? 'currentColor' : 'none'" />
          </Motion>
        </button>
        <button type="button" class="icon-btn" :aria-label="`Edit ${game.title}`" @click="emit('edit', game)">
          <Pencil :size="18" />
        </button>
        <button
          type="button"
          class="icon-btn delete-btn"
          :aria-label="`Delete ${game.title}`"
          @click="emit('delete', game)"
        >
          <Trash2 :size="18" />
        </button>
        <span v-if="added" class="added">{{ added }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.game-card {
  display: flex;
  gap: 14px;
  padding: 12px;
  min-width: 0;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

@media (hover: hover) {
  .game-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-2px);
  }
}

.game-card.playing {
  border-color: color-mix(in srgb, var(--green) 55%, transparent);
  box-shadow:
    var(--shadow),
    0 0 0 1px color-mix(in srgb, var(--green) 30%, transparent);
}

.title-btn {
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.title-btn:hover {
  color: var(--accent-soft);
}

.play-btn {
  color: var(--green);
}

.play-btn.is-playing {
  color: #fff;
  border-color: transparent;
  background: var(--red);
}

.cover {
  padding: 0;
  cursor: pointer;
  width: 92px;
  aspect-ratio: 3 / 4;
  flex-shrink: 0;
  align-self: flex-start;
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--accent-soft);
  background:
    radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.35), transparent 60%),
    radial-gradient(circle at 80% 90%, rgba(244, 63, 94, 0.2), transparent 55%);
}

.info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0 6px;
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 500;
}

.dot {
  opacity: 0.6;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.hours {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 700;
}

.stars {
  display: inline-flex;
  gap: 2px;
  color: var(--text-muted);
  opacity: 0.55;
}

.stars .filled {
  color: #fbbf24;
  fill: #fbbf24;
}

.stars:has(.filled) {
  opacity: 1;
}

.stars:has(.filled) > :not(.filled) {
  opacity: 0.4;
}

.notes {
  margin: 0;
  font-size: 15px;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.actions {
  display: flex;
  flex-wrap: wrap; /* "Added ..." drops to its own line on narrow cards */
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
}

.heart {
  display: grid;
  place-items: center;
}

.added {
  margin-left: auto;
  align-self: flex-end;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.fav-btn.active {
  color: var(--red);
  border-color: color-mix(in srgb, var(--red) 45%, transparent);
  background: color-mix(in srgb, var(--red) 12%, transparent);
}

.delete-btn:hover {
  color: var(--red);
  border-color: color-mix(in srgb, var(--red) 45%, transparent);
}
</style>
