# 🎟️ Ticket Marketplace - Backend

Backend API para la plataforma de compraventa de entradas.

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia `.env.example` a `.env` y configura las variables necesarias:

```env
DATABASE_URL=postgresql://ticketuser:ticketpass@127.0.0.1:5433/ticketmarketplace?schema=public
```

### 3. Levantar Infraestructura

Desde la raíz del proyecto:

```bash
docker-compose up -d
```

### 4. Configurar Base de Datos

**⚠️ Importante:** Este proyecto usa Prisma solo como cliente TypeScript debido a un bug conocido en Windows. Ver [prisma/README.md](./prisma/README.md) para más detalles.

```bash
# Ejecutar migración inicial
Get-Content prisma/init.sql | docker exec -i ticket-marketplace-postgres psql -U ticketuser -d ticketmarketplace

# Generar cliente de Prisma
npm run prisma:generate
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## 📁 Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma    # Schema de Prisma
│   ├── init.sql         # SQL para migración inicial
│   └── README.md        # Documentación sobre migraciones
├── src/
│   ├── config/          # Configuración
│   ├── lib/             # Librerías (Prisma, Redis, RabbitMQ)
│   ├── middleware/      # Middleware de Express
│   ├── routes/          # Rutas de la API
│   ├── controllers/     # Controladores
│   ├── services/        # Lógica de negocio
│   └── index.ts         # Punto de entrada
├── .env                 # Variables de entorno
└── package.json
```

## 🛠️ Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo con hot-reload
- `npm run build` - Compilar TypeScript a JavaScript
- `npm run start` - Ejecutar versión compilada
- `npm run prisma:generate` - Generar cliente de Prisma
- `npm run prisma:studio` - Abrir Prisma Studio (GUI para BD)
- `npm run lint` - Ejecutar ESLint
- `npm test` - Ejecutar tests

## 🔧 Tecnologías

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **Prisma** - ORM (solo como cliente TypeScript)
- **PostgreSQL** - Base de datos
- **Redis** - Cache y rate limiting
- **RabbitMQ** - Mensajería asíncrona
- **JWT** - Autenticación
- **Zod** - Validación de schemas

## 📝 Notas Importantes

### Base de Datos

- Las migraciones se ejecutan manualmente usando SQL (ver `prisma/README.md`)
- Prisma se usa solo como cliente TypeScript para type-safety
- El schema está en `prisma/schema.prisma`

### Puerto de PostgreSQL

El proyecto usa el puerto **5433** en lugar del estándar 5432 porque el 5432 está ocupado por otro proyecto. Esto se configura en `docker-compose.yml`.

## 🔗 Enlaces Útiles

- [Documentación de Prisma](./prisma/README.md)
- [API Documentation](./docs/api.md) (próximamente)
