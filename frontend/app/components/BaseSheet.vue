<script setup>
import { X } from 'lucide-vue-next';

// Dialog that is a bottom sheet on phones and a centered modal on larger screens.
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  size: { type: String, default: 'md' }, // 'sm' | 'md'
});
const emit = defineEmits(['close']);

const panel = ref(null);
let lastFocused = null;

function onKeydown(e) {
  if (e.key === 'Escape') emit('close');
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      lastFocused = document.activeElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKeydown);
      await nextTick();
      // On touch devices, don't pop the keyboard while the sheet is sliding in.
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      const target = (finePointer && panel.value?.querySelector('[autofocus]')) || panel.value;
      target?.focus({ preventScroll: true });
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
      lastFocused?.focus?.();
    }
  },
);

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <Teleport to="#teleports">
    <Transition name="sheet">
      <div v-if="open" class="overlay" @click.self="emit('close')">
        <div
          ref="panel"
          class="sheet"
          :class="`sheet-${size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
        >
          <div class="handle" aria-hidden="true" />
          <header class="sheet-header">
            <h2>{{ title }}</h2>
            <button type="button" class="icon-btn" aria-label="Close" @click="emit('close')">
              <X :size="20" />
            </button>
          </header>
          <div class="sheet-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: var(--backdrop);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.sheet {
  width: 100%;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  background: var(--surface-solid);
  border: 1px solid var(--border-strong);
  border-bottom: none;
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -10px 40px rgba(139, 92, 246, 0.25);
  padding-bottom: env(safe-area-inset-bottom);
  outline: none;
}

.handle {
  width: 44px;
  height: 5px;
  border-radius: 999px;
  background: var(--border-strong);
  margin: 10px auto 0;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px 8px 20px;
}

h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.04em;
}

.sheet-body {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px 20px 20px;
}

/* Mobile: slide up from the bottom */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}

/* Tablet/desktop: centered modal that scales in */
@media (min-width: 640px) {
  .overlay {
    align-items: center;
    padding: 24px;
  }

  .sheet {
    max-width: 560px;
    max-height: 88vh;
    border-radius: 20px;
    border-bottom: 1px solid var(--border-strong);
    box-shadow: 0 20px 60px rgba(139, 92, 246, 0.25);
    padding-bottom: 0;
  }

  .sheet-sm {
    max-width: 420px;
  }

  .handle {
    display: none;
  }

  .sheet-header {
    padding-top: 16px;
  }

  .sheet-enter-from .sheet,
  .sheet-leave-to .sheet {
    transform: translateY(16px) scale(0.97);
  }
}
</style>
