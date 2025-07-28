
import React, { useState, useEffect } from "react";
import { useSettings } from "./SettingsContext.jsx";
import { useTranslation } from 'react-i18next';
import agentsData from '../ai-agents.json';


export default function AiAgentPanel() {
  const { t } = useTranslation();
  const { get } = useSettings();
  const aiEnabled = get('ext.osds.ai.enabled') !== '0';
  const selectedAgentId = get('ext.osds.selected_agent_id');
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agent, setAgent] = useState(null);

  useEffect(() => {
    if (selectedAgentId && Array.isArray(agentsData)) {
      setAgent(agentsData.find(a => a.id === selectedAgentId) || null);
    } else {
      setAgent(null);
    }
  }, [selectedAgentId]);

  if (!aiEnabled || !agent) return null;


  async function handleSend() {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      let result = "";
      const fullPrompt = (agent.prompt ? agent.prompt + "\n" : "") + input;
      if (agent.provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${agent.apiKey}`
          },
          body: JSON.stringify({
            model: agent.model,
            messages: [{ role: "user", content: fullPrompt }],
            temperature: parseFloat(agent.temp || '0.7'),
            max_tokens: parseInt(agent.maxTokens || '1024', 10)
          })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        result = data.choices?.[0]?.message?.content || "";
      } else if (agent.provider === "ollama" || (agent.endpoint && agent.endpoint.includes('ollama'))) {
        // Ollama API: POST /api/chat { model, messages: [{role, content}] }
        const endpoint = agent.endpoint || "http://localhost:11434/api/chat";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: agent.model,
            messages: [{ role: "user", content: fullPrompt }]
          })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        result = data.message?.content || data.response || JSON.stringify(data);
      } else if (agent.provider === "custom") {
        const endpoint = agent.endpoint;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(agent.apiKey ? { "Authorization": `Bearer ${agent.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: agent.model,
            prompt: fullPrompt
          })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        result = data.choices?.[0]?.text || data.result || JSON.stringify(data);
      }
      setResponse(result);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-agent-panel card p-3 mb-3" style={{ maxWidth: 600 }}>
      <h4>{t('aiAgent', 'AI Agent')}</h4>
      <textarea
        className="form-control mb-2"
        rows={3}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={t('askAi', 'Ask the AI agent anything...')}
        disabled={loading}
      />
      <button className="btn btn-primary mb-2" onClick={handleSend} disabled={loading || !input}>
        {loading ? t('loading', 'Loading...') : t('send', 'Send')}
      </button>
      {error && <div className="alert alert-danger mt-2">{error}</div>}
      {response && (
        <div className="alert alert-success mt-2" style={{ whiteSpace: 'pre-wrap' }}>{response}</div>
      )}
    </div>
  );
}
