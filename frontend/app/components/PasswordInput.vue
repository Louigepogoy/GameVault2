<script setup>
import { Eye, EyeOff } from 'lucide-vue-next';

defineOptions({ inheritAttrs: false });
const model = defineModel({ type: String, default: '' });
const visible = ref(false);
</script>

<template>
  <div class="password">
    <input v-model="model" v-bind="$attrs" :type="visible ? 'text' : 'password'" class="field" />
    <button
      type="button"
      class="toggle"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" :size="18" />
      <Eye v-else :size="18" />
    </button>
  </div>
</template>

<style scoped>
.password {
  position: relative;
}

.field {
  padding-right: 48px;
}

.toggle {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: none;
  color: var(--text-muted);
}

.toggle:hover {
  color: var(--text);
}
</style>
