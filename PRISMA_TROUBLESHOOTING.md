# Prisma & Database Setup Troubleshooting Guide

This document documents the challenges encountered during the local development setup and their solutions.

---

## Issue 1: DNS Resolution Failure - `binaries.prisma.sh`

### Problem
```
Error: request to https://binaries.prisma.sh/... failed, reason: getaddrinfo ENOTFOUND binaries.prisma.sh
```

### Root Cause
The DNS server (10.40.125.162) could not resolve the domain `binaries.prisma.sh`, preventing Prisma from downloading required binaries.

### Solution
Changed DNS server to public DNS:
1. Press `Win + R`, type `ncpa.cpl`, press Enter
2. Right-click active network adapter → Properties
3. Double-click "Internet Protocol Version 4 (TCP/IPv4)"
4. Select "Use the following DNS server addresses"
5. Set **Preferred DNS**: `8.8.8.8` (Google DNS)
6. Set **Alternate DNS**: `1.1.1.1` (Cloudflare DNS)
7. Click OK → OK → Close
8. Run: `ipconfig /flushdns` (as Administrator)

### Verification
```bash
nslookup binaries.prisma.sh
# Should return IP addresses like 172.66.156.100
```

---

## Issue 2: Prisma Version Mismatch

### Problem
```json
"@prisma/client": "^5.14.0",
"prisma": "^7.8.0",
```

The Prisma CLI version (7.8.0) was newer than the client version (5.14.0), causing compatibility issues.

### Solution
Aligned both packages to the same stable version (5.14.0):

```json
"@prisma/client": "^5.14.0",
"prisma": "^5.14.0",
```

Then reinstalled dependencies:
```bash
npm install
```

---

## Issue 3: PostgreSQL Extension `uuid_ossp` Not Available

### Problem
```
ERROR: extension "uuid_ossp" is not available
DETAIL: Could not open extension control file "C:/Program Files/PostgreSQL/17/share/extension/uuid_ossp.control"
```

### Root Cause
PostgreSQL 17 does not include the `uuid_ossp` extension by default. The `gen_random_uuid()` function is built-in since PostgreSQL 13+, making the extension unnecessary.

### Solution
1. Removed `uuid_ossp` from the Prisma schema extensions:
   ```prisma
   datasource db {
     provider   = "postgresql"
     url        = env("DATABASE_URL")
     extensions = [pg_trgm]  // Removed uuid_ossp
   }
   ```

2. Deleted old migrations:
   ```bash
   Remove-Item -Recurse -Force apps\backend\prisma\migrations
   ```

3. Dropped and recreated the database:
   ```bash
   psql -U postgres -c "DROP DATABASE discover_festac;"
   psql -U postgres -c "CREATE DATABASE discover_festac;"
   ```

4. Ran fresh migration:
   ```bash
   npm run db:migrate
   ```

---

## Issue 4: Missing `DATABASE_URL` in Schema

### Problem
```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Argument "url" is missing in data source block "db".
```

### Root Cause
After downgrading Prisma from 7.x to 5.x, the `prisma.config.js` file (which provided the DATABASE_URL) was no longer compatible. The schema.prisma file needed the URL directly.

### Solution
Added `DATABASE_URL` directly to the datasource block:
```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")  // Added this line
  extensions = [pg_trgm]
}
```

---

## Issue 5: Import Path Error in Seed Script

### Problem
```
Error: Cannot find module '../../packages/shared/src/utils/index.js'
```

### Root Cause
The seed script was using a relative path to import from the shared package instead of using the workspace package name.

### Solution
Changed the import in `apps/backend/src/database/seed.ts`:
```typescript
// Before
import { generateSlug } from '../../packages/shared/src/utils/index.js';

// After
import { generateSlug } from '@discover-festac/shared';
```

Also ensured the shared package was built:
```bash
npm run build --workspace=packages/shared
```

---

## Issue 6: Database Drift Detected

### Problem
```
Error: Drift detected: Your database schema is not in sync with your migration history.
```

### Root Cause
Previous migration attempts had left the database in an inconsistent state.

### Solution
Used `db:reset` to drop and recreate the schema:
```bash
npm run db:reset
```

Note: This deletes all data in the database.

---

## Complete Setup Sequence (After Fixes)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create PostgreSQL database**
   ```bash
   psql -U postgres -c "CREATE DATABASE discover_festac;"
   ```

3. **Configure backend .env**
   ```bash
   cd apps/backend
   cp .env.example .env
   # Edit .env with DATABASE_URL and JWT secrets
   ```

4. **Generate Prisma client**
   ```bash
   npm run db:generate
   ```

5. **Run migrations**
   ```bash
   npm run db:migrate
   ```

6. **Build shared package**
   ```bash
   npm run build --workspace=packages/shared
   ```

7. **Seed database**
   ```bash
   npm run db:seed
   ```

8. **Configure frontend .env**
   ```bash
   cd apps/frontend
   cp .env.example .env
   # Default works for local dev
   ```

9. **Run dev servers**
   ```bash
   npm run dev
   ```

---

## Key Takeaways

1. **DNS matters**: Ensure your DNS can resolve `binaries.prisma.sh` before attempting Prisma operations
2. **Version alignment**: Keep `@prisma/client` and `prisma` CLI at the same version
3. **PostgreSQL compatibility**: PostgreSQL 17+ doesn't need `uuid_ossp` - use built-in `gen_random_uuid()`
4. **Workspace imports**: Use workspace package names (`@discover-festac/shared`) not relative paths
5. **Schema configuration**: For Prisma 5.x, include `url = env("DATABASE_URL")` in the datasource block
6. **Clean state**: When migrations fail, delete the migrations folder and recreate the database

---

## Environment Configuration

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres@localhost:5432/discover_festac?schema=public
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<different-64-char-random-string>
NODE_ENV=development
PORT=4000
```

### Frontend (.env)
```env
VITE_API_URL=/api/v1
VITE_APP_NAME=Discover Festac
VITE_APP_VERSION=1.0.0
```

---

## Useful Commands

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Reset database (deletes all data)
npm run db:reset

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Build shared package
npm run build --workspace=packages/shared

# Run both dev servers
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend
```
