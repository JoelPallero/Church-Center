# Reporte Técnico: Flujo de Invitación y Manejo de Tokens

Este documento detalla el ciclo de vida de una invitación, desde que un administrador la genera hasta que el invitado activa su cuenta.

## 1. Generación de la Invitación (Admin)

**Ruta API:** `POST /api/people/invite`
**Controlador:** `PeopleController::invite`

### Lógica de Negocio:
1. El administrador ingresa `email`, `name`, `roleId` y `churchId`.
2. Se genera un `invite_token` único y aleatorio.
3. Se calcula un `token_expires_at` (actualmente 48 horas).
4. **Persistencia:** Se guarda en la tabla `member` (MySQL).

```php
// PeopleController.php
$token = bin2hex(random_bytes(32)); 
$expiresAt = date('Y-m-d H:i:s', strtotime('+48 hours'));

// Repositorio guarda en DB:
// INSERT INTO member (email, name, invite_token, token_expires_at, status) 
// VALUES (?, ?, ?, ?, 'pending')
```

## 2. Envío del Correo

**Helper:** `MailHelper::sendInvitation`
**Template:** `src/templates/invitation.html`

Se construye el link usando el protocolo y host detectados (o configurados):
`https://musicservicemanager.net/accept-invite?token=ABCDEF123456...`

---

## 3. Acceso del Invitado (Frontend)

**Página:** `AcceptInvite.tsx`
**Ruta React:** `/accept-invite`

Cuando el usuario hace clic en el enlace del mail:
1. El navegador carga el `index.html`.
2. **React Router** detecta `/accept-invite`.
3. El componente `AcceptInvite.tsx` extrae el token de la URL:
   `const token = searchParams.get('token');`

---

## 4. Verificación del Token (El Punto Crítico)

Para mostrar el nombre de la iglesia y del invitado, el frontend debe verificar el token contra el servidor.

**Acción:** `fetch('/api/auth/verify-invite?token=...')`

### Flujo en Servidor:
1. **.htaccess:** Redirige la petición a `api/index.php`.
2. **index.php (Router):** 
   - Detecta `resource = 'auth'`.
   - Detecta `action = 'verify-invite'`.
   
   > [!WARNING]
   > Si el router solo tiene el caso para **login**, la ejecución sigue de largo y llega al **AuthMiddleware**.
   > Como el invitado NO tiene sesión (no tiene token JWT), el middleware lo rechaza con **401 Unauthorized**.

### Resolución Correcta y Persistente:
Los archivos críticos de ruteo deben editarse en la carpeta de **fuente** para que no se pierdan al reconstruir el frontend.

**Archivos Originales:**
- `frontend/public/api/index.php`
- `frontend/public/.htaccess`

**Comando de Aplicación:**
`npm run build` (Esto despliega los cambios a `public_html`).

---

## 5. Activación de Cuenta

**Acción:** `POST /api/auth/accept-invite`
**Controlador:** `AuthController::acceptInvitation`

1. El usuario ingresa su nueva contraseña.
2. El servidor busca el `invite_token` en `member`.
   - Se aplica `hash('sha256', $rawToken)` para comparar con la DB.
3. Si es válido y no expiró:
   - Crea un registro en `user_accounts` con el hash de la clave.
   - Setea `member.status = 'active'`.
   - Limpia `invite_token = NULL` y `token_expires_at = NULL`.
4. El sistema loguea automáticamente al usuario y le entrega un **JWT (Access Token)**.

---

## Checklist de Errores Final (Post-Refactor)

| Error | Causa Probable | Solución |
| :--- | :--- | :--- |
| **404 Not Found** | El router en `public_html` fue sobreescrito por un build nuevo. | Asegurar que `frontend/public/api/index.php` tiene las rutas de invitación. |
| **401 Unauthorized** | Petición bloqueada por el Middleware. | El recurso `auth` debe evaluarse ANTES del AuthMiddleware en `index.php`. |
| **Token missing** | El servidor Apache descarta la query string. | Asegurar que `.htaccess` tenga la bandera `[QSA]` activa. |
| **Hash Mismatch** | El token en DB no coincide con el link. | Verificar que el link use el token crudo y el Repo use `hash('sha256', ...)`. |

---
**Nota Final:** La arquitectura ahora es robusta ante builds de React y protege los tokens mediante hashing irreversible en la base de datos.
