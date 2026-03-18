import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppProviders } from './app/app-providers';
import './style.css';

const container = document.getElementById('app');

if (!container) {
  throw new Error('App root element was not found.');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
