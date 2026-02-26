# Backend Restructuring Task List

## completed
- [x] Create directory structure (`backend`, `frontend`, `public_html`)
- [x] Create `backend/src/bootstrap.php` and core classes (`Database`, `Jwt`, `Response`, `Cors`)
- [x] Implement RESTful Router in `public_html/api/index.php`
- [x] Create all necessary Controllers in `backend/src/Controllers/`
- [x] Implement Auth and Middleware logic
- [x] Update frontend services to use clean RESTful paths
- [x] Refactor frontend components to remove legacy `.php` references
- [x] Configure `.htaccess` for routing and security
- [x] Finalize audit and verification

## next_steps
- [ ] Implement full logic in stubs (Repositories and Controllers)
- [ ] Thoroughly test all permission-based routes
- [ ] Verify production build deployment in Hostinger environment
