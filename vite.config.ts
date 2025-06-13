/**
 * Vite configuration for Solarium Web Portal
 * Configures React development server, build optimization, and environment handling
 */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // Path resolution for absolute imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/layouts': path.resolve(__dirname, './src/layouts'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/tests': path.resolve(__dirname, './src/tests'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/routes': path.resolve(__dirname, './src/routes'),
        '@/theme': path.resolve(__dirname, './src/theme'),
      },
    },

    // Development server configuration
    server: {
      port: 3000,
      host: true,
      open: true,
      cors: true,
    },

    // Preview server configuration
    preview: {
      port: 3001,
      host: true,
      open: true,
    },

    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: env.GENERATE_SOURCEMAP === 'true',
      target: 'es2015',

      // Optimize bundle size
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            vendor: ['react', 'react-dom'],
            mui: [
              '@mui/material',
              '@mui/icons-material',
              '@emotion/react',
              '@emotion/styled',
            ],
            router: ['react-router-dom'],
          },
          // Naming pattern for chunks
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: assetInfo => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];

            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[ext]/[name]-[hash][extname]`;
          },
        },
      },

      // Build optimizations
      minify: mode === 'production' ? 'terser' : false,
      terserOptions:
        mode === 'production'
          ? {
              compress: {
                drop_console: true,
                drop_debugger: true,
              },
            }
          : undefined,

      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },

    // Environment variable prefix
    envPrefix: 'REACT_APP_',

    // CSS configuration
    css: {
      devSourcemap: mode === 'development',
      modules: {
        localsConvention: 'camelCase',
      },
    },

    // Optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@mui/material',
        '@mui/icons-material',
        'react-router-dom',
      ],
    },
  };
});
