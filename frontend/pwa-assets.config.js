import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Same icon sizes as the "minimal-2023" preset. The maskable and Apple icons are then
// redrawn full-bleed by scripts/full-bleed-icons.mjs; the purple background here only
// matters if that step is skipped.
const background = '#7c3aed';

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background } },
  },
  images: ['public/favicon.svg'],
});
