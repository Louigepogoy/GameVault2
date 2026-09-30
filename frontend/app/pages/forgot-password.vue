<script setup>
useHead({ title: 'Forgot password · GameVault' });

const api = useApi();

const email = ref('');
const error = ref('');
const sent = ref(false);
const loading = ref(false);

async function submit() {
  error.value = '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    error.value = 'Enter a valid email address.';
    return;
  }
  loading.value = true;
  try {
    await api.forgotPassword(email.value.trim());
    sent.value = true;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthCard
    title="Forgot password"
    :subtitle="sent ? '' : 'Enter your email and we\'ll send you a link to reset your password.'"
  >
    <template v-if="sent">
      <p class="form-alert form-alert-success" role="status">
        If an account exists for <strong>{{ email.trim() }}</strong
        >, a reset link is on its way. The link works for 1 hour.
      </p>
      <p class="hint-text">Didn't get it? Check your spam folder, or try again.</p>
      <div class="auth-form">
        <button type="button" class="btn btn-ghost" @click="sent = false">Try again</button>
      </div>
    </template>

    <template v-else>
      <p v-if="error" class="form-alert form-alert-error" role="alert">{{ error }}</p>

      <form class="auth-form" novalidate @submit.prevent="submit">
        <div class="group">
          <label for="forgot-email">Email</label>
          <input
            id="forgot-email"
            v-model="email"
            class="field"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder="you@example.com"
            autofocus
            required
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>
    </template>

    <template #footer>
      Remembered it?
      <NuxtLink to="/login" class="link">Back to log in</NuxtLink>
    </template>
  </AuthCard>
</template>

<style scoped>
.hint-text {
  margin: 0 0 8px;
  color: var(--text-muted);
  font-weight: 500;
}
</style>
