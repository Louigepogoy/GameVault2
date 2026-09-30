<script setup>
import { Moon, Sun } from 'lucide-vue-next';

const { theme, toggle } = useTheme();
</script>

<template>
  <button
    type="button"
    class="icon-btn theme-toggle"
    :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="theme === 'dark' ? 'Light mode' : 'Dark mode'"
    @click="toggle"
  >
    <Transition name="spin" mode="out-in">
      <Sun v-if="theme === 'dark'" key="sun" :size="20" />
      <Moon v-else key="moon" :size="20" />
    </Transition>
  </button>
</template>

<style scoped>
.theme-toggle {
  color: var(--accent-soft);
  border-radius: 50%;
}

.spin-enter-active,
.spin-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.spin-enter-from {
  transform: rotate(-90deg) scale(0.5);
  opacity: 0;
}

.spin-leave-to {
  transform: rotate(90deg) scale(0.5);
  opacity: 0;
}
</style>
