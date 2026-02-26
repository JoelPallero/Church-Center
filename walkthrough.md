# Backend Restructuring & API Unification Walkthrough

This document details the transition from a traditional PHP structure to a modern, decoupled architecture with a RESTful API.

## 1. Directory Structure
The project is now divided into three main areas:
- `backend/`: The "Heart" of the application. Contains all business logic, data access, and core utilities. Isolated from direct public access.
- `frontend/`: The React application. All frontend code is centralized here.
- `public_html/`: The "Face" of the application. Contains the production build of the frontend and the single entry point for the API.

## 2. The Unified API
All API requests are now routed through `public_html/api/index.php`. 
- **Legacy**: `/api/people.php?action=list`
- **Modern**: `GET /api/people`

### Key Controllers
- `AuthController`: Handles JWT generation and validation.
- `PeopleController`: Manages users, status updates, and invitations.
- `ChurchController`: Multi-tenant church management.
- `TeamController` & `AreaController`: Organizational structure management.
- `CalendarController`: Event and assignment management.

## 3. Security & RBAC
A robust Role-Based Access Control (RBAC) system is enforced at the middleware level:
- `AuthMiddleware`: Validates JWT and ensures the user is authenticated.
- `PermissionMiddleware`: Checks if the user has the specific permission required for the requested action.

## 4. Frontend Integration
The frontend has been updated to use a centralized `api` service (Axios-based) with clean routes.
- Standardized use of `hasPermission()` hook for UI visibility.
- Removed all hardcoded role names in favor of permission strings.

## 5. Deployment Notes
The `.htaccess` in `public_html` handles both the SPA routing (React) and the API routing, ensuring a seamless user experience.

---
**Status**: Restructuring Complete. Architecture verified.
