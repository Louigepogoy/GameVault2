<script setup>
import { Check, Plus, Sparkles } from 'lucide-vue-next';

const props = defineProps({
  game: { type: Object, required: true },
  adding: { type: Boolean, default: false },
});
const emit = defineEmits(['open', 'add']);

const imageFailed = ref(false);

// Games without store art get a generated gradient, tinted by the title.
const hue = computed(() => [...props.game.title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7));
const initials = computed(() =>
  props.game.title
    .split(/[\s:]+/)
    .filter((w) => /^[a-z0-9]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(''),
);
</script>

<template>
  <Motion
    as="article"
    class="card d-card"
    :initial="{ opacity: 0, y: 24 }"
    :while-in-view="{ opacity: 1, y: 0 }"
    :in-view-options="{ once: true, margin: '0px 0px -40px 0px' }"
    :while-hover="{ y: -4 }"
    :transition="{ type: 'spring', stiffness: 260, damping: 26 }"
  >
    <button type="button" class="art" :aria-label="`About ${game.title}`" @click="emit('open', game)">
      <img
        v-if="game.image_url && !imageFailed"
        :src="game.image_url"
        :alt="`${game.title} artwork`"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imageFailed = true"
      />
      <span v-else class="art-fallback" :style="{ '--h': hue }" aria-hidden="true">
        <span class="art-initials">{{ initials }}</span>
      </span>
      <span class="price" :class="game.price">{{ game.price === 'free' ? 'Free to play' : 'Paid' }}</span>
    </button>

    <div class="body">
      <h3 class="title">
        <button type="button" class="title-btn" @click="emit('open', game)">{{ game.title }}</button>
      </h3>
      <p class="meta">{{ game.genre }} · {{ game.developer }} · {{ game.year }}</p>
      <p class="summary">{{ game.summary }}</p>
      <p v-if="game.match && !game.in_vault" class="match">
        <Sparkles :size="14" aria-hidden="true" />
        Because you play {{ game.match }} games
      </p>

      <div class="actions">
        <button type="button" class="btn btn-ghost" @click="emit('open', game)">Details & Links</button>
        <button
          v-if="!game.in_vault"
          type="button"
          class="icon-btn add"
          :disabled="adding"
          :aria-label="`Add ${game.title} to your vault`"
          title="Add to my vault (Backlog)"
          @click="emit('add', game)"
        >
          <Plus :size="20" />
        </button>
        <span
          v-else
          class="icon-btn owned"
          role="img"
          :aria-label="`${game.title} is in your vault`"
          title="In your vault"
        >
          <Check :size="20" />
        </span>
      </div>
    </div>
  </Motion>
</template>

<style scoped>
.d-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  transition: border-color 0.2s ease;
}

@media (hover: hover) {
  .d-card:hover {
    border-color: var(--border-strong);
  }
}

.art {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 460 / 215; /* Steam header art */
  padding: 0;
  border: none;
  background: var(--surface-2);
  overflow: hidden;
}

.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.art-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 20% 20%, hsl(var(--h) 80% 60% / 0.55), transparent 60%),
    radial-gradient(circle at 85% 85%, hsl(calc(var(--h) + 60) 80% 55% / 0.45), transparent 55%),
    linear-gradient(135deg, #1e1838, #0f0c1d);
}

.art-initials {
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 700;
  letter-spacing: 0;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

.price {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  background: rgba(15, 12, 29, 0.78);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.price.free {
  background: #15803d;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px 16px;
  flex: 1;
}

.title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.2;
}

.title-btn {
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
}

.title-btn:hover {
  color: var(--accent-soft);
}

.meta {
  margin: 0;
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 600;
}

.summary {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 500;
}

.match {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 0;
  color: var(--accent-soft);
  font-size: 14px;
  font-weight: 700;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
}

.actions .btn {
  flex: 1;
}

.add {
  color: var(--accent-soft);
}

.owned {
  color: var(--green);
  border-color: color-mix(in srgb, var(--green) 45%, transparent);
  background: color-mix(in srgb, var(--green) 12%, transparent);
  cursor: default;
}
</style>
