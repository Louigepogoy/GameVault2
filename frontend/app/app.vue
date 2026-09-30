<script setup>
const { theme } = useTheme();

// The theme lives in a cookie, so the server renders the right one (no flash).
useHead({
  htmlAttrs: { lang: 'en', 'data-theme': () => theme.value },
});
</script>

<template>
  <NuxtPwaManifest />

  <div class="bg-glow" aria-hidden="true">
    <span class="blob blob-purple" />
    <span class="blob blob-red" />
    <span class="blob blob-green" />
  </div>

  <!-- reduced-motion="user": follow the device's "reduce motion" setting. -->
  <MotionConfig reduced-motion="user">
    <NuxtPage />
    <ToastContainer />
  </MotionConfig>
</template>

<style scoped>
.bg-glow {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
}

.blob-purple {
  width: 420px;
  height: 420px;
  top: -140px;
  left: -120px;
  background: var(--glow-purple);
}

.blob-red {
  width: 360px;
  height: 360px;
  top: -80px;
  right: -140px;
  background: var(--glow-red);
}

.blob-green {
  width: 400px;
  height: 400px;
  bottom: -160px;
  right: -100px;
  background: var(--glow-green);
}
</style>
