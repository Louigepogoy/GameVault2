<script setup>
import { ArrowLeft, LogOut, RotateCcw } from 'lucide-vue-next';
import { GENRES, PLATFORM_PREFS } from '~/utils/constants';

useHead({ title: 'Settings · GameVault' });

const api = useApi();
const toast = useToast();
const { user, updateUser, logout } = useAuth();

// ---------- Preferences ----------
const platforms = ref([...(user.value?.favorite_platforms ?? [])]);
const genres = ref([...(user.value?.favorite_genres ?? [])]);
const saving = ref(false);

const sameList = (a = [], b = []) => a.length === b.length && a.every((x) => b.includes(x));
const dirty = computed(
  () =>
    !sameList(platforms.value, user.value?.favorite_platforms) ||
    !sameList(genres.value, user.value?.favorite_genres),
);

async function savePreferences() {
  saving.value = true;
  try {
    const { user: next } = await api.updateMe({
      favorite_platforms: platforms.value,
      favorite_genres: genres.value,
    });
    updateUser(next);
    toast.success('Preferences saved. Your suggestions will use them.');
  } catch (err) {
    toast.error(err.message);
  } finally {
    saving.value = false;
  }
}

// ---------- Redo onboarding ----------
const redoing = ref(false);
async function redoOnboarding() {
  redoing.value = true;
  try {
    const { user: next } = await api.updateMe({ onboarding_completed: false });
    updateUser(next);
    await navigateTo('/welcome');
  } catch (err) {
    toast.error(err.message);
  } finally {
    redoing.value = false;
  }
}
</script>

<template>
  <div class="app">
    <header class="header">
      <NuxtLink to="/" class="icon-btn" aria-label="Back to your games">
        <ArrowLeft :size="20" />
      </NuxtLink>
      <h1 class="page-title">Settings</h1>
      <ThemeToggle />
    </header>

    <main class="main">
      <section class="card panel" aria-labelledby="account-title">
        <h2 id="account-title">Account</h2>
        <dl class="account">
          <div>
            <dt>Name</dt>
            <dd>{{ user?.name }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ user?.email }}</dd>
          </div>
        </dl>
        <button type="button" class="btn btn-ghost" @click="logout">
          <LogOut :size="18" />
          Log out
        </button>
      </section>

      <section class="card panel" aria-labelledby="prefs-title">
        <h2 id="prefs-title">Your preferences</h2>
        <p class="sub">Used for game suggestions and default filters on Discover.</p>

        <h3>Platforms</h3>
        <ChipSelect v-model="platforms" :options="PLATFORM_PREFS" label="Platforms you play on" />

        <h3>Favorite genres</h3>
        <ChipSelect v-model="genres" :options="GENRES" label="Favorite genres" />

        <div class="row-end">
          <button type="button" class="btn btn-primary" :disabled="!dirty || saving" @click="savePreferences">
            {{ saving ? 'Saving...' : dirty ? 'Save Preferences' : 'Saved' }}
          </button>
        </div>
      </section>

      <section class="card panel" aria-labelledby="onboarding-title">
        <h2 id="onboarding-title">Welcome tour</h2>
        <p class="sub">Go through the first-time setup again: platforms, genres and adding games.</p>
        <button type="button" class="btn btn-ghost" :disabled="redoing" @click="redoOnboarding">
          <RotateCcw :size="18" />
          {{ redoing ? 'Opening...' : 'Redo onboarding' }}
        </button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 48px
    max(16px, env(safe-area-inset-left));
}

@media (min-width: 640px) {
  .app {
    padding: 32px 24px 48px;
  }
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.page-title {
  flex: 1;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(22px, 6vw, 30px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--accent-soft);
}

.main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  padding: 18px 20px 20px;
}

h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

h3 {
  margin: 18px 0 10px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.sub {
  margin: 4px 0 14px;
  color: var(--text-muted);
  font-weight: 500;
}

.account {
  margin: 12px 0 16px;
  display: grid;
  gap: 10px;
}

.account dt {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 700;
}

.account dd {
  margin: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.row-end {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
</style>
