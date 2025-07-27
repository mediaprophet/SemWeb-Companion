


import { createRoot } from 'react-dom/client';
import './i18n.js';
import { SettingsProvider } from './SettingsContext.jsx';
import App from './App.jsx';

const container = document.getElementById('react-root');
const root = createRoot(container);
root.render(
	<SettingsProvider>
		<App />
	</SettingsProvider>
);
