import Vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import WebExtension from 'vite-plugin-web-extension';
import pkg from './package.json';
import { generateManifest } from './scripts/generate-manifest';
import { rootPath } from './scripts/utils';

let webExtConfig = {};
try {
  webExtConfig = require('./.web-ext.config.json');
} catch (_) {
  // noop
}

const browser = process.env.BUILD_FOR || 'firefox';
const mode = process.env.BUILD_MODE || 'test';

const developmentModes: ExtensionMode[] = ['dev', 'test', 'staged'];
const viteModes: Record<ExtensionMode, 'development' | 'production'> = {
  beta: 'production',
  dev: 'development',
  prod: 'production',
  staged: 'development',
  test: 'development',
};

export default defineConfig({
  root: rootPath('src'),
  mode: viteModes[mode],
  plugins: [
    Components({
      dts: true,
      allowOverrides: true,
      dirs: [rootPath('src')],

      /**
       * Hack to fix:
       * https://github.com/anime-skip/web-extension/issues/169
       */
      importPathTransform: path => {
        return path.startsWith('C:') ? path.replaceAll('\\', '\\\\') : path;
      },
    }),
    WebExtension({
      assets: 'assets',
      manifest: () => generateManifest({ browser, mode }),
      browser,
      webExtConfig,
    }),
    Vue(),
  ],
  build: {
    outDir: rootPath('dist'),
    emptyOutDir: true,
    sourcemap: developmentModes.includes(mode) ? 'inline' : undefined,
  },
  define: {
    EXTENSION_VERSION: `'${pkg.version}'`,
    EXTENSION_MODE: `'${mode}'`,
    TARGET_BROWSER: `'${browser}'`,
  },
  resolve: {
    alias: {
      '~/': rootPath('src') + '/',
      '~api': rootPath('../common/src/api'),
      '~utils': rootPath('../common/src/utils') + '/',
      '~types': rootPath('../common/src/types'),
    },
  },
  optimizeDeps: {
    include: ['vue', '@vueuse/core'],
    exclude: ['vue-demi'],
  },
});
