export default function Home() {
  return (
    <main className="container stack">
      <h1>QR Platform Starter</h1>
      <div className="card stack">
        <p>Usa:</p>
        <ul>
          <li><code>/qr/TEST123</code> para el invitado (quien escanea el QR)</li>
          <li><code>/admin</code> para tu panel</li>
        </ul>
      </div>
    </main>
  );
}
