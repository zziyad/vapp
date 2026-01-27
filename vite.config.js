import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Radix UI components (large library)
          'radix-ui': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
          ],
          // UI utilities
          'ui-utils': ['class-variance-authority', 'clsx', 'tailwind-merge'],
          // Icons (lucide-react can be large)
          'icons': ['lucide-react'],
          // Other vendors
          'other-vendors': ['sonner', 'next-themes'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
