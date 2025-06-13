/**
 * Main entry point for the Solarium Web Portal (WEBPRT)
 * Initializes React 18 with routing, error handling, authentication, and loading states
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './components/error/ErrorFallback.css';
import './routes/routing.css';
import './components/loading/loading.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
