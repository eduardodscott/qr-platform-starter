import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Platform Starter',
  description: 'Chat simple entre invitado (QR) y dueño (admin).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
