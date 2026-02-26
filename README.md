# MinistryHub

MinistryHub is a professional, modular, and multi-tenant platform designed for comprehensive church management. It features a scalable **Multi-Hub** architecture that allows churches to enable specific modules (Worship, Social Media, etc.) based on their needs.

## 🚀 Key Features

- **Multi-tenancy & Church Switching**: Manage multiple congregations with a single account.
- **Master Global Control**: A dedicated administrative role with unrestricted access across all churches and modules.
- **Worship Module**: Full song library (ChordPro), setlist management, and collaborator moderation flow.
- **Integrated Calendar**: List and Monthly Grid views for managing reunions and service orders.
- **Setup Flow**: Sequential wizard for onboarding new churches (Church -> Areas -> Teams -> Leaders).

## 🏗️ Project Architecture & Deployment

The project is structured so that the `frontend` handles the build and the `backend` handles the private logic.

```text
/public_html (Carpeta Pública)
├── assets/          # Generado por el build de React
├── api/             # Endpoints PHP (Copiados desde frontend/dist/api)
├── index.html       # Entrada de la App
└── .htaccess        # Rutas de React y API

/backend (Carpeta Privada - Al mismo nivel que public_html)
├── src/             # Lógica Core (Managers, Auth, Middleware)
└── config/          # Configuración y base de datos (.env)
```

### 📦 Deployment Steps

1.  **Build Frontend**:
    - `cd frontend`
    - `npm run build`
2.  **Upload to Hosting**:
    - Upload **everything inside** `frontend/dist/` to your `public_html/`.
    - Upload the **entire** `backend/` folder to your server root (as a sibling of `public_html`).
3.  **Database**:
    - Configure `backend/config/database.env` with your production DB credentials.
    - Import your SQL schemas.

## 📝 Roadmap & Progress

- [x] Multi-tenant Architecture & Church Selection.
- [x] Master Role Global Control & Authorization Bypass.
- [x] Improved Calendar (Monthly Grid view).
- [x] Setup Flow for Areas and Teams.
- [x] Translation & Internationalization (ES, EN, PT).
- [x] Final Production Build optimization.

---

MinistryHub is designed to scale from small communities to large multi-site organizations.
