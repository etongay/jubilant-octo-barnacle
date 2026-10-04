import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// TEST ONLY — deliberately broken import to prove the required build check blocks merging. Do not merge. (re-run after ruleset fix)
import './this-file-does-not-exist.js';
import './app.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
