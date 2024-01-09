import { defineConfig, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, join } from 'path'

import vueJsx from '@vitejs/plugin-vue-jsx'
// https://vitejs.dev/config/
export default defineConfig((): UserConfig => {
  return {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    plugins: [
      vue(),
      vueJsx({
        // options are passed on to @vue/babel-plugin-jsx
      })
    ],
    optimizeDeps: {
      exclude: ['vue-demi']
    },
    server: {
      open: true,
      hmr: true
    },
    build: {
      // outDir: 'dist',
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'Vtree',
        fileName: 'vue-tree'
      },
      rollupOptions: {
        external: ['vue', 'vue-demi'],
        output: {
          dir: join(__dirname, 'dist/v3'),
          exports: 'named',
          globals: {
            vue: 'Vue',
            'vue-demi': 'VueDemi'
          }
        }
      }
    }
  }
})
