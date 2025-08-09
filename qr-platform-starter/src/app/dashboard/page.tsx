'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type Row = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  messagesCount: number;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  lastMessageSender: string | null;
};

export default function DashboardPage() {
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Preview en página
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/conversations', { cache: 'no-store' });
      const data = await res.json();
      setList((data.conversations || []) as Row[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const createConv = async () => {
    if (!newCode.trim()) return;
    setCreating(true);
    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode.trim(), name: newName.trim() || undefined }),
      });
      setNewCode('');
      setNewName('');
      await refresh();
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    if (!editingCode) return;
    await fetch('/api/conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: editingCode, name: editName }),
    });
    setEditingCode(null);
    setEditName('');
    await refresh();
  };

  const remove = async (code: string) => {
    if (!confirm(`¿Eliminar QR "${code}" y su historial?`)) return;
    await fetch('/api/conversations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    await refresh();
    if (previewCode === code) {
      setPreviewCode(null);
      setPreviewUrl('');
      setPreviewDataUrl('');
    }
  };

  const genQrFor = async (code: string) => {
    const origin = window.location.origin;
    const url = `${origin}/qr/${encodeURIComponent(code)}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 1 });
    setPreviewCode(code);
    setPreviewUrl(url);
    setPreviewDataUrl(dataUrl);
  };

  const downloadQR = async (code: string) => {
    const origin = window.location.origin;
    const url = `${origin}/qr/${encodeURIComponent(code)}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 1 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr-${code}.png`;
    a.click();
  };

  return (
    <main className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, padding: 24 }}>
      {/* Columna izquierda: crear y lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1>Dashboard de QRs</h1>

        {/* Crear nuevo */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600 }}>Crear nuevo QR</div>
          <input
            className="input"
            placeholder="Código (único). Ej: CANCHA-1-9AM"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
          />
          <input
            className="input"
            placeholder="Nombre visible (opcional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={createConv} disabled={creating || !newCode.trim()}>
              {creating ? 'Creando…' : 'Crear QR'}
            </button>
            <button className="btn" onClick={() => { setNewCode(''); setNewName(''); }}>
              Limpiar
            </button>
            <button
              className="btn"
              onClick={() => newCode.trim() && genQrFor(newCode.trim())}
              disabled={!newCode.trim()}
              title="Ver QR en el panel"
            >
              Ver QR
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600 }}>Mis QRs</div>
          {loading ? (
            <div>Cargando…</div>
          ) : list.length === 0 ? (
            <div>No hay QRs aún.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ borderBottom: '1px solid #eee', padding: 8 }}>Código</th>
                    <th style={{ borderBottom: '1px solid #eee', padding: 8 }}>Nombre</th>
                    <th style={{ borderBottom: '1px solid #eee', padding: 8 }}>Mensajes</th>
                    <th style={{ borderBottom: '1px solid #eee', padding: 8 }}>Último</th>
                    <th style={{ borderBottom: '1px solid #eee', padding: 8 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row.id}>
                      <td style={{ borderBottom: '1px solid #f2f2f2', padding: 8 }}><code>{row.code}</code></td>
                      <td style={{ borderBottom: '1px solid #f2f2f2', padding: 8 }}>
                        {editingCode === row.code ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              className="input"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nuevo nombre"
                            />
                            <button className="btn" onClick={saveEdit}>Guardar</button>
                            <button className="btn" onClick={() => { setEditingCode(null); setEditName(''); }}>Cancelar</button>
                          </div>
                        ) : (
                          <span onDoubleClick={() => { setEditingCode(row.code); setEditName(row.name || ''); }}>
                            {row.name || <span style={{ opacity: .6 }}>—</span>}
                          </span>
                        )}
                      </td>
                      <td style={{ borderBottom: '1px solid #f2f2f2', padding: 8 }}>{row.messagesCount}</td>
                      <td style={{ borderBottom: '1px solid #f2f2f2', padding: 8 }}>
                        {row.lastMessageAt ? new Date(row.lastMessageAt).toLocaleString() : '—'}
                      </td>
                      <td style={{ borderBottom: '1px solid #f2f2f2', padding: 8 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn" onClick={() => genQrFor(row.code)}>Ver QR</button>
                          <a className="btn" href={`/qr/${encodeURIComponent(row.code)}`} target="_blank">Abrir móvil</a>
                          <a className="btn" href={`/admin/${encodeURIComponent(row.code)}`} target="_blank">Abrir chat</a>
                          <button className="btn" onClick={() => downloadQR(row.code)}>Descargar PNG</button>
                          <button className="btn" onClick={() => { setEditingCode(row.code); setEditName(row.name || ''); }}>Renombrar</button>
                          <button className="btn" onClick={() => remove(row.code)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Columna derecha: panel de preview */}
      <aside className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 24, height: 'fit-content' }}>
        <div style={{ fontWeight: 600 }}>Preview QR</div>
        {previewCode ? (
          <>
            <div><strong>Código:</strong> {previewCode}</div>
            <div style={{ display: 'grid', placeItems: 'center', padding: 8 }}>
              <img src={previewDataUrl} alt={`QR ${previewCode}`} width={320} height={320} />
            </div>
            <div style={{ wordBreak: 'break-all' }}>
              <strong>URL:</strong> {previewUrl}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a className="btn" href={previewUrl} target="_blank">Abrir vista móvil</a>
              <button className="btn" onClick={() => downloadQR(previewCode)}>Descargar PNG</button>
              <button className="btn" onClick={() => { setPreviewCode(null); setPreviewUrl(''); setPreviewDataUrl(''); }}>Limpiar</button>
            </div>
          </>
        ) : (
          <div style={{ opacity: .7 }}>Selecciona “Ver QR” en la lista o usa el botón “Ver QR” al crear.</div>
        )}
      </aside>
    </main>
  );
}
