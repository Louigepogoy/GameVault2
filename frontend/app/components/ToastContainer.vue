<script setup>
import { CircleAlert, CircleCheck, Info, Trophy, X } from 'lucide-vue-next';

const { toasts, dismiss, pause, resume, runAction } = useToast();
const icons = { success: CircleCheck, error: CircleAlert, info: Info, achievement: Trophy };
</script>

<template>
  <div class="toasts" aria-live="polite" aria-atomic="false">
    <AnimatePresence>
      <Motion
        v-for="t in toasts"
        :key="t.id"
        layout
        class="toast"
        :class="`toast-${t.type}`"
        :role="t.type === 'error' ? 'alert' : 'status'"
        :initial="{ opacity: 0, y: -24, scale: 0.95 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :exit="{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }"
        :transition="{ type: 'spring', stiffness: 420, damping: 30 }"
        @mouseenter="pause(t.id)"
        @mouseleave="resume(t.id)"
        @focusin="pause(t.id)"
        @focusout="resume(t.id)"
      >
        <component :is="icons[t.type]" :size="20" class="toast-icon" />
        <span class="toast-msg">{{ t.message }}</span>
        <button v-if="t.action" type="button" class="toast-action" @click="runAction(t)">
          {{ t.action.label }}
        </button>
        <button type="button" class="toast-close" aria-label="Dismiss" @click="dismiss(t.id)">
          <X :size="16" />
        </button>
        <!-- Time left before it closes; pauses together with the timer. -->
        <span
          class="toast-timer"
          :class="{ paused: t.paused }"
          :style="{ animationDuration: `${t.duration}ms` }"
          aria-hidden="true"
        />
      </Motion>
    </AnimatePresence>
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
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 4px 4px 14px;
  border-radius: 14px;
  background: var(--surface-solid);
  border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.3),
    0 0 18px color-mix(in srgb, var(--c) 20%, transparent);
  font-weight: 600;
  pointer-events: auto;
}

.toast-error {
  --c: var(--red);
}
.toast-info {
  --c: var(--accent-soft);
}
.toast-achievement {
  --c: var(--amber);
}

.toast-achievement .toast-msg {
  font-weight: 700;
}

.toast-icon {
  color: var(--c);
  flex-shrink: 0;
}

.toast-msg {
  flex: 1;
  min-width: 0;
}

.toast-action {
  flex-shrink: 0;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
  background: color-mix(in srgb, var(--c) 14%, transparent);
  color: var(--text);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.toast-action:hover {
  background: color-mix(in srgb, var(--c) 24%, transparent);
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

.toast-timer {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--c);
  opacity: 0.6;
  transform-origin: left;
  animation: toast-timer linear forwards;
}

.toast-timer.paused {
  animation-play-state: paused;
}

@keyframes toast-timer {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
