<script setup>
useHead({ title: 'Log in · GameVault' });

const api = useApi();
const { setSession } = useAuth();
const route = useRoute();

const form = reactive({ email: '', password: '' });
const error = ref('');
const loading = ref(false);

// Only follow redirects within this site.
const redirect = computed(() => {
  const r = route.query.redirect;
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/';
});

async function submit() {
  error.value = '';
  if (!form.email.trim() || !form.password) {
    error.value = 'Enter your email and password.';
    return;
  }
  loading.value = true;
  try {
    setSession(await api.login({ email: form.email.trim(), password: form.password }));
    await navigateTo(redirect.value);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthCard title="Welcome back" subtitle="Log in to open your game vault.">
    <p v-if="error" class="form-alert form-alert-error" role="alert">{{ error }}</p>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <div class="group">
        <label for="login-email">Email</label>
        <input
          id="login-email"
          v-model="form.email"
          class="field"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="you@example.com"
          autofocus
          required
        />
      </div>

      <div class="group">
        <div class="label-row">
          <label for="login-password">Password</label>
          <NuxtLink to="/forgot-password" class="link hint">Forgot password?</NuxtLink>
        </div>
        <PasswordInput
          id="login-password"
          v-model="form.password"
          autocomplete="current-password"
          placeholder="Your password"
          required
        />
      </div>

      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Log In' }}
      </button>
    </form>

    <GoogleButton text="signin_with" :redirect="redirect" @error="error = $event" />

    <template #footer>
      New to GameVault?
      <NuxtLink to="/register" class="link">Create an account</NuxtLink>
    </template>
  </AuthCard>
</template>
