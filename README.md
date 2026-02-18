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

## 🏗️ MinistryHub: Arquitectura Multi-Hub SaaS Professional

MinistryHub es una plataforma modular y escalable diseñada para la gestión integral de congregaciones. Utiliza una arquitectura **Multi-Hub** que permite habilitar módulos contextuales (Worship, Social Media, etc.) según las necesidades.

### Estructura del Proyecto

```text
/
├── frontend/             # Aplicación React + Vite
│   ├── src/              # Código fuente (TypeScript)
│   └── public/           # Assets estáticos del frontend
├── backend/              # Lógica de negocio y servicios
│   ├── src/              # Clases PHP (Auth, Managers, Middleware)
│   ├── api/              # Puntos de entrada públicos (Controladores)
│   ├── .docker/          # Configuración de Docker (PHP, Apache)
│   └── docker-compose.yml # Orquestación local
```

## 🚀 Inicio Rápido (Docker)

Para comenzar el desarrollo local:

1.  `cd backend`
2.  `docker-compose up -d`
3.  Accede a `http://localhost:5173` para el frontend y `http://localhost:8080/api/` para la API.

Para más detalles sobre la instalación y despliegue, consulta **[BACKEND_SETUP.md](file:///c:/Programacion/GitHub/MSM2/BACKEND_SETUP.md)**.

## 📝 Próximos Pasos y Tareas

- [x] Refactorización de Arquitectura Multi-Hub (Base de datos y Backend).
- [x] Implementación de Middleware de Autorización contextual.
- [x] Restructuración de carpetas y Dockerización.
- [ ] **Frontend**: Adaptar los stores y componentes para consumir el nuevo mapa de permisos.
- [ ] **Asistente AI (Chatbot)**: Refinar la lógica del asistente (Actualmente en `backend/src/modules/chatbot`).

---

MinistryHub es un ecosistema diseñado para crecer. Cada módulo (Praise, Social Media, Multimedia) funciona bajo un dominio centralizado, permitiendo escalabilidad y personalización por cliente (Tenancy).

