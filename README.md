# ⛪ MinistryHub - Church Management Platform

**MinistryHub** is a professional, modular, and multi-tenant ecosystem designed to streamline church administration, worship leadership, and community engagement. Built with a high-performance stack, it scales from local congregations to global multi-site organizations.

---

## 🌟 Vision and Philosophy
The platform is designed around the concept of **"The Right Tool for the Right Task"**. Instead of a monolithic app, MinistryHub uses a **Multi-Hub** architecture:
- **Ministry Hub**: For worship teams, songs, and setlists.
- **Social Media Hub**: For communication and media teams.
- **Church Center**: For overall administration, people management, and reporting.

---

## 🛠️ Technology Stack

### Frontend (Modern UI/UX)
- **React 19 & TypeScript**: Strict typing and the latest stable React features.
- **Vite**: Ultra-fast build tool and development server.
- **Vanilla CSS & Glassmorphism**: High-performance, custom-built design system with native **Dark Mode** support and premium micro-animations.
- **i18next**: Comprehensive internationalization system (ES, EN, PT) using JSON keys.
- **ChordSheetJS**: Powerful engine for processing and rendering music in **ChordPro** format.

### Backend (Robust API)
- **Vanilla PHP (PSR-4)**: A professional, custom-built micro-framework approach for maximum performance and zero dependency overhead.
- **JWT (JSON Web Tokens)**: Stateless authentication for secure, scalable communication.
- **Controller-Repository Pattern**: Clean separation of concerns between API routing and data persistence.
- **Middleware System**: Centralized security filters for CORS, Authentication, and Role-Based Access Control (RBAC).

### Database & Security
- **MySQL**: Relational data storage with optimized indexing.
- **PDO**: Prepared statements for complete protection against SQL injection.
- **reCAPTCHA v3**: Invisible security layer for authentication forms.

---

## 🏗️ Architecture: How it Works

### 1. Folder Structure
The system is divided into a **Public Folder** and a **Private Core** to ensure maximum security:

```text
/ (Server Root)
├── backend/                # PRIVATE CORE (Sibling of public_html)
│   ├── config/             # Database credentials (.env)
│   ├── src/                # Controllers, Repositories, Helpers
│   └── bootstrap.php       # PSR-4 Autoloader & Initialization
└── public_html/            # PUBLIC ACCESS
    ├── assets/             # Compiled JS/CSS from React
    ├── api/                # index.php (The single entry point for the API)
    ├── .htaccess           # Routing logic
    └── index.html          # React SPA Entry point
```

### 2. Request Lifecycle
1.  **Client Request**: A browser visits `church.com/worship/songs`.
2.  **.htaccess Intervention**:
    - If it's an `/api/*` call, it routes to `api/index.php`.
    - If it's a page route, it serves `index.html` (React Router takes over).
3.  **API Handling**: `api/index.php` extracts the JWT, identifies the user, and routes the action (e.g., `GET /songs`) to the corresponding `Controller`.
4.  **Data Layer**: The `Controller` asks the `Repository` for data, which uses `PDO` to query the DB.

---

## 🚀 Key Modules

### 🎸 Worship Module (Ministry Hub)
- **ChordPro Support**: Dynamic transposition of songs.
- **Moderation Flow**: Collaborators can propose edits to songs, which leaders must approve before they go live.
- **Setlist Management**: Organize songs for specific meetings with detailed assignments.

### 👥 Church Center & Ushers
- **People Management**: Detailed member profiles with role assignments and area filters.
- **Ushers Service**:
    - **Service Counting**: Track attendance (adults/children) per meeting.
    - **Visitor Logging**: Dedicated flow for registering first-time visitors for follow-up.

### 🏢 Multi-Tenancy & Global Control
- **Switching Context**: Users belongs to a specific church, but "Master" users can switch between multiple congregations seamlessly.
- **Sequential Setup**: A wizard leads new churches through creating Areas -> Teams -> Inviting Leaders.

---

## 📦 Installation & Deployment

### Development Environment
1.  Clone the repository.
2.  **Frontend**:
    - `cd frontend`
    - `npm install`
    - Create `.env` with `VITE_API_URL`.
    - `npm run dev`
3.  **Backend**:
    - Ensure a local PHP server is running.
    - Configure `backend/config/database.env`.

### Production Deployment
1.  **Build**: Run `npm run build` in the `frontend` folder.
2.  **Upload**:
    - Move everything inside `frontend/dist/` to your server's `public_html/`.
    - Move the `backend/` folder to the level **above** `public_html`.
3.  **Database**: Import the SQL files located in `/User SQL` and `/Music SQL`.
4.  **Permissions**: Ensure `backend/logs/` is writable by the server.

---

## 🛡️ Security Implementation
- **Invisible reCAPTCHA**: Integrated into the login flow to prevent brute-force attacks without impacting UX.
- **Stateless Auth**: JWTs are stored in `localStorage` and sent in the `Authorization` header.
- **Public/Private Split**: Sensitive logic in `backend/` is never directly reachable via URL.

---

## 🌍 Internationalization
All UI strings are managed via `frontend/src/i18n/locales/`. This allows for:
- Remote translation updates.
- Easy addition of new languages.
- Zero "hardcoded" text in components.

---

© 2026 MinistryHub Team. Built for the Church of today and tomorrow.
