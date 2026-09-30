import prettier from 'eslint-config-prettier';
import withNuxt from './.nuxt/eslint.config.mjs';

// Nuxt's recommended rules (aware of auto-imports), with formatting left to Prettier.
export default withNuxt(
  {
    rules: {
      // Existing single-word component names (Toolbar, etc.) are fine in this app.
      'vue/multi-word-component-names': 'off',
    },
  },
  prettier,
);
