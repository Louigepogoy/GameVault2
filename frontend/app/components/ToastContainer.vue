<script setup>
import { CircleAlert, CircleCheck, Info, X } from 'lucide-vue-next';

const { toasts, dismiss } = useToast();
const icons = { success: CircleCheck, error: CircleAlert, info: Info };
</script>

<template>
  <div class="toasts" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast-${t.type}`"
        :role="t.type === 'error' ? 'alert' : 'status'"
      >
        <component :is="icons[t.type]" :size="20" class="toast-icon" />
        <span class="toast-msg">{{ t.message }}</span>
        <button type="button" class="toast-close" aria-label="Dismiss" @click="dismiss(t.id)">
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  top: max(12px, env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  width: min(420px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  --c: var(--green);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 4px 4px 14px;
  border-radius: 14px;
  background: var(--surface-solid);
  border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 18px color-mix(in srgb, var(--c) 20%, transparent);
  font-weight: 600;
  pointer-events: auto;
}

.toast-error { --c: var(--red); }
.toast-info { --c: var(--accent-soft); }

.toast-icon {
  color: var(--c);
  flex-shrink: 0;
}

.toast-msg {
  flex: 1;
  min-width: 0;
}

.toast-close {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: none;
  background: none;
  color: var(--text-muted);
  flex-shrink: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.97);
}
</style>
