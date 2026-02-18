# MinistryHub: Guía de Setup Profesional

Esta estructura está diseñada para ser escalable, segura y fácil de desplegar tanto en entornos locales (Docker) como en servidores de producción (Hostinger/VPS).

## 1. Estructura del Proyecto

- **/frontend**: Aplicación React + Vite (SPA).
- **/backend**: Núcleo del sistema (PHP).
    - **/api**: Puntos de entrada públicos (Controladores).
    - **/src**: Lógica de negocio, modelos y seguridad (Protegido).
    - **docker-compose.yml**: Configuración de contenedores.
    - **.docker/**: Dockerfiles y VHosts.

---

## 2. Desarrollo Local con Docker 🐳

Para levantar el entorno de desarrollo local sin instalar PHP o MySQL en tu máquina:

1.  Asegúrate de tener **Docker Desktop** instalado.
2.  Navega a la carpeta `/backend`:
    ```bash
    cd backend
    ```
3.  Levanta los servicios:
    ```bash
    docker-compose up -d
    ```
4.  **Servicios disponibles**:
    - **Frontend**: [http://localhost:5173](http://localhost:5173) (Docker mapea a Vite).
    - **Backend/API**: [http://localhost:8080](http://localhost:8080) (Mapeado a Apache).
    - **Base de Datos**: `localhost:3388` (MySQL 8.0).

---

## 3. Configuración de Base de Datos

### Nueva Instalación (Desde Cero)
Importa el archivo `backend/database_schema_master.sql` en tu base de datos.
- **Usuario Admin**: `admin@system.master`
- **Password**: `Master2024!`

### Actualización (Para datos existentes)
Si ya tienes datos y quieres migrar a la arquitectura Multi-Hub, ejecuta:
- `backend/multi_hub_saas_update.sql`

---

## 4. Despliegue en Hostinger (Shared Hosting) 🚀

Para máxima seguridad, se recomienda separar la lógica de la carpeta pública:

1.  Crea una carpeta `msm_backend` en la raíz de tu cuenta (FUERA de `public_html`).
2.  Sube el contenido de `backend/src` y `backend/config` allí.
3.  En `public_html`, crea una carpeta `api` y sube los archivos de `backend/api/`.
4.  **Importante**: Ajusta las rutas del `bootstrap.php` en los archivos de `/api` para que apunten a la nueva carpeta externa.

### .htaccess Sugerido para public_html
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # API
  RewriteRule ^api/ - [L]

  # React Router
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 5. Variables de Entorno

El sistema usa archivos `.env` (o variables de Docker) para la conexión:
- **Frontend**: `frontend/.env` define `VITE_API_URL`.
- **Backend**: Configure `backend/src/config/Database.php` o use las variables definidas en `docker-compose.yml`.
