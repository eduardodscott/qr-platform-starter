'use client';

import { useEffect, useRef, useState } from 'react';

type ChatMsg = { id: string; sender: string; text: string; createdAt: string };

export default function Client({ code }: { code: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).catch(() => {});
  }, [code]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/messages?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
        const data = await res.json();
        if (alive && Array.isArray(data.messages)) setMessages(data.messages);
      } catch {}
    };
    load();
    const id = setInterval(load, 2000);
    return () => { alive = false; clearInterval(id); };
  }, [code]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, sender: 'guest', text }),
      });
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="container stack">
      <h1>Envíale un mensaje al dueño</h1>
      <div className="chat">
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.sender === 'guest' ? 'me' : ''}`}>
            <div>{m.text}</div>
            <div className="meta">{new Date(m.createdAt).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="row">
        <input
          className="input"
          placeholder="Escribe tu mensaje…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn" onClick={send} disabled={sending}>
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </main>
  );
}
