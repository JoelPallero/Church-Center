# MinistryHub

MinistryHub is a modular platform designed to manage different areas of a ministry, such as Alabanza (Praise), Social Media, Multimedia, and more. Each module can be enabled independently based on the needs of the church.


Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Pendientes y Tareas Congeladas

- [ ] **Asistente AI (Chatbot)**: Funcionalidad de asistente para consultas de canciones, cronogramas y equipos.
  - El código se encuentra en `src/components/chat/ChatAssistant.tsx`.
  - El backend está en `backend/src/ChatbotManager.php` y `api/chatbot.php`.
  - Oculto temporalmente en `MainLayout.tsx`.
  - Pendiente: Refinar respuestas y asignar lógica final de base de datos.

---

## 🔥 MinistryHub: Arquitectura Modular

MinistryHub ha sido diseñado para ser una plataforma escalable y modular. Actualmente, el núcleo está centrado en la **Gestión de Alabanza**, pero la estructura permite habilitar módulos independientes según las necesidades del cliente:

### Módulos Actuales y Planificados
- **🎵 Alabanza (Praise):** Gestión de canciones, acordes, metrónomo y cronogramas de músicos. (Módulo Central Actual)
- **📷 Social Media:** Gestión de calendario de publicaciones, aprobaciones de diseño y copys.
- **🖥️ Multimedia:** Control de recursos visuales, letras para proyección y fondos.
- **🙏 Servidores:** Organización de voluntarios, hospitalidad y logística.
- **🧹 Limpieza:** Cronogramas de mantenimiento y orden del edificio.

### Visión de Futuro
Cada módulo está diseñado para funcionar de manera independiente pero integrada bajo el dominio central de **MinistryHub**. Esto permitirá en el futuro:
1. **Escalabilidad:** Implementar cada módulo como una aplicación móvil independiente.
2. **Personalización:** Habilitar funcionalidades específicas por cliente (Tenant-specific features).
3. **Subdominios:** Acceso modular vía `ministryhub.churchcenter.com/social-media`, etc.

