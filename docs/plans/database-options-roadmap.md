# Database Options Roadmap

Multiple database backend support with configuration UI in settings.

**Priority**: LOW  
**Status**: Ready  
**Last Updated**: 2026-01-29

**Dependencies**:
- ~~[Env to Database Migration](env-to-database-roadmap.md)~~ - Complete

---

## Task Checklist

- [ ] Add database configuration settings UI
- [ ] Implement MySQL database driver support
- [ ] Implement PostgreSQL database driver support
- [ ] Implement Supabase (PostgreSQL) connection support
- [ ] Add database connection testing functionality
- [ ] Create database migration/switching workflow

---

## 1. Overview

**Purpose**: Allow users to configure and switch between different database backends through the application settings UI, without requiring environment file changes and redeploy.

**Supported Databases**:
- SQLite (current default)
- MySQL
- PostgreSQL
- Supabase (PostgreSQL-based)

**Current state**: Database is env-only via `config/database.php`, defaulting to SQLite.

---

## 2. Database Configuration UI (HIGH VALUE)

**Route**: `/configuration/database`

**Features**:
- Database driver selection dropdown
- Connection parameter inputs (host, port, database name, username, password)
- Supabase-specific configuration (project URL, API key)
- Connection test button with status feedback
- Current connection status indicator

**UI Components**:
- Driver selection (SQLite, MySQL, PostgreSQL, Supabase)
- Conditional form fields based on driver selection:
  - **SQLite**: Database file path
  - **MySQL/PostgreSQL**: Host, port, database, username, password, SSL options
  - **Supabase**: Project URL, database password, connection pooling options

---

## 3. Database Driver Implementation

### 3.1 MySQL Support

**Configuration fields**:
- Host (default: `127.0.0.1`)
- Port (default: `3306`)
- Database name
- Username
- Password
- Charset (default: `utf8mb4`)
- Collation (default: `utf8mb4_unicode_ci`)
- SSL mode (optional)

**Considerations**:
- Character set handling for Unicode support
- Connection pooling settings
- SSL/TLS configuration for secure connections

### 3.2 PostgreSQL Support

**Configuration fields**:
- Host (default: `127.0.0.1`)
- Port (default: `5432`)
- Database name
- Username
- Password
- Schema (default: `public`)
- SSL mode (prefer, require, verify-ca, verify-full)

**Considerations**:
- Schema isolation support
- Connection string format
- pgBouncer compatibility

### 3.3 Supabase Support

**Configuration fields**:
- Project URL (e.g., `https://xxxxx.supabase.co`)
- Database password
- Connection pooling mode (transaction, session)
- Direct connection vs pooled connection

**Supabase-specific considerations**:
- Use connection pooler URL for serverless deployments
- Direct connection for migrations
- Row Level Security (RLS) awareness
- Service role key for admin operations (optional)

**Connection URLs**:
- Pooled: `postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
- Direct: `postgres://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres`

---

## 4. Connection Testing & Validation

**Test connection flow**:
1. User enters connection parameters
2. Click "Test Connection" button
3. Backend attempts connection with provided credentials
4. Return success/failure with descriptive message
5. On success, show database version and connection info

**Validation**:
- Required fields based on driver type
- Port number range validation
- URL format validation for Supabase
- Timeout handling for unreachable hosts

**Error messages**:
- Connection refused (host/port issue)
- Access denied (credentials issue)
- Database not found
- SSL certificate errors
- Timeout errors

---

## 5. Database Migration Workflow

**Switching databases flow**:
1. User configures new database connection
2. Test connection succeeds
3. User confirms switch (warning about data)
4. Option to run migrations on new database
5. Update `.env` or store in secure settings
6. Application restarts/reconnects to new database

**Data considerations**:
- Warn users that existing data won't transfer automatically
- Optionally provide export/import for data migration
- Backup current database before switching

**Implementation options**:
- A) Store database config in encrypted file (bootstrap issue)
- B) Require environment variable update + restart
- C) Store primary config in env, but allow runtime override

---

## 6. Security Considerations

- **Credential encryption**: Store database passwords encrypted in config
- **Admin-only access**: Only admins can modify database settings
- **Audit logging**: Log all database configuration changes
- **Connection string sanitization**: Never log full connection strings with passwords
- **SSL enforcement**: Recommend/require SSL for production connections

---

## 7. Implementation Priority

| Feature | Priority | Effort | Value | Order |
|---------|----------|--------|-------|-------|
| MySQL support | HIGH | Medium | High | 1 |
| PostgreSQL support | HIGH | Medium | High | 2 |
| Database settings UI | HIGH | Medium | High | 3 |
| Connection testing | MEDIUM | Low | High | 4 |
| Supabase support | MEDIUM | Medium | Medium | 5 |
| Migration workflow | LOW | High | Medium | 6 |

---

## 8. Files Reference

**Backend** (to be created/modified):
- `backend/config/database.php` - Database configuration (existing)
- `backend/app/Http/Controllers/Api/DatabaseSettingsController.php` - New controller
- `backend/app/Services/DatabaseConnectionService.php` - Connection testing service

**Frontend** (to be created):
- `frontend/app/(dashboard)/configuration/database/page.tsx` - Database settings page
- `frontend/components/configuration/DatabaseConnectionForm.tsx` - Connection form component

**Documentation**:
- `docs/adr/012-admin-only-settings.md` - Admin-only settings decision (existing)

---

## 9. Dependencies

- PHP PDO extensions: `pdo_mysql`, `pdo_pgsql`
- Docker image must include database client libraries
- May require Dockerfile updates for additional PHP extensions
