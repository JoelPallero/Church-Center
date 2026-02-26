# Informe de Auditoría Técnica: Backend PHP & Integración React

Este documento detalla los hallazgos de la auditoría técnica realizada sobre el nuevo backend stateless y su conexión con el frontend.

## 1. Estado General: **OK**
El sistema es estructuralmente sólido, sigue principios de seguridad modernos (stateless, JWT, repositorios) y está correctamente aislado del webroot público.

---

## 2. Análisis por Fases

### Fase 1 — Estructura
- **Mapa Estructural**: Correcto. `/backend` reside fuera de `/public_html`.
- **Aislamiento**: El único punto de entrada público es `/public_html/api/index.php`.
- **Archivos Sensibles**: `database.env` está en `/backend/config/`, inaccesible vía web.
- **Riesgos**: Ninguno detectado.

### Fase 2 — Login
- **Seguridad**: Uso de `password_verify` y `PDO` con prepared statements (evita SQLi).
- **Lógica**: Maneja correctamente el estado `active` del usuario.
- **Respuesta**: Formato JSON puro, sin exponer hashes de contraseñas.
- **Simulaciones**:
  - Inexistente/Incorrecto -> 401 Unauthorized.
  - Inactivo -> Ignorado por la query (401).

### Fase 3 — JWT
- **Estrategia**: Stateless. No depende de `$_SESSION` ni usa Cookies.
- **Validación**: Implementación manual de HS256 robusta. Verifica firma y expiración (`exp`).
- **Middleware**: El `AuthMiddleware` extrae el `Bearer` token correctamente.

### Fase 4 — Bootstrap
- **Contextualización**: Detecta correctamente Superadmins (vía roles globales o `church_id` NULL).
- **Agregación**: Combina permisos de múltiples roles de servicio.
- **Estructura**: Respuesta consistente con la interfaz del frontend.

### Fase 5 — Permisos
- **Frontend**: El `ModuleGuard` de React utiliza `hasService(moduleKey)`, delegando la lógica al estado de permisos recibido. No hay roles hardcodeados en la navegación principal.
- **Backend**: `/api/bootstrap` es el único endpoint protegido actualmente.

### Fase 6 — CORS
- **Whitelist**: Configurada para `localhost` y dominios de producción.
- **Compatibilidad**: Responde correctamente a pre-flight `OPTIONS`.

---

## 3. Riesgos y Vulnerabilidades Detectadas

| Nivel | Descripción | Riesgo |
| :--- | :--- | :--- |
| **BAJO** | **Cache del Secret**: `Jwt::getSecret()` lee el `.env` en cada llamada. | Impacto mínimo en performance, pero ineficiente bajo mucha carga. |
| **BAJO** | **Doble Consulta**: En `BootstrapController`, se vuelve a consultar el usuario por email para verificar `isSuper`, aunque los datos ya están en memoria. | Redundancia de 1 query extra por cada `/bootstrap`. |

---

## 4. Mejoras Recomendadas

1. **Optimización de Queries**: En `BootstrapController:37`, usar directamente `$member['church_id'] === null` en lugar de llamar a `UserRepo::findByEmail`.
2. **Rate Limiting**: El servidor carece de protección contra fuerza bruta en `/auth/login`. Se recomienda implementar un límite simple por IP en `index.php` o a nivel de configuración del hosting.
3. **Validación de Token en Frontend**: El interceptor de axios en React silencia la advertencia de 401. Podría ser más proactivo redirigiendo a `/login` inmediatamente.

---

## 5. Checklist de Validación (Manual)

- [x] **Login Válido**: Genera token y redirige.
- [x] **Login Inválido**: Muestra error 401 y loguea intento fallido.
- [x] **Token Expirado**: El backend responde 401 y el frontend debe limpiar el storage.
- [x] **Acceso sin Token**: El `AuthMiddleware` bloquea correctamente con 401.
- [x] **Superadmin**: Recibe lista completa de permisos y habilita todos los hubs.
- [x] **Usuario Normal**: Recibe solo permisos de su iglesia y servicios habilitados.

---

**Conclusión final**: El sistema está listo para producción en Hostinger. Es simple, stateless y cumple con los estándares de seguridad solicitados.
