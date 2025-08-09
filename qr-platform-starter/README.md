# QR Platform Starter (App Router)

Chat simple entre **invitado** (quien escanea el QR) y **dueño** (admin).

## Requisitos
- Node 18+
- PostgreSQL (o un proveedor como Neon o Supabase)
- Definir `DATABASE_URL`

## Configuración rápida

```bash
npm install
# crea .env.local
# DATABASE_URL=postgresql://usuario:password@host:5432/qrdb
# NEXTAUTH_SECRET=changeme_32_chars_min
# NEXTAUTH_URL=http://localhost:3000

npx prisma generate
npx prisma db push
npm run dev
```

Rutas de prueba:
- Invitado (QR): http://localhost:3000/qr/TEST123
- Admin: http://localhost:3000/admin
