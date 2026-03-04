# Documentación Técnica - Release Beta/Alfa (MinistryHub)

Esta documentación está dirigida a desarrolladores y colaboradores técnicos que se integran con el producto MinistryHub (MSM2).

## Registro de Versiones (Changelog)

### v0.9.5 (Marzo 2026) - Actual
**Mejoras en el Editor de Canciones y UI de Escritorio**
- **Funcionalidades**:
    - Implementación de modo de **Notación Romana** en el preview de canciones.
    - Mejora en la lógica de transposición y controles de tamaño de fuente.
    - Traducción de títulos de secciones en el editor (Chorus, Verse, etc.).
    - Ajuste de pesos de fuente (font-weight: 400) para una estética más limpia.
- **Correcciones**:
    - Eliminación de saltos de línea extra al insertar tags de sección.
    - Alineación horizontal de botones de vista en el dashboard.

### v0.9.4 (Febrero 2026)
**Seguridad y Optimización de Build**
- **Seguridad**: Integración de **Google reCAPTCHA v3** (invisible) en el flujo de login.
- **Rendimiento**: Configuración de `manualChunks` en Vite/Rollup para separar dependencias de terceros y mejorar el tiempo de carga.
- **UI/UX**: Auditoría completa para paridad entre móvil y escritorio utilizando diseños de **Stitch**.

### v0.9.3 (Febrero 2026)
**Gestión Global de Áreas**
- **Funcionalidad**: Nuevo módulo de gestión de áreas independiente para usuarios con rol "Master" (Superadmin).
- **Backend**: Implementación de controladores y repositorios específicos para el CRUD de áreas.

## Integración Técnica
- **API**: Las peticiones deben incluir el header `Authorization: Bearer <TOKEN>`.
- **Formato de Datos**: La API se comunica exclusivamente en JSON.
- **Frontend**: El proyecto utiliza React 19 y React Router 7. Los estilos son Vanilla CSS con un sistema robusto de variables para branding contextual.
