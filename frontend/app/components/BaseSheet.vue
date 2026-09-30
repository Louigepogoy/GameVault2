<script setup>
import { X } from 'lucide-vue-next';

// Dialog that is a bottom sheet on phones and a centered modal on larger screens.
// On phones it slides up with a spring and can be swiped down to close.
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  size: { type: String, default: 'md' }, // 'sm' | 'md'
});
const emit = defineEmits(['close']);

const panel = ref(null);
let lastFocused = null;

// Phone layout (bottom sheet) vs. larger screens (centered modal).
const isPhone = ref(false);
let phoneQuery;
const syncPhone = () => (isPhone.value = phoneQuery.matches);
onMounted(() => {
  phoneQuery = window.matchMedia('(max-width: 639px)');
  syncPhone();
  phoneQuery.addEventListener('change', syncPhone);
});

const sheetMotion = computed(() =>
  isPhone.value
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { opacity: 0, y: 24, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 16, scale: 0.97 } },
);
const spring = { type: 'spring', stiffness: 380, damping: 34 };

// Swipe down from the handle/header to close (phones only), like native sheets.
const dragControls = useDragControls();
function startDrag(e) {
  if (isPhone.value) dragControls.start(e);
}
function onDragEnd(_e, info) {
  if (info.offset.y > 110 || info.velocity.y > 600) emit('close');
}

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
  phoneQuery?.removeEventListener('change', syncPhone);
});
</script>

<template>
  <Teleport to="#teleports">
    <AnimatePresence>
      <Motion
        v-if="open"
        key="overlay"
        class="overlay"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.2 }"
        @click.self="emit('close')"
      >
        <Motion
          class="sheet"
          :class="`sheet-${size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          :initial="sheetMotion.initial"
          :animate="sheetMotion.animate"
          :exit="sheetMotion.exit"
          :transition="spring"
          :drag="isPhone ? 'y' : false"
          :drag-controls="dragControls"
          :drag-listener="false"
          :drag-constraints="{ top: 0, bottom: 0 }"
          :drag-elastic="{ top: 0, bottom: 0.7 }"
          @drag-end="onDragEnd"
        >
          <div ref="panel" class="sheet-inner" tabindex="-1">
            <div class="grab" @pointerdown="startDrag">
              <div class="handle" aria-hidden="true" />
              <header class="sheet-header">
                <h2>{{ title }}</h2>
                <button type="button" class="icon-btn" aria-label="Close" @click="emit('close')">
                  <X :size="20" />
                </button>
              </header>
            </div>
            <div class="sheet-body">
              <slot />
            </div>
          </div>
        </Motion>
      </Motion>
    </AnimatePresence>
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
}

.sheet-inner {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0; /* lets .sheet-body scroll inside the max-height */
  outline: none;
}

/* The grab area can be dragged down on phones; keep the browser from scrolling instead. */
.grab {
  touch-action: none;
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

/* Tablet/desktop: centered modal */
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

  .grab {
    touch-action: auto;
  }
}
</style>
