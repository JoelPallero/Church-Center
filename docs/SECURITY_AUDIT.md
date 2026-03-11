# Auditoría de Seguridad - Church Center (v1.0)

Este documento detalla los hallazgos de la auditoría de seguridad preventiva realizada al sistema, analizando tanto el frontend (React) como el backend (PHP).

## 1. Autenticación y Gestión de Sesiones

### Hallazgos Positivos
- **Password Hashing**: Se utiliza `password_hash` con `PASSWORD_DEFAULT` (Bcrypt), que es el estándar actual y seguro.
- **JWT**: Se implementa un sistema de tokens JWT con firma HMAC-SHA256.
- **Invitaciones**: Los tokens de invitación se almacenan hasheados (`sha256`), lo que evita que un leak de la base de datos permita descubrir tokens válidos.

### Vulnerabilidades Detectadas / Áreas de Mejora
- **JWT Secret**: El archivo `Jwt.php` utiliza un secreto por defecto (`default_secret`) si la variable de entorno no está configurada. Esto es un riesgo crítico de configuración.
- **Ataque de Sincronización (Timing Attack)**: La validación de la firma JWT en `Jwt.php` utiliza el operador `!==`. Se recomienda usar `hash_equals()` para prevenir ataques de timing que podrían permitir deducir la firma.
- **Google OAuth**: No se implementa el parámetro `state` en el flujo de Google Auth, lo que deja el sistema vulnerable a ataques de Cross-Site Request Forgery (CSRF) durante el login social.

## 2. Autorización y Control de Acceso (IDOR)

### Hallazgos Positivos
- **Permission Matrix**: Existe una matriz de permisos centralizada que sincroniza frontend y backend.
- **Middleware de Permisos**: Se valida el permiso específico antes de ejecutar acciones en los controladores.

### Vulnerabilidades Detectadas / Áreas de Mejora
- **IDOR (Insecure Direct Object Reference)**: Se detectaron rincones ambiguos en controladores como `SongController` y `PlaylistController`. Si bien se valida que el usuario tenga el permiso (ej. `song.update`), no siempre se valida que el recurso (X canción) pertenezca a la iglesia del usuario.
  - *Ejemplo*: Un líder de la Iglesia A podría, en teoría, editar una canción de la Iglesia B si conoce su ID numérico.
  - *Recomendación*: Cada consulta de actualización/borrado debe incluir una cláusula `AND church_id = ?` o validar la propiedad del objeto antes de proceder.

## 3. Sanitización de Datos y Prevención de Inyecciones

### Hallazgos Positivos
- **SQL Injection**: Casi todas las consultas utilizan sentencias preparadas (PDO), lo cual es la mejor defensa contra inyecciones SQL.

### Áreas de Mejora
- **Sanitización de Salida**: Si bien React protege contra XSS por defecto, se recomienda asegurar que los campos de texto enriquecido (si los hubiera) sean procesados con una librería de limpieza en el servidor.

## 4. Prevención de Spam y Hacking (reCAPTCHA)

### Análisis
- El sistema tiene integrado **Google reCAPTCHA v3**.
- **Punto Crítico**: En `AuthController.php`, si la petición a la API de Google falla o tarda más de 3 segundos, el sistema permite el login por defecto (`return true`). Esto es una decisión de UX que abre una ventana a ataques controlados de denegación de servicio a la verificación.

## 5. Recomendaciones Generales

1.  **Rate Limiting**: El servidor no parece tener límites de intentos de login o peticiones por minuto. Se recomienda implementar un limitador por IP o usuario.
2.  **HTTPS Forcing**: Asegurar que todas las cookies tengan los flags `Secure` y `HttpOnly`. El servidor central de API debe forzar redirección a HTTPS.
3.  **Logs de Actividad**: El sistema ya loguea acciones críticas, lo cual es excelente para auditorías forenses posteriores.

---
**Resultado del Auditor**: El sistema tiene bases sólidas pero requiere ajustes en la validación cruzada de propiedad de objetos (Church ID match) para ser considerado totalmente seguro en un entorno multi-tenant.
