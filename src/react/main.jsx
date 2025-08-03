// Global error handler for debugging
window.addEventListener('error', function(event) {
	console.error('[Global Error]', event.message, 'at', event.filename + ':' + event.lineno + ':' + event.colno, event.error);
});
window.addEventListener('unhandledrejection', function(event) {
	console.error('[Unhandled Promise Rejection]', event.reason);
});
console.log('[DEBUG] main.jsx loaded at', new Date().toISOString());



import 'bootstrap/dist/css/bootstrap.min.css';
import { createRoot } from 'react-dom/client';
import './i18n.js';
import { SettingsProvider } from './SettingsContext.jsx';
import Popup from './Popup.jsx';
import SolidAuthProvider from './solid/SolidAuthProvider.jsx';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
	<SettingsProvider>
		<SolidAuthProvider>
			<Popup />
		</SolidAuthProvider>
	</SettingsProvider>
);
