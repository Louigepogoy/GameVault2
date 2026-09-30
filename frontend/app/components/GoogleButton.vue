<script>
// Google Identity Services script, loaded once and shared by every button.
let gsiPromise;
function loadGsi() {
  gsiPromise ||= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      gsiPromise = null;
      reject(new Error('Could not load Google sign-in. Check your connection.'));
    };
    document.head.appendChild(script);
  });
  return gsiPromise;
}
</script>

<script setup>
const props = defineProps({
  // Where to go after signing in.
  redirect: { type: String, default: '/' },
  // Button label: 'continue_with' | 'signin_with' | 'signup_with'
  text: { type: String, default: 'continue_with' },
});
const emit = defineEmits(['error']);

const { googleClientId } = useRuntimeConfig().public;
const nuxtApp = useNuxtApp();
const api = useApi();
const toast = useToast();
const { setSession } = useAuth();
const { theme } = useTheme();

const el = ref(null);
const busy = ref(false);
let google;

// Called by Google with the signed ID token after the user picks an account.
async function onCredential({ credential }) {
  busy.value = true;
  try {
    const session = await api.googleLogin(credential);
    setSession(session);
    toast.success(`Welcome, ${session.user.name}!`);
    await nuxtApp.runWithContext(() => navigateTo(props.redirect));
  } catch (err) {
    emit('error', err.message);
  } finally {
    busy.value = false;
  }
}

function render() {
  if (!google || !el.value) return;
  el.value.innerHTML = '';
  google.accounts.id.renderButton(el.value, {
    type: 'standard',
    theme: theme.value === 'dark' ? 'filled_black' : 'outline',
    size: 'large',
    shape: 'pill',
    text: props.text,
    logo_alignment: 'center',
    width: Math.min(el.value.clientWidth || 320, 400), // Google caps the width at 400px
  });
}

onMounted(async () => {
  if (!googleClientId) return;
  try {
    google = await loadGsi();
    google.accounts.id.initialize({ client_id: googleClientId, callback: onCredential });
    render();
  } catch (err) {
    emit('error', err.message);
  }
});

watch(theme, render);
</script>

<template>
  <div v-if="googleClientId" class="google">
    <div class="divider"><span>or</span></div>
    <div ref="el" class="google-btn" :class="{ busy }" :aria-busy="busy" />
  </div>
</template>

<style scoped>
.google {
  margin-top: 18px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.google-btn {
  display: flex;
  justify-content: center;
  min-height: 44px; /* reserve space so the page doesn't jump when the button loads */
}

.google-btn.busy {
  opacity: 0.6;
  pointer-events: none;
}
</style>
