<script setup>
useHead({ title: 'Create account · GameVault' });

const api = useApi();
const toast = useToast();
const { setSession } = useAuth();

const form = reactive({ name: '', email: '', password: '', confirm: '' });
const errors = reactive({ name: '', email: '', password: '', confirm: '' });
const error = ref('');
const loading = ref(false);

function validate() {
  errors.name = form.name.trim() ? '' : 'Name is required.';
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '' : 'Enter a valid email address.';
  errors.password = form.password.length >= 8 ? '' : 'Use at least 8 characters.';
  errors.confirm = form.confirm === form.password ? '' : 'Passwords do not match.';
  return !Object.values(errors).some(Boolean);
}

async function submit() {
  error.value = '';
  if (!validate()) return;
  loading.value = true;
  try {
    const session = await api.register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    setSession(session);
    toast.success(`Welcome to GameVault, ${session.user.name}!`);
    await navigateTo('/');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthCard title="Create account" subtitle="Start tracking your gaming collection.">
    <p v-if="error" class="form-alert form-alert-error" role="alert">{{ error }}</p>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <div class="group">
        <label for="reg-name">Name</label>
        <input
          id="reg-name"
          v-model="form.name"
          class="field"
          :class="{ invalid: errors.name }"
          type="text"
          maxlength="80"
          autocomplete="name"
          placeholder="Your name"
          autofocus
          :aria-invalid="!!errors.name"
          aria-describedby="reg-name-err"
        />
        <p v-if="errors.name" id="reg-name-err" class="error">{{ errors.name }}</p>
      </div>

      <div class="group">
        <label for="reg-email">Email</label>
        <input
          id="reg-email"
          v-model="form.email"
          class="field"
          :class="{ invalid: errors.email }"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="you@example.com"
          :aria-invalid="!!errors.email"
          aria-describedby="reg-email-err"
        />
        <p v-if="errors.email" id="reg-email-err" class="error">{{ errors.email }}</p>
      </div>

      <div class="group">
        <label for="reg-password">Password</label>
        <PasswordInput
          id="reg-password"
          v-model="form.password"
          :class="{ invalid: errors.password }"
          maxlength="72"
          autocomplete="new-password"
          placeholder="At least 8 characters"
          :aria-invalid="!!errors.password"
          aria-describedby="reg-password-err"
        />
        <p v-if="errors.password" id="reg-password-err" class="error">{{ errors.password }}</p>
      </div>

      <div class="group">
        <label for="reg-confirm">Confirm password</label>
        <PasswordInput
          id="reg-confirm"
          v-model="form.confirm"
          :class="{ invalid: errors.confirm }"
          maxlength="72"
          autocomplete="new-password"
          placeholder="Type it again"
          :aria-invalid="!!errors.confirm"
          aria-describedby="reg-confirm-err"
        />
        <p v-if="errors.confirm" id="reg-confirm-err" class="error">{{ errors.confirm }}</p>
      </div>

      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Creating account...' : 'Create Account' }}
      </button>
    </form>

    <GoogleButton text="signup_with" @error="error = $event" />

    <template #footer>
      Already have an account?
      <NuxtLink to="/login" class="link">Log in</NuxtLink>
    </template>
  </AuthCard>
</template>
