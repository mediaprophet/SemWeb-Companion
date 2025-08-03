
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Gun from 'gun';

// Simple Gun chat component for demo


export default function GunChat({ userId: propUserId }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState(propUserId || 'anon');
  const gun = useRef(null);
  const chatRoom = 'semweb-companion-global';

  // Try to get Chrome Identity user info on mount
  useEffect(() => {
    if (window.chrome && chrome.identity && chrome.identity.getProfileUserInfo) {
      chrome.identity.getProfileUserInfo((userInfo) => {
        if (userInfo && userInfo.email) {
          setUserId(userInfo.email);
        }
      });
    }
  }, []);

  useEffect(() => {
    gun.current = Gun(['https://gun.eco/gun', 'https://gunjs.herokuapp.com/gun']);
    const chat = gun.current.get(chatRoom);
    chat.map().on((msg, id) => {
      if (msg && msg.text && msg.user) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === id)) return prev;
          return [...prev, { ...msg, id }];
        });
      }
    });
    return () => gun.current && gun.current.off();
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const chat = gun.current.get(chatRoom);
    chat.set({
      text: input,
      user: userId || 'anon',
      ts: Date.now(),
    });
    setInput('');
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, maxWidth: 340 }}>
      <div style={{ height: 120, overflowY: 'auto', marginBottom: 8, background: '#fafafa', padding: 6 }}>
        {messages.sort((a, b) => a.ts - b.ts).map((msg) => (
          <div key={msg.id} style={{ marginBottom: 4 }}>
            <b>{msg.user}:</b> {msg.text}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
        placeholder={t('typeAMessage', 'Type a message...')}
        style={{ width: '75%', marginRight: 4 }}
      />
      <button className="btn btn-sm btn-primary" onClick={sendMessage}>{t('send', 'Send')}</button>
    </div>
  );
}
