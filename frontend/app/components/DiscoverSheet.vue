<script setup>
import { Check, CheckCircle2, ExternalLink, Plus, ShieldCheck } from 'lucide-vue-next';

const props = defineProps({
  game: { type: Object, default: null },
  open: { type: Boolean, default: false },
  adding: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'add']);

// Which platform to save when adding to the vault.
const platform = ref('');
watch(
  () => props.game,
  (g) => (platform.value = g?.platforms[0] ?? ''),
  { immediate: true },
);

const imageFailed = ref(false);
watch(
  () => props.game?.slug,
  () => (imageFailed.value = false),
);

const linkHint = (link) => {
  if (link.label === 'Official site') return 'Info & download';
  return props.game?.price === 'free' ? 'Free download' : 'Buy & download';
};
</script>

<template>
  <BaseSheet :open="open && !!game" :title="game?.title ?? ''" @close="emit('close')">
    <template v-if="game">
      <img
        v-if="game.image_url && !imageFailed"
        class="hero"
        :src="game.image_url"
        :alt="`${game.title} artwork`"
        referrerpolicy="no-referrer"
        @error="imageFailed = true"
      />

      <div class="chips">
        <span class="chip" :class="game.price">{{ game.price === 'free' ? 'Free to play' : 'Paid' }}</span>
        <span class="chip">{{ game.genre }}</span>
        <span class="chip">{{ game.developer }}</span>
        <span class="chip">{{ game.year }}</span>
      </div>

      <section class="section">
        <h3>About the game</h3>
        <p class="about">{{ game.about }}</p>
      </section>

      <section class="section">
        <h3>Why play it</h3>
        <ul class="highlights">
          <li v-for="h in game.highlights" :key="h">
            <CheckCircle2 :size="18" aria-hidden="true" />
            <span>{{ h }}</span>
          </li>
        </ul>
      </section>

      <section class="section">
        <h3>Platforms</h3>
        <div class="chips">
          <span v-for="p in game.platforms" :key="p" class="chip">{{ p }}</span>
        </div>
      </section>

      <section class="section">
        <h3>Where to get it</h3>
        <div class="links">
          <a
            v-for="link in game.links"
            :key="link.url"
            class="store-link"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              <strong>{{ link.label }}</strong>
              <small>{{ linkHint(link) }}</small>
            </span>
            <ExternalLink :size="18" aria-hidden="true" />
          </a>
        </div>
        <p class="safe">
          <ShieldCheck :size="16" aria-hidden="true" />
          Official stores and websites only. Always download games from official sources.
        </p>
      </section>

      <div v-if="game.in_vault" class="in-vault">
        <Check :size="18" />
        Already in your vault
      </div>
      <form v-else class="add-row" @submit.prevent="emit('add', game, platform)">
        <label for="d-platform" class="sr-only">Platform</label>
        <select id="d-platform" v-model="platform" class="field">
          <option v-for="p in game.platforms" :key="p" :value="p">{{ p }}</option>
        </select>
        <button type="submit" class="btn btn-primary" :disabled="adding">
          <Plus :size="18" />
          {{ adding ? 'Adding...' : 'Add to Vault' }}
        </button>
      </form>
    </template>
  </BaseSheet>
</template>

<style scoped>
.hero {
  width: 100%;
  aspect-ratio: 460 / 215;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid var(--border);
  margin-bottom: 14px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  font-size: 14px;
  font-weight: 600;
}

.chip.free {
  color: var(--green);
  border-color: color-mix(in srgb, var(--green) 45%, transparent);
  background: color-mix(in srgb, var(--green) 12%, transparent);
}

.section {
  margin-top: 18px;
}

h3 {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.about {
  margin: 0;
  font-size: 17px;
  font-weight: 500;
}

.highlights {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.highlights li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-weight: 600;
}

.highlights svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--green);
}

.links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.store-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 52px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    transform 0.15s ease;
}

.store-link:hover {
  border-color: var(--border-strong);
}

.store-link:active {
  transform: scale(0.98);
}

.store-link span {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.store-link small {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.store-link svg {
  flex-shrink: 0;
  color: var(--accent-soft);
}

.safe {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
}

.safe svg {
  flex-shrink: 0;
  color: var(--green);
}

.add-row,
.in-vault {
  margin-top: 20px;
}

.add-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.in-vault {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  border-radius: 12px;
  color: var(--green);
  border: 1px solid color-mix(in srgb, var(--green) 45%, transparent);
  background: color-mix(in srgb, var(--green) 12%, transparent);
  font-weight: 700;
}
</style>
