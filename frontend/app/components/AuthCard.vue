<script setup>
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
      <AppLogo :size="50" class="brand" />

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
  justify-content: center;
  margin-bottom: 20px;
  --logo-size: 30px;
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
  letter-spacing: -0.01em;
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
