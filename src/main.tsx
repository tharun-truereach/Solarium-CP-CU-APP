/**
 * Main entry point for the Solarium Web Portal (WEBPRT)
 * Initializes React 18 with routing, error handling, authentication, and loading states
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { store } from './store';
import { theme } from './theme';
import './index.css';
import './components/error/ErrorFallback.css';
import './routes/routing.css';
import './components/loading/loading.css';

// Initialize base query with Axios client
import { initializeBaseQuery } from './api/baseQuery';
import { axiosClient } from './services/http/axiosClient';

// Initialize the base query immediately
initializeBaseQuery(axiosClient);

// Start the app
const startApp = () => {
  console.log('🚀 Starting React application...');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </Provider>
    </React.StrictMode>
  );
};

// Initialize mock server in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode detected - initializing MSW...');

  import('./__mocks__/browser')
    .then(({ startMockServer }) => {
      console.log('📦 MSW module loaded, starting worker...');

      startMockServer()
        .then(() => {
          console.log('✅ MSW started successfully - starting app');
          startApp();
        })
        .catch(error => {
          console.error('❌ MSW startup failed:', error);
          console.log('🚀 Starting app without MSW...');
          startApp();
        });
    })
    .catch(error => {
      console.error('❌ Failed to load MSW module:', error);
      console.log('🚀 Starting app without MSW...');
      startApp();
    });
} else {
  console.log('🏭 Production mode - starting app without MSW');
  startApp();
}
