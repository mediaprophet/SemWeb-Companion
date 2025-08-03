import 'bootstrap/dist/css/bootstrap.min.css';
import './osds-animations.css';
import './sidebar-dark.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import SidePanel from './SidePanel.jsx';
import SolidAuthProvider from './solid/SolidAuthProvider.jsx';
import { SettingsProvider } from './SettingsContext.jsx';
import './i18n.js';

const root = createRoot(document.getElementById('sidebar-root'));
root.render(
  <SettingsProvider>
    <SolidAuthProvider>
      <SidePanel />
    </SolidAuthProvider>
  </SettingsProvider>
);
