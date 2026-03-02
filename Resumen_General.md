# Resumen General de la Aplicación (MinistryHub)

## ¿Qué es MinistryHub?
MinistryHub (MSM2 / Church-Center) es una plataforma integral, modular y de múltiples inquilinos (multi-tenant) diseñada para la gestión profesional de iglesias y congregaciones. Permite administrar múltiples sedes o ministerios desde una única cuenta, ofreciendo herramientas específicas para la organización de servicios, gestión de personas, música y administración técnica.

## Capacidades Principales

### 1. Gestión de Iglesia y Multi-inquilino
- **Seleccionador de Iglesias**: Permite a los usuarios cambiar entre diferentes congregaciones si tienen permisos.
- **Flujo de Configuración (Wizard)**: Proceso paso a paso para dar de alta nuevas iglesias, áreas, equipos y líderes.
- **Control de Acceso (RBAC)**: Roles diferenciados por iglesia (Admin, Miembro), incluyendo un rol de **"Master"** con acceso global para supervisión total.
- **Branding Contextual**: El sistema adapta el logo y nombre (Ministry Hub, SM Hub, Church Center) automáticamente según el rol del usuario y la ruta.

### 2. Módulo de Alabanza (Worship)
- **Biblioteca de Canciones**: Soporte completo para formato ChordPro, permitiendo transposición de tonos y visualización de acordes.
- **Gestión de Listas de Set (Setlists)**: Creación y organización de las canciones que se utilizarán en servicios específicos.
- **Instrumentos**: Gestión de los diferentes instrumentos y músicos asignados.

### 3. Personas y Equipos
- **Directorio de Miembros**: Gestión centralizada de la información de los integrantes.
- **Estructura por Áreas y Equipos**: Organización jerárquica (ej. Área de Multimedia -> Equipo de Video).
- **Asignación de Roles**: Diferenciación entre líderes de equipo y miembros regulares.

### 4. Calendario y Reuniones
- **Agenda de Servicios**: Programación de reuniones con vistas de lista y de cuadrícula mensual.
- **Detalle de Orden de Servicio**: Planificación detallada de cada momento del servicio.

### 5. Notificaciones y Actividad
- **Logs de Actividad**: Registro histórico de cambios y acciones realizadas en el sistema (Auditoría).
- **Sistema de Notificaciones**: Alertas sobre servicios programados y cambios importantes. Incluye soporte para **plantillas editables** (hasta 3 predefinidas) para personalizar la comunicación.

### 6. Internacionalización (i18n)
- Soporte completo para múltiples idiomas: **Español, Inglés y Portugués**, gestionado mediante un sistema de claves JSON para asegurar consistencia en toda la interfaz.

## ¿Qué puede hacer el usuario?
- **Administradores**: Configurar la estructura de la iglesia, gestionar el personal, ver reportes de actividad y supervisar todos los módulos activos.
- **Líderes de Alabanza**: Mantener el repertorio de canciones, armar las listas para los domingos y coordinar a los músicos.
- **Superadmin (Master)**: Acceder a cualquier iglesia del sistema sin restricciones, realizar mantenimientos globales y auditorías.
