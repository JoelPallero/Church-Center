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
3. Se debe verificar el impacto en los 5 perfiles principales: Superadmin, Pastor, Leader, Coordinator, Member.

## 5. Mantenimiento de Navegación
Los componentes `DesktopSidebar.tsx`, `BottomNav.tsx` y `MainLayout.tsx` se sincronizan automáticamente con la matriz. No agregar lógica de ocultamiento manual basada en roles específicos dentro de estos archivos.


## 6. Siempre que se realicen modificaciones, o agreguen funcionalidades nuevas, debe realizarse el chequeo de su traducción en el archivo de traducciones para cada idioma.