# PPE Backend – API Documentation

Built with **Express + TypeScript + Prisma (SQLite) + JWT**.

Frontend remains in `src/` (Vite + React). Backend lives in `server/src/` and shares auth/roles with `src/types/index.ts` & `src/store/useStore.ts` business rules.

---

## Quick Start

```bash
npm install
# configure env
cp .env.example .env   # then edit JWT_SECRET etc
npx prisma generate
npx prisma migrate dev   # creates prisma/dev.db
npm run db:seed           # seeds mockData (password: password123 for all users)

# dev (two terminals) or combined
npm run dev:server   # backend http://localhost:4000
npm run dev:client   # frontend http://localhost:3000 (proxies /api to backend)
# or
npm run dev:all

# production
npm run build          # vite build -> dist/
npm run build:server   # tsc -> dist-server/
npm start              # serves API + static frontend on PORT=4000
```

Health: `GET http://localhost:4000/health`  
API base: `http://localhost:4000/api`  
Docs: `GET /api` lists endpoints.

---

## Default Users (seed)

All seeded users have password **`password123`**:

| employeeCode | name | role |
|---|---|---|
| EMP-001 | Admin User | Admin |
| EMP-002 | John HSE Supervisor | HSE Supervisor |
| EMP-003 | Sarah Direct Super | Direct Supervisor |
| EMP-008 | Mike Store Keeper | Store Keeper |
| EMP-004/005/006/007/009/010/011/012 | ... | Employee |

Login to get JWT:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employeeCode":"EMP-001","password":"password123"}'
# => { token, user }
```

Use `Authorization: Bearer <token>` for protected routes.

---

## Auth & RBAC

Roles: `Admin | HSE Supervisor | Direct Supervisor | Store Keeper | Employee` (stored with space, normalized internally).

| Resource | Allowed Roles |
|---|---|
| Auth /me | any authenticated |
| JobPositions, Attributes, ItemGroups, PPE Items, Locations, Kits (create/update/delete) | Admin, HSE Supervisor |
| Stock balances/batches (read) | Admin, HSE, Store Keeper (scoped to assigned locations) |
| Stock adjustments create | Admin, HSE, Store Keeper |
| Stock adjustments review (approve/reject) | Admin, HSE Supervisor |
| Transfers | Admin, HSE, Store Keeper |
| OpeningBalances draft/create | Admin, HSE, Store Keeper |
| OpeningBalances approve/reject | Admin, HSE Supervisor |
| Issuances create/return | Admin, HSE, Direct Supervisor, Store Keeper |
| Scrap create/return, reverse | create: Admin/HSE/Store Keeper; reverse: Admin/HSE Supervisor (7-day window) |
| Expiry settings read | any; write Admin only |
| Audit logs | Admin, HSE Supervisor |
| Trash restore | Admin |

Store Keeper is **row-level scoped**: `GET /stock/balances`, `GET /issuances`, `GET /stock/adjustments`, `POST /stock/transfers (fromLocation must be assigned)` filter by `LocationStoreKeeper` links (`Locations.assignedStoreKeeperIds`).

---

## Endpoints

### Auth
- `POST /api/auth/login` – body `{employeeCode,password}`
- `POST /api/auth/register` – first user open, afterwards requires auth; body `{employeeCode,name,jobPositionId,role,password}`
- `GET /api/auth/me` – Bearer

### Job Positions
- `GET /api/job-positions?search=&active=&page=&limit=&includeDeleted=`
- `GET /api/job-positions/:id`
- `POST /api/job-positions` – `{code,nameEn,nameAr}`
- `PUT /api/job-positions/:id`
- `PATCH /api/job-positions/:id/active` – `{active:boolean}`
- `DELETE /api/job-positions/:id` – soft delete
- `POST /api/job-positions/:id/restore`

### Locations, Attributes, ItemGroups, Kits – same pattern
- `GET /api/locations?search=&site=&locationType=&active=&includeDeleted=`
- `POST /api/locations` – `{code,nameEn,nameAr,site,locationType,description,capacityUnits,address,assignedStoreKeeperIds}`
- etc. See `server/src/routes/*.ts` & `server/src/schemas/entities.ts`.

### PPE Items
- `GET /api/ppe-items?search=&active=&itemGroupId=&category=&page=&limit=`
- `GET /api/ppe-items/:id`
- `POST /api/ppe-items` – `{itemCode,nameEn,nameAr,photoUrl,category,itemGroupId,hasSize,gender,lifespanType,lifespanValue,descriptionEn,descriptionAr,manufacturer,model,standardCertification,riskCategory,reorderLevel,locationIds,uom,variantAttributeValueIds}`
- `PUT /api/ppe-items/:id`
- `PATCH /api/ppe-items/:id/active`
- `DELETE /api/ppe-items/:id` / `POST /:id/restore`
- `POST /api/ppe-items/:id/photo` – multipart `photo`
- `GET /api/ppe-items/export` – CSV
- `POST /api/ppe-items/import` – multipart `file` (stub)

### Employees
- `GET /api/employees?search=&role=&active=&page=&limit=`
- `GET /api/employees/:id`
- `PUT /api/employees/:id` – `{name,jobPositionId,role,active,password}`
- `DELETE /:id` (soft) / `POST /:id/restore`

### Stock
- `GET /api/stock/balances?ppeItemId=&locationId=&search=&status=all|low_stock|out_of_stock|in_stock&page=&limit=`
- `GET /api/stock/batches?ppeItemId=&locationId=&status=&batchNumber=&page=&limit=` – FIFO sorted oldest first
- `GET /api/stock/movements?type=transfer|adjustment|opening&page=&limit=`
- `GET /api/stock/adjustments?status=&locationId=&page=&limit=`
- `POST /api/stock/adjustments` – `{ppeItemId,locationId,batchNumber,quantityDelta,type:IN|OUT,reasonCategory,reason}` – `Manual Correction` → `pending`, others → `applied` (updates balances/batches immediately)
- `PATCH /api/stock/adjustments/:id/review` – `{status:approved|rejected}`
- `POST /api/stock/transfers` – `{ppeItemId,fromLocationId,toLocationId,batchNumber,quantity}` – atomic transaction, creates movement + batch clone, guard `from===to` and `Scrap/Used → General/Central/Site` blocked.

### Opening Balances
- `GET /api/opening-balances?status=&locationId=&page=&limit=`
- `GET /api/opening-balances/:id`
- `POST /api/opening-balances` – `{locationId,referenceDate,notes,lines:[{ppeItemId,batchNumber,expiryDate,quantity,costPerUnit}]}`
- `PUT /api/opening-balances/:id`
- `PATCH /api/opening-balances/:id/submit` – Draft → Pending Approval
- `PATCH /api/opening-balances/:id/approve` – Pending → Approved + creates batches + balances + audit (single Approved per location enforced)
- `PATCH /api/opening-balances/:id/reject` – `{reason>=20 chars}`
- `DELETE /api/opening-balances/:id`

### Issuances
- `GET /api/issuances?search=&status=&employeeId=&openLoansOnly=true&page=&limit=`
- `GET /api/issuances/my` – current user
- `GET /api/issuances/:id`
- `POST /api/issuances` – polymorphic single/kit/loan: `{employeeId|holderName,holderType,ppeItemId|kitId,locationId,quantity,batchNumber,variantKey,issueDate,expectedReturnDate,storeKeeperSignature,receiverSignature}` – both signatures required, validates `locationIds.includes`, stock & batch available, kit constituent stock, auto `expectedReplacementDate` from lifespan.
- `POST /api/issuances/:id/return` – `{condition:good|damaged|worn_out|lost,physicalReceiptConfirmed}` – `good` → restock to Used; `damaged/worn_out+confirmed` → auto scrap to Scrap location; `lost` → no stock change.

### Scrap
- `GET /api/scrap?reversed=true|false&page=&limit=`
- `POST /api/scrap` – `{ppeItemId,locationId,batchNumber,quantity,reason,relatedReferenceId}`
- `POST /api/scrap/:id/reverse` – `{reason>=10}` – only Admin/HSE, 7-day window, restocks to Used.

### Expiry Settings
- `GET /api/expiry-settings` → `{generalLeadTimeDays, categoryOverrides:[{riskCategory,leadTimeDays}]}`
- `PUT /api/expiry-settings` – `{generalLeadTimeDays,categoryILeadTimeDays,categoryIILeadTimeDays,categoryIIILeadTimeDays}` – Admin

### Audit Logs
- `GET /api/audit-logs?entityType=&action=&performedBy=&from=&to=&page=&limit=` – Admin/HSE only, sorted timestamp desc, 7-year retention note.

### Trash & Dashboard
- `GET /api/trash` – Admin only, aggregates soft-deleted ppeItems, attributes, itemGroups, locations, kits sorted by deletedAt.
- `GET /api/dashboard/stats` – `{outOfStockCount,lowStockCount,totalValuation,pendingAdjustments,openLoans,expiringSoon,overdue,totalPPEItems,totalLocations,totalIssuances}` – scoped for Store Keeper.

---

## Frontend Integration

Vite proxies `/api`, `/health`, `/uploads` to `http://localhost:4000` (see `vite.config.ts:76`).

Create `src/lib/api.ts` (already present) – thin fetch wrapper handling JWT in localStorage:

```ts
import { api, setToken } from '@/lib/api';
const { token, user } = await api.login("EMP-001","password123");
setToken(token);
const { data } = await api.list("ppe-items", { search:"helmet" });
```

Replace `usePPEStore` mock calls with `api.*` + `react-query` (suggested). Example migration: `useStore.stockBalances` → `api.stockBalances()`.

Seed covers `src/store/mockData.ts` data; no code change needed for UI if you keep Zustand and sync via API on app start.

---

## DB & Migrations

- Prisma SQLite at `prisma/dev.db` (file:./dev.db relative to prisma/).
- Schema `prisma/schema.prisma` (String enums for SQLite compat).
- `npx prisma studio` to browse.
- Switch to Postgres: change `provider = "postgresql"` + `DATABASE_URL` and `npx prisma migrate dev`.

---

## Production Notes

- Set strong `JWT_SECRET`, `CORS_ORIGIN`, `DATABASE_URL`.
- `uploads/` is local; swap to S3 by changing `multer` storage in `server/src/routes/ppeItems.ts:20`.
- Rate limit auth: add `express-rate-limit` (not enabled by default).
- AuditLog is immutable; add retention cron if needed.
- All write ops create `AuditLog` entries.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev:server` | backend watch |
| `npm run dev:client` | frontend vite |
| `npm run dev:all` | both concurrently |
| `npm run build` / `build:server` | frontend / backend build |
| `npm start` | serve built frontend + API |
| `npm run db:seed` | reseed |
| `npm run db:studio` | Prisma Studio |

---

## Verification

```bash
npx tsx server/test-api.ts          # quick smoke
npx tsx server/test-comprehensive.ts # full flows incl. RBAC, scoping
```

See `server/test-*.ts` for examples.
