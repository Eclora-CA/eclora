
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  define: {
    'process.env.NODE_ENV': '"production"',
  },

  build: {
    lib: {
      entry: 'src/client.jsx',
      formats: ['es'],
      fileName: () => 'app.js',
    },

    outDir: 'dist/assets',
    emptyOutDir: false,
    copyPublicDir: false,
    target: 'es2020',
    minify: true,
  },
})
