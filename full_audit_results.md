# Auditoría Técnica Detallada - MSM2
**Fecha:** 2026-02-21
**Estado:** Hallazgos Críticos Identificados

## 1. Errores Críticos (Blockers)

### 1.1 Inconsistencia en Base de Datos (UserRepo)
- **Archivo:** `backend/src/Repositories/UserRepo.php`
- **Error:** La consulta en `findByEmail` (Línea 17) busca `u.status = 'active'`.
- **Hallazgo:** Según el esquema SQL (`User SQL/vieja.sql`), la tabla `user_accounts` no tiene columna `status`, sino `is_active` (TINYINT). La columna `status` pertenece a la tabla `member`.
- **Impacto:** El login fallará siempre con un error de SQL (columna no encontrada).

### 1.2 Desajuste de Contrato Bootstrap (Front vs Back)
- **Archivo:** `backend/src/Controllers/BootstrapController.php` vs `frontend/src/context/AuthContext.tsx`.
- **Error:** El backend devuelve la respuesta plana en la raíz del JSON. El frontend espera que los datos estén dentro de una llave `data`.
- **Detalle:** `AuthContext.tsx:56` hace `if (response.success && response.data)`. Si el backend envía `{success: true, user: ...}`, `response.data` será objeto raíz y `response.data.data` será `undefined`.
- **Impacto:** La aplicación se queda en estado de carga infinito o falla al hidratar el usuario.

### 1.3 Permisos Inexistentes
- **Archivo:** `backend/src/Controllers/PeopleController.php`.
- **Error:** Se requiere el permiso `users.invite` y `users.approve`.
- **Hallazgo:** Estos permisos no existen en las semillas del SQL (`permissions` table). Solo existen `church.read`, `area.create`, etc.
- **Impacto:** Ningún usuario (ni siquiera el superadmin) podrá ejecutar estas acciones ya que el `PermissionMiddleware` fallará al no encontrar el permiso asignado.

## 2. Errores de Conexión y Ruteo

### 2.1 Ruteo de Auth Incompleto
- **Archivo:** `public_html/api/index.php`.
- **Error:** Solo el endpoint `/auth/login` está mapeado.
- **Hallazgo:** El frontend (`authService.ts`) intenta llamar a `/auth/register` y `/auth/update_settings`.
- **Impacto:** Errores 404 constantes al intentar registrarse o cambiar configuraciones.

### 2.2 IDs de Servicios Hardcodeados
- **Archivo:** `backend/src/Controllers/BootstrapController.php` (Líneas 30-33).
- **Error:** Usa `service_id == 1` y `service_id == 2`.
- **Hallazgo:** Según el SQL, los IDs dependen del orden de inserción. Si `church_center` es 1, `ministry_hub` es 2 y `sm_hub` es 3, la lógica de detección de features fallará o estará desplazada.

## 3. Observaciones de Calidad y Debug

- **JWT Secret**: Se lee el archivo `.env` en cada validación de token. Recomendable cachear o usar una constante global en el bootstrap.
- **Stubs**: `PlaylistController`, `InstrumentController`, `NotificationController` son cascarones vacíos. Devuelven `success: true` pero con arreglos vacíos de forma hardcodeada.
- **Impersonate**: El frontend tiene lógica de impersonación que solo funciona en `localhost`, pero no hay un endpoint en el backend que soporte esto de forma segura.

## 4. Próximos Pasos Recomendados

1. Corregir `UserRepo.php` para usar `is_active = 1`.
2. Unificar el nombre de roles (master vs superadmin).
3. Envolver la respuesta de `BootstrapController` en una llave `data` o ajustar el frontend.
4. Agregar los permisos faltantes (`users.*`) al script SQL.
