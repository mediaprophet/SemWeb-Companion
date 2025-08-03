
import React, { useState } from 'react';
import AiAgentsSection from './apps/Settings/sections/AiAgentsSection.jsx';
import CorsProxySection from './apps/Settings/sections/CorsProxySection.jsx';
import BookmarksSection from './apps/Settings/sections/BookmarksSection.jsx';
import ExtractorsSection from './apps/Settings/sections/ExtractorsSection.jsx';
import { Tabs, Tab } from 'react-bootstrap';
import { useSettings } from './SettingsContext.jsx';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import SolidLoginStatus from './login/SolidLoginStatus.jsx';
import SolidOidcLogin from './login/SolidOidcLogin.jsx';
import aiProviders from '../ai-providers.json';
import agentsData from '../ai-agents.json';
import { useEffect } from 'react';
// ...existing code...
function SettingsTab(props) {
	// Reset to Defaults handler (stub)
	import { useSettings } from './SettingsContext.jsx';
	// ...existing code...
	function handleReset() {
		const { reset } = useSettings();
		reset();
		alert('Settings have been reset to defaults.');
	}
	// AboutTab fallback (not yet modularized)
	const AboutTab = null;
	// --- Advanced Options State ---
	const [debug, setDebug] = useState(false);
	const [perfStats, setPerfStats] = useState(false);

	function handleDebugToggle() {
		setDebug(prev => !prev);
	}
	function handlePerfStatsToggle() {
		setPerfStats(prev => !prev);
	}
	// --- Data Privacy ---
	function handleClearLocalStorage() {
		localStorage.clear();
		alert('Local storage cleared.');
	}
	// Stubs for bookmark management
	function handleExportBookmarks() {
		alert('Export Bookmarks clicked (stub)');
	}
	function handleImportBookmarks() {
		alert('Import Bookmarks clicked (stub)');
	}
	function handleClearBookmarks() {
		alert('Clear Bookmarks clicked (stub)');
	}
	// --- Data Extractor Options ---
	const extractors = [
		{ key: 'microdata', label: 'Microdata' },
		{ key: 'jsonld', label: 'JSON-LD' },
		{ key: 'rdfa', label: 'RDFa' },
		{ key: 'opengraph', label: 'OpenGraph' },
		{ key: 'twitter', label: 'Twitter Cards' },
		{ key: 'schemaorg', label: 'Schema.org' },
	];
	const [enabledExtractors, setEnabledExtractors] = useState(() =>
		Object.fromEntries(extractors.map(ex => [ex.key, true]))
	);
	// --- Multi-AI Agent Management State ---
	const [agents, setAgents] = useState([]);
	const [selectedAgentId, setSelectedAgentId] = useState(null);
	// ...existing state and handlers...
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState('settings');
	const [agentEdit, setAgentEdit] = useState(null);
	// --- CORS Proxy Configuration ---
	const defaultProxies = [
		'https://corsproxy.io/?{url}',
		'https://api.allorigins.win/raw?url={url}'
	];
	const [corsProxyList, setCorsProxyListRaw] = useState(defaultProxies);
	const [corsProxyUrl, setCorsProxyUrl] = useState(defaultProxies[0]);

	// Always keep corsProxyList as an array of strings
	function setCorsProxyList(list) {
		const normalized = Array.isArray(list)
			? list.map(p => typeof p === 'string' ? p : (p && typeof p.url === 'string' ? p.url : ''))
			: [];
		setCorsProxyListRaw(normalized);
		// Ensure selected proxy is valid
		if (!normalized.includes(corsProxyUrl)) {
			setCorsProxyUrl(normalized[0] || '');
		}
	}

	// On mount, normalize if needed
	React.useEffect(() => {
		setCorsProxyList(corsProxyList);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ...existing state, handlers, and logic should be here...

		return (
			<div className="container-fluid p-3">
				<Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
					<Tab eventKey="settings" title="Settings">
						{/* --- Begin enhanced settings UI --- */}
						{/* Multi-AI Agent Management (modular) */}
						<AiAgentsSection
							agents={agents}
							setAgents={setAgents}
							selectedAgentId={selectedAgentId}
							setSelectedAgentId={setSelectedAgentId}
						/>

						{/* Solid Pod connection */}
						<div className="mb-3">
							<SolidLoginStatus />
							<SolidOidcLogin />
						</div>

						{/* Theme & Appearance */}
						<div className="mb-3 p-3 border rounded bg-light-subtle">
							<h6 className="fw-bold mb-2">Theme & Appearance</h6>
							<div className="mb-2">
								<label className="form-label me-2">Theme:</label>
								<select className="form-select form-select-sm d-inline-block" style={{ width: 120 }} disabled>
									<option>Light</option>
									<option>Dark</option>
								</select>
								<span className="ms-2 text-muted">(coming soon)</span>
							</div>
							<div>
								<label className="form-label me-2">Font Size:</label>
								<select className="form-select form-select-sm d-inline-block" style={{ width: 80 }} disabled>
									<option>Small</option>
									<option>Medium</option>
									<option>Large</option>
								</select>
								<span className="ms-2 text-muted">(coming soon)</span>
							</div>
						</div>

						{/* Accessibility */}
						<div className="mb-3 p-3 border rounded bg-light-subtle">
							<h6 className="fw-bold mb-2">Accessibility</h6>
							<div className="form-check mb-1">
								<input className="form-check-input" type="checkbox" id="keyboardNav" disabled />
								<label className="form-check-label" htmlFor="keyboardNav">Enable keyboard navigation <span className="text-muted">(coming soon)</span></label>
							</div>
							<div className="form-check">
								<input className="form-check-input" type="checkbox" id="screenReader" disabled />
								<label className="form-check-label" htmlFor="screenReader">Screen reader support <span className="text-muted">(coming soon)</span></label>
							</div>
						</div>

						{/* User Profile */}
						<div className="mb-3 p-3 border rounded bg-light-subtle">
							<h6 className="fw-bold mb-2">User Profile</h6>
							<div className="mb-2">
								<label className="form-label me-2">Name:</label>
								<input className="form-control form-control-sm d-inline-block" style={{ width: 200 }} placeholder="Your name" disabled />
								<span className="ms-2 text-muted">(coming soon)</span>
							</div>
							<div>
								<label className="form-label me-2">Avatar:</label>
								<input className="form-control form-control-sm d-inline-block" style={{ width: 200 }} placeholder="Avatar URL" disabled />
								<span className="ms-2 text-muted">(coming soon)</span>
							</div>
						</div>

						{/* CORS proxy config (modular) */}
						<CorsProxySection
							corsProxyList={corsProxyList}
							setCorsProxyList={setCorsProxyList}
							corsProxyUrl={corsProxyUrl}
							setCorsProxyUrl={setCorsProxyUrl}
						/>

						{/* Data extraction options (modular) */}
						<ExtractorsSection
							extractors={extractors}
							enabledExtractors={enabledExtractors}
							setEnabledExtractors={setEnabledExtractors}
						/>

						{/* Bookmark management (modular) */}
						<BookmarksSection
							handleExportBookmarks={handleExportBookmarks}
							handleImportBookmarks={handleImportBookmarks}
							handleClearBookmarks={handleClearBookmarks}
							t={t}
						/>

						{/* Data privacy */}
						<div className="mb-3">
							<label className="form-label">{t('privacy', 'Data Privacy')}:</label>
							<button className="btn btn-outline-danger btn-sm ms-2" onClick={handleClearLocalStorage}>{t('clearLocalStorage', 'Clear Local Storage')}</button>
						</div>

						{/* Advanced options */}
						<div className="mb-3">
							<label className="form-label">{t('advanced', 'Advanced')}:</label>
							<div>
								<label className="form-check form-check-inline">
									<input className="form-check-input" type="checkbox" checked={debug} onChange={handleDebugToggle} />
									{t('debugMode', 'Debug Mode')}
								</label>
								<label className="form-check form-check-inline">
									<input className="form-check-input" type="checkbox" checked={perfStats} onChange={handlePerfStatsToggle} />
									{t('perfStats', 'Show Performance Stats')}
								</label>
							</div>
						</div>

						{/* About/version info */}
						<div className="mb-3">
							{AboutTab ? <AboutTab /> : <div>{t('about', 'About')}<br />{t('version', 'Version')} 0.0.0</div>}
						</div>

						{/* Reset to defaults */}
						<div className="mb-3">
							<button className="btn btn-warning" onClick={handleReset}>{t('revertToDefaults', 'Revert to Defaults')}</button>
						</div>
						{/* --- End enhanced settings UI --- */}
					</Tab>
				<Tab eventKey="sparql" title="SPARQL Query Service">
					<div className="p-3">SPARQL Query Service settings and UI coming soon.</div>
				</Tab>
				<Tab eventKey="superlinks" title="Super Links">
					<div className="p-3">Super Links settings and UI coming soon.</div>
				</Tab>
				<Tab eventKey="llmchat" title="LLM Chat">
					<div className="p-3">LLM Chat settings and UI coming soon.</div>
				</Tab>
				<Tab eventKey="about" title="About">
					<div className="p-3">
						{AboutTab ? <AboutTab /> : <div>{t('about', 'About')}<br />{t('version', 'Version')} 0.0.0</div>}
					</div>
				</Tab>
			</Tabs>
		</div>
	);
}

export default SettingsTab;

