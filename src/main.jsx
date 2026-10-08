import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { IconContext } from './lib/icons.jsx';
import './app.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Lucide's defaults, which the app's sizing and a11y were built on:
        24px unless a size class overrides it, and decorative to screen readers. */}
    <IconContext.Provider value={{ size: 24, 'aria-hidden': true }}>
      <App />
    </IconContext.Provider>
  </React.StrictMode>
);
