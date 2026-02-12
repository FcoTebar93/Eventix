# 🎟️ Ticket Marketplace - Fullstack Portfolio Project

Plataforma de compraventa de entradas tipo Ticketmaster/StubHub.

## Stack Tecnológico

### Backend
- Node.js + TypeScript
- Express
- PostgreSQL + Prisma (solo como cliente TypeScript)
- Redis
- RabbitMQ
- JWT Auth

### Frontend
- Next.js + TypeScript
- React Query
- Zustand
- Tailwind CSS

## ⚠️ Nota Importante sobre Prisma

Este proyecto utiliza **Prisma solo como cliente TypeScript** debido a un bug conocido de autenticación en Windows. Las migraciones se ejecutan manualmente usando SQL. Ver [backend/prisma/README.md](./backend/prisma/README.md) para más detalles.

## Inicio Rápido

### 1. Levantar infraestructura
```bash
docker-compose up -d
```

### 2. Configurar Backend
Ver [backend/README.md](./backend/README.md) para instrucciones detalladas.

### 3. Configurar Frontend
Ver `frontend/README.md` (próximamente).
