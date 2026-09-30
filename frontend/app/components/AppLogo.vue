<script setup>
// GameVault logo: a controller with a keyhole (your games, kept safe) plus the wordmark.
// The same mark is used for the favicon and app icons (public/favicon.svg).
defineProps({
  size: { type: Number, default: 44 }, // mark size in px
  tag: { type: String, default: 'span' }, // e.g. 'h1' on the home page
  tagline: { type: String, default: '' },
});

// Unique gradient id, so several logos on one page don't clash.
const gradientId = `gv-bg-${useId()}`;
</script>

<template>
  <div class="app-logo">
    <svg class="mark" :width="size" :height="size" viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" x1="6" y1="4" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#a78bfa" />
          <stop offset="1" stop-color="#6d28d9" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" :fill="`url(#${gradientId})`" />
      <path
        fill="#fff"
        d="M15.6 13.5h16.8c4.6 0 8 3 8.9 7.4l1.9 9.8c.8 4.2-2.2 7.8-5.9 7.8-2.2 0-4-1.1-5.1-2.9l-1.3-2.1H17.1l-1.3 2.1c-1.1 1.8-2.9 2.9-5.1 2.9-3.7 0-6.7-3.6-5.9-7.8l1.9-9.8c.9-4.4 4.3-7.4 8.9-7.4z"
      />
      <path
        fill="#6d28d9"
        d="M24 18.6a3.5 3.5 0 0 0-1.9 6.4l-.9 4.4a.8.8 0 0 0 .8 1h4a.8.8 0 0 0 .8-1l-.9-4.4a3.5 3.5 0 0 0-1.9-6.4z"
      />
      <g fill="#7c3aed" opacity=".55">
        <rect x="11.2" y="21.9" width="6" height="2.2" rx=".8" />
        <rect x="13.1" y="20" width="2.2" height="6" rx=".8" />
        <circle cx="34.6" cy="20.9" r="1.5" />
        <circle cx="34.6" cy="25.3" r="1.5" />
        <circle cx="32.4" cy="23.1" r="1.5" />
        <circle cx="36.8" cy="23.1" r="1.5" />
      </g>
    </svg>
    <div class="text">
      <component :is="tag" class="wordmark">Game<span class="accent">Vault</span></component>
      <p v-if="tagline" class="tagline">{{ tagline }}</p>
    </div>
  </div>
</template>

<style scoped>
.app-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.mark {
  flex-shrink: 0;
  border-radius: 28%;
  box-shadow: 0 6px 18px rgba(109, 40, 217, 0.35);
}

.text {
  min-width: 0;
}

.wordmark {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--logo-size, clamp(22px, 5.6vw, 28px));
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--text);
  white-space: nowrap;
}

.accent {
  color: var(--accent-soft);
}

.tagline {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
