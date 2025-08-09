'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Msg = { id: string; sender: string; text: string; createdAt: string };

async function fetchMessages(code: string) {
  const res = await fetch(`/api/messages?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
  const data = await res.json();
  return (data.messages || []) as Msg[];
}

export default function AdminByCodePage({ params }: { params: { code: string } }) {
  const code = params.code;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const msgs = await fetchMessages(code);
      if (alive) setMessages(msgs);
    };
    load();
    const id = setInterval(load, 2000);
    return () => { alive = false; clearInterval(id); };
  }, [code]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, sender: 'owner', text }),
      });
      setText('');
    } finally {
      setSending(false);
    }
  };

  const header = useMemo(() => `Conversación: ${code}`, [code]);

  return (
    <main className="container stack">
      <h1>Panel de Mensajes</h1>

      <div className="card stack" style={{ minHeight: 420 }}>
        <div><strong>{header}</strong></div>
        <div className="chat">
          {messages.map((m) => (
            <div key={m.id} className={`bubble ${m.sender === 'owner' ? 'me' : ''}`}>
              <div style={{ fontSize: 12, opacity: .6 }}>{m.sender}</div>
              <div>{m.text}</div>
              <div className="meta">{new Date(m.createdAt).toLocaleString()}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="row">
          <input
            className="input"
            placeholder="Escribe tu respuesta…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn" onClick={send} disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
    </main>
  );
}
