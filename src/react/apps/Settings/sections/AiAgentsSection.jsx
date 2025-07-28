
import React, { useState } from 'react';
import aiProviders from '../../../data/aiProviders.js';

export default function AiAgentsSection({ agents, setAgents, selectedAgentId, setSelectedAgentId }) {
  const [agentEdit, setAgentEdit] = useState(null);
  const [agentImagePreview, setAgentImagePreview] = useState(null);

  function handleNewAgent() {
    setAgentEdit({
      id: Date.now().toString(),
      name: '',
      image: '',
      provider: aiProviders[0]?.id || '',
      model: aiProviders[0]?.models[0]?.id || '',
      apiKey: '',
      temp: 1,
      maxTokens: 2048,
      prompt: '',
      promptList: '',
      promptInject: ''
    });
    setAgentImagePreview(null);
  }

  function handleEditAgent(agent) {
    setAgentEdit({ ...agent });
    setAgentImagePreview(agent.image || null);
  }

  function handleDeleteAgent(id) {
    setAgents(agents.filter(a => a.id !== id));
    if (selectedAgentId === id) setSelectedAgentId(agents[0]?.id || null);
    if (agentEdit && agentEdit.id === id) setAgentEdit(null);
  }

  function handleSelectAgent(id) {
    setSelectedAgentId(id);
  }

  function handleAgentEditChange(field, value) {
    setAgentEdit({ ...agentEdit, [field]: value });
  }

  function handleAgentImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setAgentImagePreview(ev.target.result);
      setAgentEdit({ ...agentEdit, image: ev.target.result });
    };
    reader.readAsDataURL(file);
  }

  function handleSaveAgent() {
    if (!agentEdit) return;
    setAgents(prev => {
      const exists = prev.some(a => a.id === agentEdit.id);
      if (exists) {
        return prev.map(a => a.id === agentEdit.id ? { ...agentEdit } : a);
      } else {
        return [...prev, { ...agentEdit }];
      }
    });
    setAgentEdit(null);
    setAgentImagePreview(null);
  }

  function handleCancelEdit() {
    setAgentEdit(null);
    setAgentImagePreview(null);
  }

  return (
    <div className="mb-3">
      <label className="form-label">AI Agents:</label>
      <div className="d-flex flex-wrap gap-2 mb-2">
        {agents.map(agent => (
          <div key={agent.id} className={`card p-2 ${selectedAgentId === agent.id ? 'border-primary' : ''}`} style={{ minWidth: 180, maxWidth: 220 }}>
            <div className="d-flex align-items-center mb-1">
              {agent.image && <img src={agent.image} alt="agent" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', marginRight: 8 }} />}
              <span className="fw-bold flex-grow-1">{agent.name || 'Unnamed'}</span>
              <button className="btn btn-sm btn-outline-secondary ms-1" onClick={() => handleEditAgent(agent)} title="Edit">&#9998;</button>
              <button className="btn btn-sm btn-outline-danger ms-1" onClick={() => handleDeleteAgent(agent.id)} title="Delete">&#128465;</button>
            </div>
            <div className="small text-muted mb-1">{agent.provider} / {agent.model}</div>
            <button className="btn btn-sm btn-outline-primary w-100" onClick={() => handleSelectAgent(agent.id)} disabled={selectedAgentId === agent.id}>{selectedAgentId === agent.id ? 'Active' : 'Select'}</button>
          </div>
        ))}
        <button className="btn btn-outline-success align-self-start" onClick={handleNewAgent}>Add Agent</button>
      </div>
      {agentEdit && (
        <div className="card p-3 mb-2">
          <h5>{agents.some(a => a.id === agentEdit.id) ? 'Edit Agent' : 'New Agent'}</h5>
          <div className="mb-2">
            <label className="form-label">Name:</label>
            <input className="form-control form-control-sm" value={agentEdit.name} onChange={e => handleAgentEditChange('name', e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="form-label">Image:</label>
            <input type="file" accept="image/*" className="form-control form-control-sm" onChange={handleAgentImage} />
            {agentImagePreview && <img src={agentImagePreview} alt="preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '50%', marginTop: 4 }} />}
          </div>
          <div className="mb-2">
            <label className="form-label">Provider:</label>
            <select className="form-select form-select-sm" value={agentEdit.provider} onChange={e => handleAgentEditChange('provider', e.target.value)}>
              {aiProviders.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label">Model:</label>
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
            <label className="form-label">Prompt:</label>
            <textarea className="form-control form-control-sm" value={agentEdit.prompt} onChange={e => handleAgentEditChange('prompt', e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="form-label">Prompt List:</label>
            <textarea className="form-control form-control-sm" value={agentEdit.promptList} onChange={e => handleAgentEditChange('promptList', e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="form-label">Prompt Injection:</label>
            <input className="form-control form-control-sm" value={agentEdit.promptInject} onChange={e => handleAgentEditChange('promptInject', e.target.value)} />
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-success btn-sm" onClick={handleSaveAgent}>Save</button>
            <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
