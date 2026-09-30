<script setup>
useHead({ title: 'Reset password · GameVault' });

const api = useApi();
const toast = useToast();
const { setSession } = useAuth();
const route = useRoute();

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''));

const form = reactive({ password: '', confirm: '' });
const errors = reactive({ password: '', confirm: '' });
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  errors.password = form.password.length >= 8 ? '' : 'Use at least 8 characters.';
  errors.confirm = form.confirm === form.password ? '' : 'Passwords do not match.';
  if (errors.password || errors.confirm) return;

  loading.value = true;
  try {
    setSession(await api.resetPassword({ token: token.value, password: form.password }));
    toast.success('Password updated. You are now logged in.');
    await navigateTo('/');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthCard title="Reset password" :subtitle="token ? 'Choose a new password for your account.' : ''">
    <template v-if="!token">
      <p class="form-alert form-alert-error" role="alert">
        This reset link is incomplete. Open the link from your email again, or request a new one.
      </p>
      <div class="auth-form">
        <NuxtLink to="/forgot-password" class="btn btn-primary">Request New Link</NuxtLink>
      </div>
    </template>

    <template v-else>
      <p v-if="error" class="form-alert form-alert-error" role="alert">
        {{ error }}
        <NuxtLink to="/forgot-password" class="link">Request a new link.</NuxtLink>
      </p>

      <form class="auth-form" novalidate @submit.prevent="submit">
        <div class="group">
          <label for="reset-password">New password</label>
          <PasswordInput
            id="reset-password"
            v-model="form.password"
            :class="{ invalid: errors.password }"
            maxlength="72"
            autocomplete="new-password"
            placeholder="At least 8 characters"
            autofocus
            :aria-invalid="!!errors.password"
            aria-describedby="reset-password-err"
          />
          <p v-if="errors.password" id="reset-password-err" class="error">{{ errors.password }}</p>
        </div>

        <div class="group">
          <label for="reset-confirm">Confirm new password</label>
          <PasswordInput
            id="reset-confirm"
            v-model="form.confirm"
            :class="{ invalid: errors.confirm }"
            maxlength="72"
            autocomplete="new-password"
            placeholder="Type it again"
            :aria-invalid="!!errors.confirm"
            aria-describedby="reset-confirm-err"
          />
          <p v-if="errors.confirm" id="reset-confirm-err" class="error">{{ errors.confirm }}</p>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save New Password' }}
        </button>
      </form>
    </template>

    <template #footer>
      <NuxtLink to="/login" class="link">Back to log in</NuxtLink>
    </template>
  </AuthCard>
</template>
