# Prisma Setup - Database Migrations

## ⚠️ Decisión Técnica: Prisma como Cliente TypeScript

Este proyecto utiliza **Prisma solo como cliente TypeScript** para type-safety y queries tipadas, pero **NO** para migraciones automáticas debido a un problema conocido de autenticación en Windows.

## 🐛 Problema Encontrado

### Error de Autenticación con Prisma Migrate

Al intentar ejecutar `prisma migrate dev` o `prisma db push`, Prisma falla con el siguiente error:

```
Error: P1000: Authentication failed against database server at `127.0.0.1`, 
the provided database credentials for `(not available)` are not valid.
```

### Causa Raíz

Este es un **bug conocido de Prisma** en Windows cuando:
- Se usa PostgreSQL en Docker
- La URL de conexión contiene credenciales en el formato estándar
- Prisma no puede parsear correctamente las credenciales de la URL

**Evidencia:**
- ✅ La conexión directa con `psql` funciona correctamente
- ✅ Node.js puede parsear la URL correctamente (`url.parse()`)
- ✅ El cliente de Prisma puede conectarse una vez que las tablas existen
- ❌ Los comandos de migración (`migrate`, `db push`) fallan sistemáticamente

### Soluciones Intentadas (Sin Éxito)

1. ✅ Cambiar formato de URL (`postgresql://` vs `postgres://`)
2. ✅ Usar `127.0.0.1` vs `localhost`
3. ✅ Quitar/agregar parámetros de query (`?schema=public`)
4. ✅ Variables de entorno directas vs archivo `.env`
5. ✅ Diferentes formatos de encoding del archivo `.env`
6. ✅ Recrear contenedor de PostgreSQL desde cero
7. ✅ Cambiar método de autenticación PostgreSQL (`trust`, `scram-sha-256`)

**Ninguna de estas soluciones resolvió el problema.**

## ✅ Solución Implementada

### Workaround: Migraciones Manuales con SQL

1. **Generar SQL desde el Schema:**
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
   ```

2. **Ejecutar SQL directamente en PostgreSQL:**
   ```bash
   Get-Content prisma/init.sql | docker exec -i ticket-marketplace-postgres psql -U ticketuser -d ticketmarketplace
   ```

3. **Generar Cliente de Prisma:**
   ```bash
   npx prisma generate
   ```

### Ventajas de Este Enfoque

✅ **Type Safety:** Mantenemos todos los beneficios de Prisma como cliente TypeScript
✅ **Control Total:** Control explícito sobre las migraciones SQL
✅ **Debugging:** Más fácil de debuggear problemas de migración
✅ **Portabilidad:** El SQL generado es portable y versionable
✅ **Funcionalidad Completa:** El cliente de Prisma funciona perfectamente para queries

### Desventajas

❌ **Migraciones Manuales:** No podemos usar `prisma migrate` automáticamente
❌ **Sincronización:** Debemos mantener el schema.prisma y el SQL sincronizados manualmente

## 📁 Archivos Importantes

- **`schema.prisma`**: Schema de Prisma (fuente de verdad)
- **`init.sql`**: SQL generado para crear las tablas iniciales
- **`.env`**: Variables de entorno con `DATABASE_URL`

## 🔄 Flujo de Trabajo para Cambios en el Schema

1. **Modificar `schema.prisma`** con los cambios deseados
2. **Generar nuevo SQL:**
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migration_new.sql
   ```
3. **Revisar el SQL generado** y ajustar si es necesario
4. **Ejecutar el SQL** en la base de datos
5. **Regenerar el cliente:**
   ```bash
   npx prisma generate
   ```

## 📚 Referencias

- [Prisma Issue #8925](https://github.com/prisma/prisma/discussions/8925)
- [Prisma Troubleshooting - PostgreSQL](https://www.prisma.io/docs/postgres/troubleshooting)
- [Prisma Migrate Diff](https://www.prisma.io/docs/orm/prisma-migrate/workflows/developing-with-prisma-migrate/migrate-diff)

## 🎯 Conclusión

Esta decisión técnica es un **workaround temporal** para un bug conocido de Prisma en Windows. Una vez que el bug sea resuelto en futuras versiones de Prisma, podremos migrar de vuelta a usar `prisma migrate` automáticamente.

Mientras tanto, este enfoque nos permite:
- ✅ Continuar desarrollando con type-safety completo
- ✅ Mantener control sobre las migraciones
- ✅ Usar todas las funcionalidades del cliente de Prisma
