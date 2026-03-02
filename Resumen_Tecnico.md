# Resumen Técnico de la Aplicación (MinistryHub)

## Arquitectura del Proyecto
El sistema sigue una arquitectura de desacoplamiento entre el núcleo administrativo y la interfaz de usuario, optimizada para despliegues en entornos de hosting tradicionales.

- **Fase de Desarrollo**: Vite + TypeScript + React.
- **Estructura de Despliegue**: Se separa la lógica privada (`backend/`) de los recursos públicos (`public_html/`).

---

## Tecnologías Utilizadas

### Frontend (Interfaz de Usuario)
- **Core**: React 19 (última versión estable).
- **Bundler**: Vite (para un desarrollo extremadamente ágil y optimización de build).
- **Lenguaje**: TypeScript (tipado estricto para mayor robustez).
- **Enrutado**: React Router 7 (navegación fluida y manejo de rutas protegidas).
- **Estilos**: **Vanilla CSS con Variables CSS** (sistema de diseño personalizado con soporte nativo para **Dark Mode** y animaciones suaves).
- **Comunicación**: Axios (gestión de peticiones HTTP al backend).
- **Visualización de Datos**: Recharts (gráficos y estadísticas).
- **Gestión de Música**: ChordSheetJS (motor para procesar y renderizar acordes en formato ChordPro).
- **Internacionalización**: i18next con **sistema de claves JSON** (para evitar textos en "duro" en el código y facilitar traducciones masivas).

### Backend (Lógica de Servidor)
- **Lenguaje**: PHP (Estructura personalizada orientada a objetos).
- **Manejador de Dependencias**: Autoloader manual basado en PSR-4 (dentro de `bootstrap.php`).
- **Seguridad**: JWT (JSON Web Tokens) para autenticación sin estado y segura.
- **Estructura de Código**: Patrón **Controller-Repository**, separando la lógica de las rutas de la lógica de acceso a datos.
- **Middlewares**: Implementación de filtros para protección de rutas y validación de roles de usuario.
- **Gestión de Sesiones**: Stateless (vía JWT) para escalabilidad.

### Base de Datos
- **Motor**: MySQL.
- **Acceso a Datos**: PDO (PHP Data Objects) para prevención de inyecciones SQL y portabilidad.
- **Estructura**:
    - Esquema de Usuarios/Miembros (Gestión de roles y login).
    - Esquema de Música (Canciones, acordes, setlists).
    - Logs de Actividad (Auditoríade acciones).
    - Notificaciones y Calendario (Persistencia de eventos).

---

## Infraestructura y DevOps
- **Docker**: Soporte para contenedores en el entorno de desarrollo local.
- **IA & Diseño**: Integración con **Stitch MCP** y **Gemini CLI** para acelerar flujos de diseño UI/UX y generación de código frontend.
- **Gestión de Versiones**: Git.
- **Estrategia de Despliegue**: Build de frontend inyectado en la carpeta pública, con el backend residiendo en un nivel superior inaccesible desde la web por seguridad.
- **Variables de Entorno**: Configuración centralizada vía archivos `.env` dentro de la carpeta privada de backend.

## Resumen de Integración
El frontend consume una API REST modular construida totalmente en PHP "vanilla" profesionalizado, lo que permite un rendimiento óptimo sin la sobrecarga de frameworks pesados, manteniendo al mismo tiempo una experiencia de usuario moderna y dinámica propia de una Single Page Application (SPA).
