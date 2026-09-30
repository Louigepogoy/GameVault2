<script setup>
defineProps({
  title: { type: String, default: 'No games found.' },
  message: { type: String, default: 'Try changing your search or filter.' },
});
</script>

<template>
  <div class="card empty" role="status">
    <div class="emoji" aria-hidden="true">😕</div>
    <p class="title">{{ title }}</p>
    <p class="message">{{ message }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  padding: 48px 20px;
}

.emoji {
  font-size: 52px;
  line-height: 1;
  margin-bottom: 10px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.message {
  margin: 0 0 12px;
  color: var(--text-muted);
}
</style>
