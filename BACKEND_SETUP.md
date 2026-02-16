# Guía de Instalación Profesional (Hostinger Shared Hosting)

Esta estructura separa la lógica del código de la carpeta pública para máxima seguridad.

## 1. Estructura en el Servidor

Debés organizar tus archivos así en el Administrador de Archivos de Hostinger:

```text
/ (Raíz de tu cuenta, ARRIBA de public_html)
└── msm_logic/               <-- Subí aquí la carpeta 'src' y 'config' de 'backend/'
    ├── config/
    │   ├── Database.php
    │   └── database.env     <-- Ya configurado con tus claves
    └── src/
        ├── Auth.php
        ├── SongManager.php
        └── MusicTheory.php

public_html/                 <-- Carpeta pública (la que ve el mundo)
├── index.html               <-- Tu build de React (npm run build -> dist/)
├── assets/                  <-- Carpeta assets del build
├── .htaccess                <-- IMPORTANTE: Ver abajo (React Router)
└── api/                    
    ├── auth.php
    └── songs.php
```

## 2. Archivo .htaccess para public_html

Crea un archivo `.htaccess` en tu `public_html` con este contenido para que React y la API funcionen juntos:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Si la petición es para la carpeta API, no hacer nada (dejar que PHP responda)
  RewriteRule ^api/ - [L]

  # Redireccionar todo lo demás a index.html (React Router)
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 3. Base de Datos
1. Creá la base de datos MySQL en Hostinger (si ya la tenés, asegurate que coincida con `database.env`).
2. Importá `backend/database_schema_unified.sql` desde phpMyAdmin.
3. El usuario administrador por defecto es `admin@system.master` con la clave `Master2024!`.

## 4. Desarrollo Local (Bypass)
En `msm_logic/src/Auth.php` he dejado `$bypassLogin = true` para que puedas probar todo sin que te pida contraseña constantemente durante el desarrollo.
