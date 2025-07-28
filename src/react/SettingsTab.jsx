
import React, { useState } from 'react';
import { useSettings } from './SettingsContext.jsx';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import SolidLoginStatus from './login/SolidLoginStatus.jsx';
import SolidOidcLogin from './login/SolidOidcLogin.jsx';
import aiProviders from '../ai-providers.json';
import agentsData from '../ai-agents.json';
import { useEffect } from 'react';

export default function SettingsTab() {
	// Multi-agent state
	const [agents, setAgents] = useState([]);
	const [selectedAgentId, setSelectedAgentId] = useState('');
	const [agentEdit, setAgentEdit] = useState(null); // null or agent object being edited/created
	const [agentImagePreview, setAgentImagePreview] = useState('');

	// Load agents from JSON file on mount
	useEffect(() => {
		setAgents(Array.isArray(agentsData) ? agentsData : []);
		if (Array.isArray(agentsData) && agentsData.length > 0) {
			setSelectedAgentId(agentsData[0].id);
		}
	}, []);

	// Save agents to JSON file (local workaround, in real extension use storage API)
	const saveAgents = updatedAgents => {
		setAgents(updatedAgents);
		try {
			window.require('fs').writeFileSync(
				require('path').resolve(__dirname, '../ai-agents.json'),
				JSON.stringify(updatedAgents, null, 2)
			);
		} catch (e) {
			// fallback: do nothing, or use chrome.storage if available
		}
	};

	const handleSelectAgent = id => setSelectedAgentId(id);
	const handleDeleteAgent = id => {
		if (window.confirm('Delete this agent?')) {
			const updated = agents.filter(a => a.id !== id);
			saveAgents(updated);
			setSelectedAgentId(updated[0]?.id || '');
		}
	};
	const handleEditAgent = agent => {
		setAgentEdit({ ...agent });
		setAgentImagePreview(agent.image || '');
	};
	const handleNewAgent = () => {
		setAgentEdit({
			id: 'agent-' + Date.now(),
			name: '',
			image: '',
			provider: aiProviders[0]?.id || '',
			model: aiProviders[0]?.defaultModel || '',
			apiKey: '',
			temp: '0.7',
			maxTokens: '1024',
			prompt: '',
			promptList: '',
			promptInject: ''
		});
		setAgentImagePreview('');
	};
	const handleAgentImage = e => {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = evt => {
			setAgentImagePreview(evt.target.result);
			setAgentEdit(edit => ({ ...edit, image: evt.target.result }));
		};
		reader.readAsDataURL(file);
	};
	const handleAgentEditChange = (field, value) => {
		setAgentEdit(edit => ({ ...edit, [field]: value }));
	};
	const handleSaveAgent = () => {
		let updated;
		if (agents.some(a => a.id === agentEdit.id)) {
			updated = agents.map(a => a.id === agentEdit.id ? agentEdit : a);
		} else {
			updated = [...agents, agentEdit];
		}
		saveAgents(updated);
		setAgentEdit(null);
		setSelectedAgentId(agentEdit.id);
	};
	const handleCancelEdit = () => setAgentEdit(null);
	const { get, set } = useSettings();
	const { t } = useTranslation();

	// Language selection
	const languages = [
		{ code: 'en', label: 'English' },
		{ code: 'fr', label: 'Français' },
		{ code: 'de', label: 'Deutsch' },
		{ code: 'es', label: 'Español' },
		{ code: 'it', label: 'Italiano' },
		{ code: 'nl', label: 'Nederlands' },
		{ code: 'pt', label: 'Português' },
		{ code: 'zh', label: '中文' },
		{ code: 'ja', label: '日本語' },
		{ code: 'ar', label: 'العربية' },
		{ code: 'ko', label: '한국어' },
		{ code: 'fa', label: 'فارسی' },
		{ code: 'el', label: 'Ελληνικά' },
		{ code: 'hi', label: 'हिन्दी' },
		{ code: 'id', label: 'Bahasa Indonesia' },
		{ code: 'he', label: 'עברית' },
		{ code: 'no', label: 'Norsk' },
		{ code: 'la', label: 'Latin' },
		{ code: 'en-GB', label: 'English (UK)' },
		{ code: 'en-AU', label: 'English (AU)' },
	];
	const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
	const handleThemeChange = e => {
		setTheme(e.target.value);
		localStorage.setItem('theme', e.target.value);
		document.documentElement.setAttribute('data-theme', e.target.value);
	};

	// AI/LLM settings
	const [aiProvider, setAiProvider] = useState(get('ext.osds.ai.provider') || aiProviders[0]?.id || '');
	const [aiModel, setAiModel] = useState(get('ext.osds.ai.model') || (aiProviders.find(p => p.id === (get('ext.osds.ai.provider') || aiProviders[0]?.id))?.defaultModel || ''));
	const [apiKey, setApiKey] = useState(get('ext.osds.ai.key') || '');
	const [aiTemp, setAiTemp] = useState(get('ext.osds.ai.temp') || '0.7');
	const [aiMaxTokens, setAiMaxTokens] = useState(get('ext.osds.ai.max_tokens') || '1024');
	const [prompt, setPrompt] = useState(get('osds.chatgpt_prompt') || '');
	const [promptList, setPromptList] = useState(get('ext.osds.prompt-lst') || '');
	const [promptInject, setPromptInject] = useState(get('ext.osds.def_prompt_inject') || '');
	const [aiEnabled, setAiEnabled] = useState(get('ext.osds.ai.enabled') !== '0');

	const handleAiProviderChange = e => {
		setAiProvider(e.target.value);
		set('ext.osds.ai.provider', e.target.value);
		const provider = aiProviders.find(p => p.id === e.target.value);
		setAiModel(provider?.defaultModel || '');
		set('ext.osds.ai.model', provider?.defaultModel || '');
	};
	const handleAiModelChange = e => {
		setAiModel(e.target.value);
		set('ext.osds.ai.model', e.target.value);
	};
	const handleAiEnabledChange = e => {
		setAiEnabled(e.target.checked);
		set('ext.osds.ai.enabled', e.target.checked ? '1' : '0');
	};

	React.useEffect(() => { set('ext.osds.ai.key', apiKey); }, [apiKey]);
	React.useEffect(() => { set('ext.osds.ai.temp', aiTemp); }, [aiTemp]);
	React.useEffect(() => { set('ext.osds.ai.max_tokens', aiMaxTokens); }, [aiMaxTokens]);
	React.useEffect(() => { set('osds.chatgpt_prompt', prompt); }, [prompt]);
	React.useEffect(() => { set('ext.osds.prompt-lst', promptList); }, [promptList]);
	React.useEffect(() => { set('ext.osds.def_prompt_inject', promptInject); }, [promptInject]);

	// CORS proxy settings
	const corsProxyList = (() => {
		try {
			return JSON.parse(get('ext.osds.corsproxy.list') || '["https://corsproxy.io/?","https://api.allorigins.win/raw?url="]');
		} catch { return ["https://corsproxy.io/?","https://api.allorigins.win/raw?url="]; }
	})();
	const corsProxyUrl = get('ext.osds.corsproxy.url') || corsProxyList[0];
	const [newProxy, setNewProxy] = useState('');

	// Extractor toggles
	const extractors = [
		{ key: 'jsonld', label: 'JSON-LD' },
		{ key: 'microdata', label: 'Microdata' },
		{ key: 'rdfa', label: 'RDFa' },
		{ key: 'opengraph', label: 'OpenGraph' },
		{ key: 'twitter', label: 'Twitter Cards' },
		{ key: 'posh', label: 'POSH' },
		{ key: 'turtle', label: 'Turtle/N3' },
	];
	const extractorState = key => get(`ext.osds.extractor.${key}`) !== '0';

	// Bookmark management
	const handleExportBookmarks = () => {
		const data = localStorage.getItem('semanticBookmarks') || '[]';
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'semanticBookmarks.json';
		a.click();
		URL.revokeObjectURL(url);
	};
	const handleImportBookmarks = e => {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = evt => {
			try {
				const imported = JSON.parse(evt.target.result);
				localStorage.setItem('semanticBookmarks', JSON.stringify(imported));
				alert('Bookmarks imported!');
			} catch {
				alert('Invalid bookmarks file.');
			}
		};
		reader.readAsText(file);
	};
	const handleClearBookmarks = () => {
		localStorage.removeItem('semanticBookmarks');
		alert('Bookmarks cleared!');
	};

	// Privacy
	const handleClearLocalStorage = () => {
		if (window.confirm('Clear all local storage?')) {
			localStorage.clear();
			alert('Local storage cleared!');
		}
	};

	// Advanced
	const [debug, setDebug] = useState(get('ext.osds.debug') === '1');
	const [perfStats, setPerfStats] = useState(get('ext.osds.perfStats') === '1');
	const handleDebugToggle = e => {
		setDebug(e.target.checked);
		set('ext.osds.debug', e.target.checked ? '1' : '0');
	};
	const handlePerfStatsToggle = e => {
		setPerfStats(e.target.checked);
		set('ext.osds.perfStats', e.target.checked ? '1' : '0');
	};

	// Reset
	const handleReset = () => {
		if (window.confirm('Revert all settings to defaults?')) {
			localStorage.clear();
			window.location.reload();
		}
	};

	// AboutTab (optional)
		let AboutTab = null;
		try {
			AboutTab = require('./AboutTab.jsx').default;
		} catch {}
	
		return (
			<div className="container-fluid p-3">
	
				{/* Multi-AI Agent Management */}
				<div className="mb-3">
					<label className="form-label">{t('aiAgents', 'AI Agents')}:</label>
					<div className="d-flex flex-wrap gap-2 mb-2">
						{agents.map(agent => (
							<div key={agent.id} className={`card p-2 ${selectedAgentId === agent.id ? 'border-primary' : ''}`} style={{ minWidth: 180, maxWidth: 220 }}>
								<div className="d-flex align-items-center mb-1">
									{agent.image && <img src={agent.image} alt="agent" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', marginRight: 8 }} />}
									<span className="fw-bold flex-grow-1">{agent.name || t('unnamed', 'Unnamed')}</span>
									<button className="btn btn-sm btn-outline-secondary ms-1" onClick={() => handleEditAgent(agent)} title={t('edit', 'Edit')}>&#9998;</button>
									<button className="btn btn-sm btn-outline-danger ms-1" onClick={() => handleDeleteAgent(agent.id)} title={t('delete', 'Delete')}>&#128465;</button>
								</div>
								<div className="small text-muted mb-1">{agent.provider} / {agent.model}</div>
								<button className="btn btn-sm btn-outline-primary w-100" onClick={() => handleSelectAgent(agent.id)} disabled={selectedAgentId === agent.id}>{selectedAgentId === agent.id ? t('active', 'Active') : t('select', 'Select')}</button>
							</div>
						))}
						<button className="btn btn-outline-success align-self-start" onClick={handleNewAgent}>{t('addAgent', 'Add Agent')}</button>
					</div>
					{agentEdit && (
						<div className="card p-3 mb-2">
							<h5>{agents.some(a => a.id === agentEdit.id) ? t('editAgent', 'Edit Agent') : t('newAgent', 'New Agent')}</h5>
							<div className="mb-2">
								<label className="form-label">{t('agentName', 'Name')}:</label>
								<input className="form-control form-control-sm" value={agentEdit.name} onChange={e => handleAgentEditChange('name', e.target.value)} />
							</div>
							<div className="mb-2">
								<label className="form-label">{t('agentImage', 'Image')}:</label>
								<input type="file" accept="image/*" className="form-control form-control-sm" onChange={handleAgentImage} />
								{agentImagePreview && <img src={agentImagePreview} alt="preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '50%', marginTop: 4 }} />}
							</div>
							<div className="mb-2">
								<label className="form-label">{t('aiProvider', 'Provider')}:</label>
								<select className="form-select form-select-sm" value={agentEdit.provider} onChange={e => handleAgentEditChange('provider', e.target.value)}>
									{aiProviders.map(p => (
										<option key={p.id} value={p.id}>{p.name}</option>
									))}
								</select>
							</div>
							<div className="mb-2">
								<label className="form-label">{t('aiModel', 'Model')}:</label>
								<select className="form-select form-select-sm" value={agentEdit.model} onChange={e => handleAgentEditChange('model', e.target.value)}>
									{(aiProviders.find(p => p.id === agentEdit.provider)?.models || []).map(m => (
										<option key={m.id} value={m.id}>{m.name}</option>
									))}
								</select>
							</div>
							<div className="mb-2">
								<label className="form-label">API Key:</label>
								<input type="password" className="form-control form-control-sm" value={agentEdit.apiKey} onChange={e => handleAgentEditChange('apiKey', e.target.value)} />
							</div>
							<div className="mb-2">
								<label className="form-label">Temperature:</label>
								<input type="number" step="0.01" min="0" max="2" className="form-control form-control-sm" value={agentEdit.temp} onChange={e => handleAgentEditChange('temp', e.target.value)} />
							</div>
							<div className="mb-2">
								<label className="form-label">Max Tokens:</label>
								<input type="number" className="form-control form-control-sm" value={agentEdit.maxTokens} onChange={e => handleAgentEditChange('maxTokens', e.target.value)} />
							</div>
							<div className="mb-2">
								<label className="form-label">{t('prompt', 'Prompt')}:</label>
								<textarea className="form-control form-control-sm" value={agentEdit.prompt} onChange={e => handleAgentEditChange('prompt', e.target.value)} />
							</div>
							<div className="mb-2">
								<label className="form-label">{t('promptList', 'Prompt List')}:</label>
								<textarea className="form-control form-control-sm" value={agentEdit.promptList} onChange={e => handleAgentEditChange('promptList', e.target.value)} />
							</div>
							<div className="mb-2">
								<label className="form-label">{t('promptInject', 'Prompt Injection')}:</label>
								<input className="form-control form-control-sm" value={agentEdit.promptInject} onChange={e => handleAgentEditChange('promptInject', e.target.value)} />
							</div>
							<div className="d-flex gap-2">
								<button className="btn btn-success btn-sm" onClick={handleSaveAgent}>{t('save', 'Save')}</button>
								<button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>{t('cancel', 'Cancel')}</button>
							</div>
						</div>
					)}
				</div>
	
				{/* Solid Pod connection */}
				<div className="mb-3">
					<SolidLoginStatus />
					<SolidOidcLogin />
				</div>
	
				{/* CORS proxy config */}
				<div className="mb-3">
					<label className="form-label">{t('selectProxy', 'Select Proxy:')}</label>
					<select className="form-select form-select-sm mb-2" style={{ maxWidth: 400 }} value={corsProxyUrl} onChange={e => set('ext.osds.corsproxy.url', e.target.value)}>
						{corsProxyList.map((url, i) => <option key={i} value={url}>{url}</option>)}
					</select>
					<div className="input-group mb-2" style={{ maxWidth: 400 }}>
						<input type="text" className="form-control form-control-sm" placeholder={t('addNewProxyUrl', 'Add new proxy URL (use {url} or append to end)')} value={newProxy} onChange={e => setNewProxy(e.target.value)} />
						<button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => {
							if (newProxy && !corsProxyList.includes(newProxy)) {
								set('ext.osds.corsproxy.list', JSON.stringify([...corsProxyList, newProxy]));
								set('ext.osds.corsproxy.url', newProxy);
								setNewProxy('');
							}
						}}>{t('addProxy', 'Add Proxy')}</button>
					</div>
					<div className="form-text">{t('proxyExamples', 'Examples: https://corsproxy.io/?{url} or https://api.allorigins.win/raw?url={url}')}</div>
				</div>
	
				{/* Data extraction options */}
				<div className="mb-3">
					<label className="form-label">{t('extractors', 'Data Extractors')}:</label>
					<div>
						{extractors.map(ex => (
							<label key={ex.key} className="form-check form-check-inline">
								<input
									className="form-check-input"
									type="checkbox"
									checked={extractorState(ex.key)}
									onChange={e => set(`ext.osds.extractor.${ex.key}`, e.target.checked ? '1' : '0')}
								/>
								{ex.label}
							</label>
						))}
					</div>
				</div>
	
				{/* Bookmark management */}
				<div className="mb-3">
					<label className="form-label">{t('bookmarks', 'Bookmarks')}:</label>
					<div>
						<button className="btn btn-outline-primary btn-sm me-2" onClick={handleExportBookmarks}>{t('exportBookmarks', 'Export')}</button>
						<label className="btn btn-outline-secondary btn-sm me-2">
							{t('importBookmarks', 'Import')}
							<input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportBookmarks} />
						</label>
						<button className="btn btn-outline-danger btn-sm" onClick={handleClearBookmarks}>{t('clearBookmarks', 'Clear')}</button>
					</div>
				</div>
	
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
		</div>
	);
}
