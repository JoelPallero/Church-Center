# Protocolo de Gestión de Permisos (AGENTS.md)

> [!IMPORTANT]
> Este archivo define los componentes "intocables" del sistema de permisos. Cualquier modificación a la lógica de acceso debe seguir estrictamente este protocolo.

## 1. Fuente de Verdad Centralizada
Toda la lógica de permisos de la aplicación ha sido centralizada en:
- `frontend/src/config/permissionsConfig.ts`: Contiene la matriz de permisos (`PERMISSIONS_MATRIX`) derivada del archivo oficial de NotebookLM.
- `frontend/src/hooks/useAuth.ts` (vía `AuthContext`): Expone la función `canAccess(path)` que consume dicha matriz.

## 2. Componentes Críticos (No Tocar sin Autorización)
Los siguientes archivos son estructurales y **no deben ser modificados ad-hoc**:
- `permissionsConfig.ts`: La matriz de permisos es estática y refleja la política de seguridad oficial.
- `ModuleGuard.tsx`: Protege las rutas a nivel de motor de React Router.
- `AuthContext.tsx`: Gestiona el estado global de autenticación y permisos.

## 3. Implementación en Vistas
Para cualquier nueva página o botón que requiera protección, **SIEMPRE** usar la utilidad `canAccess`:

```tsx
const { canAccess } = useAuth();

// Ejemplo en navegación
if (canAccess('/new-feature')) {
  renderFeature();
}
```

## 4. Protocolo de Modificación
Si se requiere cambiar un permiso o agregar un nuevo rol:
1. El programador debe validar el cambio con el responsable del proyecto.
2. Se debe actualizar `permissionsConfig.ts` asegurando que el identificador (path) coincida exactamente con la matriz.
3. Se debe verificar el impacto en los 6 perfiles principales: Superadmin, Pastor, Leader, Coordinator, Member, Ujier.

## 5. Mantenimiento de Navegación
Los componentes `DesktopSidebar.tsx`, `BottomNav.tsx` y `MainLayout.tsx` se sincronizan automáticamente con la matriz. No agregar lógica de ocultamiento manual basada en roles específicos dentro de estos archivos.


## 6. Siempre que se realicen modificaciones, o agreguen funcionalidades nuevas, debe realizarse el chequeo de su traducción en el archivo de traducciones para cada idioma.


## 7. Cuando se realicen cambios en la base de datos, debe actualizarse el archivo completo de la base de datos: /User SQL/main.sql.


## 8. Cada vez que modificás algo, rompés otra cosa. Hacé pruebas constantes luego de cambiar algo para confirmar que nada se rompe al modificarlo

## 9. Este es el protocolo de permisos que debe tener cada rol:

### Resumen del Protocolo de Permisos por Perfil

**👑 Superadmin**
*   **Iglesias:** ABM (Altas, Bajas y Modificaciones) Global. Tiene el control total sobre la infraestructura multi-iglesia y es el único capaz de crear nuevas iglesias o gestionar configuraciones globales.
*   **Consolidación:** ABM Global.
*   **Gestión General:** ABM total para Áreas, Equipos, Personas (incluyendo roles), Canciones (con aprobación), Listados/Playlists y Reuniones.
*   **Extras:** Acceso a todas las herramientas de depuración, auditoría y a los selectores de cualquier iglesia.

**👔 Pastor**
*   **Iglesias:** **Solo Ver y editar (Únicamente su propia iglesia, no puede ver todas las iglesias)**.
*   **Consolidación:** ABM Local.
*   **Gestión General:** Actúa como administrador de la iglesia local con permisos de ABM para Áreas, Equipos, Personas, Canciones (con aprobación), Listados/Playlists y Reuniones,  todas creadas en el mismo scope de la iglesia.
*   **Extras:** Define la estructura de las áreas, aprueba nuevos miembros, supervisa reportes financieros/de crecimiento local y tiene su propio panel de control (Pastor Hub).

**🎸 Líder (Líder de Área)**
*   **Gestión Total (ABM):** Equipos, Listados/Playlists y Canciones (Solo para equipo de Alabanza. Ya uqe si es Líder pero de Ujieres, no tiene permisos par hacer un abm de canciones).
*   **Gestión Parcial (Editar):** Personas y Reuniones (asigna recursos y staff).
*   **Lectura (Solo Ver):** Áreas.
*   **Sin Acceso:** Iglesias y Consolidación.

**📋 Coordinador (Coordinador de Equipo)**
*   **Gestión Total (ABM):** Listados de canciones (Playlists).
*   **Gestión Parcial:** Edición de Canciones (letras y acordes), asignar el "Setlist" en las Reuniones e Invitar Personas.
*   **Lectura (Solo Ver):** Equipos.
*   **Sin Acceso:** Iglesias y Consolidación.

**👤 Miembro (Músico / Colaborador)**
*   **Gestión de su Perfil:** Edición de su propia información e instrumentos si pertenece al área de Alabanza.
*   **Lectura (Solo Ver):** Canciones y Listados de canciones (solo si pertenece al área o hub de Alabanza) y Reuniones (para consumo de información de ejecución, cifrados y métricas).
*   **Sin Acceso:** Iglesias, Áreas, Equipos, Personas y Consolidación.

---

### 🧠 Mapa Mental de Permisos (Representación Jerárquica)

```text
SISTEMA DE PERMISOS MINISTRYHUB
│
├── 👑 SUPERADMIN (Nivel Master)
│   ├── 🏢 Iglesias -------> [ABM Global - Crea y gestiona todas]
│   ├── 📊 Consolidación --> [ABM Global]
│   └── ⚙️ Todo el resto -> [ABM Total] (Áreas, Equipos, Personas, Canciones, etc.)
│
├── 👔 PASTOR (Nivel Admin Local)
│   ├── 🏢 Iglesias -------> [Solo Ver - ÚNICAMENTE SU PROPIA IGLESIA] 
│   ├── 📊 Consolidación --> [ABM Local]
│   └── ⚙️ Todo el resto -> [ABM Local] (Gestiona su sede: Áreas, Miembros, Canciones)
│
├── 🎸 LÍDER (Nivel Área / Ej. Alabanza)
│   ├── 👥 Equipos --------> [ABM] (Gestiona equipos bajo su área)
│   ├── 🎵 Canciones ------> [ABM / Aprobar]
│   ├── 📜 Playlists ------> [ABM]
│   ├── 👤 Personas -------> [Editar]
│   ├── 📅 Reuniones ------> [Editar]
│   ├── 📁 Áreas ----------> [Solo Ver]
│   └── 🚫 Iglesias / Consolidación -> [Sin Acceso]
│
├── 📋 COORDINADOR (Nivel Equipo / Operativo)
│   ├── 📜 Playlists ------> [ABM] (Crea listados)
│   ├── 🎵 Canciones ------> [Editar] (Letras, acordes)
│   ├── 📅 Reuniones ------> [Asignar Setlist]
│   ├── 👤 Personas -------> [Invitar]
│   ├── 📁 Áreas / Equipos-> [Solo Ver]
│   └── 🚫 Iglesias / Consolidación -> [Sin Acceso]
│
└── 👤 MIEMBRO (Nivel Usuario Final)
    ├── 🎸 Mi Perfil ------> [ABM] (Datos propios e instrumentos)
    ├── 🎵 Canciones ------> [Solo Ver] (Para tocar en vivo)
    ├── 📜 Playlists ------> [Solo Ver]
    ├── 📅 Reuniones ------> [Solo Ver]
    └── 🚫 Iglesias / Áreas / Equipos / Personas / Consolidación -> [Sin Acceso]
```