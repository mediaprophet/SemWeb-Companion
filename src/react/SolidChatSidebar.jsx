
import { useRef, useState, useEffect } from "react";
import { useSolidAuth } from './solid/SolidAuthProvider.jsx';
import { useTranslation } from 'react-i18next';

// Utility: Parse Turtle chat file into message objects (very basic RDF parser for MVP)
function parseTurtleMessages(turtle, webId) {
  // Each message is a blank node with aChatMessage, created, text, sender
  const msgRegex = /\[\]\s+a\s+<[^>]+ChatMessage>\s*;\s*<[^>]+created>\s+"([^"]+)"\^\^<[^>]+>\s*;\s*<[^>]+text>\s+"([^"]*)"\s*;\s*<[^>]+sender>\s+<([^>]+)>/g;
  const messages = [];
  let match;
  while ((match = msgRegex.exec(turtle))) {
    messages.push({
      created: match[1],
      text: match[2],
      sender: match[3],
      isMe: match[3] === webId
    });
  }
  // Sort by created date
  return messages.sort((a, b) => new Date(a.created) - new Date(b.created));
}

export default function SolidChatSidebar() {
  const { t } = useTranslation();
  const { webId, isLoggedIn } = useSolidAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const chatBoxRef = useRef(null);

  // For MVP, use a fixed chat container URL in the user's pod
  const chatContainer = webId ? webId.replace(/\/profile\/card(#me)?$/, "/public/solid-chat/") : null;
  const chatFile = chatContainer ? chatContainer + "chat.ttl" : null;

  // Fetch chat messages and participants
  useEffect(() => {
    if (!isLoggedIn || !chatFile) return;
    setLoading(true);
    setError(null);
    fetch(chatFile, { headers: { Accept: "text/turtle" } })
      .then(res => res.ok ? res.text() : Promise.reject(res.statusText))
      .then(text => {
        const msgs = parseTurtleMessages(text, webId);
        setMessages(msgs);
        // Extract unique participants
        setParticipants([...new Set(msgs.map(m => m.sender))]);
      })
      .catch(e => setError("Could not load chat: " + e))
      .finally(() => setLoading(false));
  }, [isLoggedIn, chatFile, webId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Send a message (append to chat file)
  const sendMessage = async () => {
    if (!input.trim() || !chatFile) return;
    setLoading(true);
    setError(null);
    const now = new Date().toISOString();
    const msg = `\n[] a <http://www.w3.org/ns/solid/terms#ChatMessage> ;\n   <http://purl.org/dc/terms/created> "${now}"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;\n   <http://schema.org/text> "${input.replace(/"/g, '\\"')}" ;\n   <http://schema.org/sender> <${webId}> .`;
    try {
      await fetch(chatFile, {
        method: "PATCH",
        headers: { "Content-Type": "application/sparql-update" },
        body: `INSERT DATA { ${msg} }`
      });
      setInput("");
      // Reload messages
      const res = await fetch(chatFile, { headers: { Accept: "text/turtle" } });
      const text = await res.text();
      const msgs = parseTurtleMessages(text, webId);
      setMessages(msgs);
      setParticipants([...new Set(msgs.map(m => m.sender))]);
    } catch (e) {
      setError("Could not send message: " + e);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 8, marginBottom: 12, background: "#f9f9f9", minWidth: 260 }}>
      <div className="fw-bold mb-2">{t('solidChat', 'Solid Chat')}</div>
      <div className="mb-2 small text-muted">{t('participants', 'Participants')}: {participants.map((p, i) => <span key={p}>{i > 0 && ', '}{p === webId ? t('you', 'You') : p}</span>)}</div>
      {loading && <div className="text-muted">{t('loading', 'Loading...')}</div>}
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          <strong>{t('error', 'Error:')}</strong> {error}
          <button className="btn btn-link btn-sm ms-2" onClick={() => window.location.reload()}>{t('retry', 'Retry')}</button>
        </div>
      )}
      <div ref={chatBoxRef} style={{ maxHeight: 120, overflowY: "auto", fontSize: 13, background: "#fff", border: "1px solid #eee", borderRadius: 4, marginBottom: 6, padding: 4 }}>
        {messages.length === 0 && <div className="text-muted">{t('noMessagesYet', 'No messages yet.')}</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 2, textAlign: m.isMe ? 'right' : 'left' }}>
            <span style={{ fontWeight: m.isMe ? 600 : 400, color: m.isMe ? '#007bff' : '#333' }}>{m.isMe ? t('you', 'You') : m.sender}</span>
            <span style={{ marginLeft: 6, color: '#888', fontSize: 11 }}>{new Date(m.created).toLocaleTimeString()}</span>
            <div style={{ display: 'inline-block', background: m.isMe ? '#e6f0ff' : '#f1f1f1', borderRadius: 4, padding: '2px 8px', marginTop: 2, maxWidth: 180, wordBreak: 'break-word' }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="d-flex gap-1">
        <input
          className="form-control form-control-sm"
          style={{ flex: 1 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('typeAMessage', 'Type a message...')}
          onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
          disabled={loading}
        />
        <button className="btn btn-primary btn-sm" type="button" onClick={sendMessage} disabled={loading || !input.trim()}>
          {t('send', 'Send')}
        </button>
      </div>
    </div>
  );
}
