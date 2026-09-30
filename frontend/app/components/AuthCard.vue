<script setup>
import { Gamepad2 } from 'lucide-vue-next';

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <div class="auth">
    <div class="auth-top">
      <ThemeToggle />
    </div>

    <main class="auth-inner">
      <div class="brand">
        <div class="logo-icon">
          <Gamepad2 :size="28" :stroke-width="2.25" />
        </div>
        <span class="logo">GameVault</span>
      </div>

      <section class="card auth-card">
        <h1>{{ title }}</h1>
        <p v-if="subtitle" class="lead">{{ subtitle }}</p>
        <slot />
      </section>

      <p v-if="$slots.footer" class="footer">
        <slot name="footer" />
      </p>
    </main>
  </div>
</template>

<style scoped>
.auth {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
}

.auth-top {
  display: flex;
  justify-content: flex-end;
}

.auth-inner {
  width: 100%;
  max-width: 420px;
  margin: auto;
  padding: 16px 0 32px;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.logo-icon {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, #a78bfa, #6d28d9);
  box-shadow: 0 0 24px rgba(139, 92, 246, 0.6);
}

.logo {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.1;
  color: var(--accent-soft);
  text-shadow: 0 0 18px rgba(139, 92, 246, 0.65), 0 0 36px rgba(139, 92, 246, 0.35);
}

:global([data-theme='light']) .logo {
  text-shadow: 0 0 16px rgba(139, 92, 246, 0.3);
}

.auth-card {
  padding: 24px 20px;
}

@media (min-width: 480px) {
  .auth-card {
    padding: 28px;
  }
}

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.04em;
}

.lead {
  margin: 6px 0 20px;
  color: var(--text-muted);
  font-weight: 500;
}

.footer {
  margin: 18px 0 0;
  text-align: center;
  color: var(--text-muted);
  font-weight: 600;
}
</style>
