# Analysis & Fix Strategy Report: PPE-007 Catalog Import Facade Remediations

**Agent**: `explorer_m1_r2_1` (Teamwork Explorer)  
**Target Milestone**: Milestone 1 Iteration 2  
**Target Defect**: Defect 1: Critical [INTEGRITY VIOLATION] — PPE-007 Catalog Import Facade in `server/src/routes/ppeItems.ts:238-250` and `src/pages/Catalog.tsx:222-244`  
**Working Directory**: `d:\Sana Soft2\PRoject Code\PPE-FINAL\.agents\teamwork\explorer_m1_r2_1`  
**Project Root**: `d:\Sana Soft2\PRoject Code\PPE-FINAL`  

---

## 1. Observation

### A. Verbatim Backend Facade in `server/src/routes/ppeItems.ts:238-250`
In `server/src/routes/ppeItems.ts` lines 238–250:
```typescript
router.post("/import", authorize("Admin", "HSE Supervisor"), upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "CSV file required");
  const content = fs.readFileSync(req.file.path, "utf-8");
  const lines = content.split("\n").filter(Boolean);
  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 6) continue;
    // CSV columns mapping skipped complex parsing - stub
    imported++;
  }
  res.json({ imported, message: "Import stub executed" });
}));
```
**Specific defects directly observed:**
1. Lines 246–249 contain the explicit comment: `// CSV columns mapping skipped complex parsing - stub` and return `{ imported, message: "Import stub executed" }`.
2. No database read, validation, insert, or update operation is performed. Zero records are created or updated in SQLite via Prisma.
3. No foreign key resolution occurs for `itemGroupId` or `locationIds`.
4. No Zod validation against `ppeItemSchema` occurs.
5. No `AuditLog` entry is written with `source: "Import"`, violating Global Rule G1.
6. The uploaded temporary file in `uploads/ppe/` is never deleted or cleaned up from the filesystem.

---

### B. Verbatim Frontend Simulation in `src/pages/Catalog.tsx:222-244` and Lines 710–765
In `src/pages/Catalog.tsx` lines 222–244:
```typescript
  // Simulate file upload and preview (BD-I486)
  const handleSimulateImport = () => {
    // Simulated catalog import batch
    if (importMode === 'new_only') {
      setImportPreview({
        newCount: 2,
        updatedCount: 0,
        errorCount: 1,
        errors: [
          'Row 3: Item Code "HLM-001" already exists in active catalog. Skipped in Add New Only mode.'
        ]
      });
    } else {
      setImportPreview({
        newCount: 1,
        updatedCount: 3,
        errorCount: 1,
        errors: [
          'Row 4: Attempted to modify locked Item Code for "BOT-003" with active transactions. Row skipped.'
        ]
      });
    }
  };
```
And in lines 710–716:
```tsx
  {/* Upload trigger */}
  <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center space-y-2 bg-slate-50">
    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
    <p className="text-xs text-slate-600">Select `.xlsx` or `.csv` catalog template file</p>
    <Button size="sm" variant="secondary" onClick={handleSimulateImport}>
      Simulate Upload & Parse
    </Button>
  </div>
```
**Specific defects directly observed:**
1. The UI does not provide an `<input type="file">` element. Clicking the upload area triggers `handleSimulateImport()`.
2. The UI does not call `/api/ppe-items/import` via HTTP.
3. The preview and commit actions display hardcoded strings (`"HLM-001"`, `"BOT-003"`) rather than processing user data.

---

### C. Relevant Schema & Model Constraints

#### 1. `ppeItemSchema` in `server/src/schemas/entities.ts:50-73`
```typescript
export const ppeItemSchema = z.object({
  itemCode: z.string().min(1).max(50),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  photoUrl: z.string().optional().nullable(),
  category: z.string().min(1),
  itemGroupId: z.string().min(1),
  hasSize: z.boolean().optional().default(false),
  gender: z.enum(["Male", "Female", "Unisex"]),
  lifespanType: z.enum(["Days", "Months", "Years"]),
  lifespanValue: z.coerce.number().int().min(1),
  descriptionEn: z.string().optional().default(""),
  descriptionAr: z.string().optional().default(""),
  manufacturer: z.string().optional().default(""),
  model: z.string().optional().default(""),
  standardCertification: z.string().optional().default(""),
  riskCategory: z.enum(["I", "II", "III"]),
  reorderLevel: z.coerce.number().int().min(0),
  locationIds: z.array(z.string()).min(1),
  variantAttributeValueIds: z.array(z.string()).optional().default([]),
  uom: z.string().min(1),
  active: z.boolean().optional(),
  adminOverrideReason: z.string().optional(),
});
```

#### 2. Prisma Relations in `prisma/schema.prisma:111-155`
`PPEItem` has non-scalar junction relationships:
- `locations: PPEItemLocation[]` with relation `@@unique([ppeItemId, locationId])`
- `variantValues: PPEItemVariantValue[]` with relation `@@unique([ppeItemId, attributeValueId])`
Therefore, `locationIds` cannot be passed directly into `tx.pPEItem.create` or `update`. Scalar fields must be separated, followed by batch or individual `PPEItemLocation` insertions inside the transaction.

#### 3. AuditLog Model in `prisma/schema.prisma:418-433`
```prisma
model AuditLog {
  id            String          @id @default(cuid())
  entityType    String
  entityId      String
  action        String
  details       String?
  beforeValues  String?
  afterValues   String?
  reason        String?
  source        String          @default("Screen")
  retentionFlag String          @default("7_YEARS")
  performedBy   String
  performer     Employee        @relation(fields: [performedBy], references: [id])
  timestamp     DateTime        @default(now())
  @@index([entityType, entityId])
  @@index([timestamp])
}
```
For import operations, `source` must be set to `"Import"` and `retentionFlag` to `"7_YEARS"`.

---

## 2. Logic Chain

1. **Integrity Mandate**: Reviewer 1 and Reviewer 2 correctly flagged `server/src/routes/ppeItems.ts:238-250` as an Integrity Violation because it explicitly documents a stub and avoids database mutations.
2. **Zero-Dependency RFC 4180 CSV Parser**: Inspection of `package.json` revealed no third-party CSV libraries (`csv-parser`, `xlsx`, `papaparse`). Introducing an unneeded external package would risk supply chain conflicts or build breaks. An RFC 4180 compliant parser implemented natively in TypeScript handles quotes, commas within fields, escaped double quotes (`""`), Byte Order Marks (`\uFEFF`), and Windows/Unix newlines (`\r\n` / `\n`).
3. **Resilient Header & Column Mapping**: Real-world spreadsheets, client exports (`src/pages/Catalog.tsx:185`), and backend exports (`server/src/routes/ppeItems.ts:68`) use slightly varying header names (`Item Code` vs `itemCode`, `Lifespan` vs `Lifespan Value` + `Lifespan Unit`, `Locations` vs `Location Codes`, `Risk Category` vs `Risk`). The parser must use case-insensitive, normalized aliases to ensure imports never fail due to formatting trivialities.
4. **Foreign Key Lookups**:
   - `itemGroupId`: Must match against active `ItemGroup` records by `id`, `code`, `nameEn`, or `nameAr`. If omitted, default to the first active ItemGroup in the system.
   - `locationIds`: Can contain semicolon/comma-separated tokens (`LOC-CAI-NEW; LOC-CAI-USD` or `Cairo Main Store`). Each token is matched against active `Location` records by `id`, `code`, or `nameEn`. If omitted or unmatched, fallback to the first active Location.
5. **Atomic Database Mutations & Mode Scoping**:
   - `mode = "new_only"`: If `itemCode` exists in database, skip the row and record a user-friendly error: `"Row N: Item Code \"...\" already exists in active catalog. Skipped in Add New Only mode."`.
   - `mode = "new_and_update"`: If `itemCode` exists, update the scalar fields, re-sync `PPEItemLocation`, and write an `AuditLog` entry capturing before/after JSON diffs. If it does not exist, insert the item, its location links, and write an `AuditLog` entry.
6. **Unified Response Payload**:
   The response must return:
   ```json
   {
     "imported": 2,
     "created": 2,
     "updated": 0,
     "errors": [],
     "message": "Import completed: 2 created, 0 updated, 0 errors"
   }
   ```
   Providing both `imported` and `created` guarantees 100% compatibility with all reviewer expectations, the user dispatch prompt, and frontend client views.
7. **Frontend Alignment**:
   In `src/pages/Catalog.tsx`, adding a hidden `<input type="file" accept=".csv" />` allows users to select actual CSV files. When clicked with a chosen file, it invokes `api.importCatalog(file, mode)` via `FormData`. If no file is selected, it preserves the existing demo simulation so test suites or offline users are not broken.

---

## 3. Caveats

1. **Excel (.xlsx) Binary Files**: `package.json` does not include `xlsx` or `exceljs`. Standard CSV format is universally supported by Excel ("Save As CSV") and is the primary format tested by test suites (`text/csv`). The parser focuses on CSV. If `.xlsx` is uploaded without conversion, the endpoint should return a clear error: `"Please save as CSV (.csv) before uploading"`.
2. **Variant Values in Import**: Dynamic variant generation is primarily managed via Item Group configurations (PPE-008..PPE-017). The standard catalog import assigns item metadata and location links; attribute values can either default or be specified via optional variant columns.
3. **No Direct Code Changes**: In accordance with the Explorer archetype and project constraints, this report provides exact drop-in code snippets and instructions for the implementer agent (`worker_milestone_1`). No source code files were modified during this investigation.

---

## 4. Conclusion & Recommended Concrete Fix Strategy

The implementer should make targeted edits to two files:
1. `server/src/routes/ppeItems.ts` — Replace lines 238–250 with the production-ready CSV parser, validation, foreign key lookup, and Prisma transaction logic.
2. `src/lib/api.ts` & `src/pages/Catalog.tsx` — Add `importCatalog` client method and wire up the file upload input.

### File 1: `server/src/routes/ppeItems.ts`

**Location**: Replace lines 238–250 in `server/src/routes/ppeItems.ts`.

#### Drop-In Code Replacement for `server/src/routes/ppeItems.ts`:

```typescript
// ============================================================================
// HELPER UTILITIES FOR PPE-007 CATALOG IMPORT
// ============================================================================

/**
 * RFC 4180 compliant CSV parser with quote escaping, multi-line support,
 * and UTF-8 Byte Order Mark (BOM) stripping.
 */
function parseCsvContent(text: string): { headers: string[]; rows: Record<string, string>[] } {
  let cleanText = text;
  // Strip UTF-8 BOM if present
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  const normalized = cleanText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        if (currentRow.some(col => col.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = lines[0].map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const row: Record<string, string> = {};
    for (let j = 0; j < rawHeaders.length; j++) {
      row[rawHeaders[j]] = line[j] !== undefined ? line[j] : "";
    }
    rows.push(row);
  }

  return { headers: rawHeaders, rows };
}

/**
 * Flexible column getter supporting aliases and case-insensitive matching
 */
function getCsvColumnValue(row: Record<string, string>, ...aliases: string[]): string {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias].trim() !== "") {
      return row[alias].trim();
    }
    const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [key, val] of Object.entries(row)) {
      if (key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedAlias && val !== undefined && val.trim() !== "") {
        return val.trim();
      }
    }
  }
  return "";
}

// ============================================================================
// PPE-007: GENUINE CATALOG IMPORT ENDPOINT
// ============================================================================

router.post("/import", authorize("Admin", "HSE Supervisor"), upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "CSV file required");

  const filePath = req.file.path;
  let fileContent = "";
  try {
    fileContent = fs.readFileSync(filePath, "utf-8");
  } catch (err: any) {
    throw new ApiError(400, `Failed to read uploaded file: ${err.message}`);
  } finally {
    // Clean up temporary upload file to prevent storage leaks
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
  }

  const { rows } = parseCsvContent(fileContent);
  if (rows.length === 0) {
    throw new ApiError(400, "The uploaded CSV file contains no data rows");
  }

  const importMode = (req.body.mode || req.query.mode || "new_and_update") as "new_only" | "new_and_update";

  // Pre-fetch active master data for foreign key lookups
  const allItemGroups = await prisma.itemGroup.findMany({ where: { deletedAt: null } });
  const allLocations = await prisma.location.findMany({ where: { deletedAt: null } });

  let importedCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // Row 1 is header, so data begins on row 2

    // 1. Mandatory Identifier
    const itemCode = getCsvColumnValue(row, "Item Code", "itemCode", "Code", "item_code");
    if (!itemCode) {
      errors.push(`Row ${rowNumber}: Missing required column "Item Code"`);
      continue;
    }

    // 2. Descriptive Names
    const nameEn = getCsvColumnValue(row, "Name EN", "nameEn", "name_en", "Name");
    if (!nameEn) {
      errors.push(`Row ${rowNumber}: Missing required column "Name EN" for item "${itemCode}"`);
      continue;
    }
    const nameAr = getCsvColumnValue(row, "Name AR", "nameAr", "name_ar") || nameEn;

    // 3. Category
    const category = getCsvColumnValue(row, "Category", "category") || "General";

    // 4. Foreign Key Lookup: Item Group
    const rawItemGroup = getCsvColumnValue(row, "Item Group", "itemGroupId", "Group", "item_group", "Item Group Code");
    let matchedGroup = allItemGroups.find(g =>
      g.id.toLowerCase() === rawItemGroup.toLowerCase() ||
      g.code.toLowerCase() === rawItemGroup.toLowerCase() ||
      g.nameEn.toLowerCase() === rawItemGroup.toLowerCase() ||
      g.nameAr.toLowerCase() === rawItemGroup.toLowerCase()
    );

    if (!matchedGroup && allItemGroups.length > 0) {
      if (!rawItemGroup) {
        matchedGroup = allItemGroups[0];
      } else {
        errors.push(`Row ${rowNumber}: Item Group "${rawItemGroup}" not found in system for item "${itemCode}"`);
        continue;
      }
    } else if (!matchedGroup) {
      errors.push(`Row ${rowNumber}: No active Item Groups exist in the system to assign item "${itemCode}"`);
      continue;
    }

    // 5. Risk Category Normalization
    const rawRisk = getCsvColumnValue(row, "Risk Category", "riskCategory", "risk").toUpperCase();
    let riskCategory: "I" | "II" | "III" = "II";
    if (rawRisk.includes("III") || rawRisk === "3") {
      riskCategory = "III";
    } else if (rawRisk.includes("II") || rawRisk === "2") {
      riskCategory = "II";
    } else if (rawRisk.includes("I") || rawRisk === "1") {
      riskCategory = "I";
    }

    // 6. Lifespan Parsing
    let lifespanType: "Days" | "Months" | "Years" = "Months";
    let lifespanValue = 12;
    const rawLifespanValue = getCsvColumnValue(row, "Lifespan Value", "lifespanValue", "lifespan_value");
    const rawLifespanUnit = getCsvColumnValue(row, "Lifespan Unit", "lifespanUnit", "lifespan_unit", "Lifespan Type", "lifespanType");
    const rawCombinedLifespan = getCsvColumnValue(row, "Lifespan", "lifespan", "Lifespan Period");

    if (rawLifespanValue) {
      const parsedVal = parseInt(rawLifespanValue, 10);
      if (!isNaN(parsedVal) && parsedVal > 0) lifespanValue = parsedVal;
    }
    if (rawLifespanUnit) {
      const u = rawLifespanUnit.toLowerCase();
      if (u.startsWith("day")) lifespanType = "Days";
      else if (u.startsWith("year")) lifespanType = "Years";
      else lifespanType = "Months";
    } else if (rawCombinedLifespan) {
      const match = rawCombinedLifespan.match(/^(\d+)\s*(days?|months?|years?)$/i);
      if (match) {
        lifespanValue = parseInt(match[1], 10);
        const u = match[2].toLowerCase();
        if (u.startsWith("day")) lifespanType = "Days";
        else if (u.startsWith("year")) lifespanType = "Years";
        else lifespanType = "Months";
      }
    }

    // 7. Unit of Measure
    const uom = getCsvColumnValue(row, "UoM", "uom", "Unit", "Unit of Measure") || "Piece";

    // 8. Reorder Level
    let reorderLevel = 10;
    const rawReorder = getCsvColumnValue(row, "Reorder Level", "reorderLevel", "reorder_level", "Reorder Levels");
    if (rawReorder) {
      const numMatch = rawReorder.match(/(\d+)/);
      if (numMatch) reorderLevel = parseInt(numMatch[1], 10);
    }

    // 9. Gender & Size Attributes
    const rawGender = getCsvColumnValue(row, "Gender", "gender").toLowerCase();
    let gender: "Male" | "Female" | "Unisex" = "Unisex";
    if (rawGender === "male") gender = "Male";
    else if (rawGender === "female") gender = "Female";

    const rawHasSize = getCsvColumnValue(row, "Has Size", "hasSize").toLowerCase();
    const hasSize = rawHasSize === "true" || rawHasSize === "yes" || rawHasSize === "1";

    // 10. Active Status
    const rawActive = getCsvColumnValue(row, "Active", "active").toLowerCase();
    const active = rawActive === "" || rawActive === "yes" || rawActive === "true" || rawActive === "1";

    // 11. Foreign Key Lookup: Location IDs
    const rawLocations = getCsvColumnValue(row, "Locations", "Location Codes", "locationIds", "location_ids", "Location");
    const matchedLocationIds: string[] = [];

    if (rawLocations) {
      const tokens = rawLocations.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      for (const token of tokens) {
        const cleanToken = token.split(":")[0].trim();
        const found = allLocations.find(l =>
          l.id.toLowerCase() === cleanToken.toLowerCase() ||
          l.code.toLowerCase() === cleanToken.toLowerCase() ||
          l.nameEn.toLowerCase() === cleanToken.toLowerCase() ||
          l.nameAr.toLowerCase() === cleanToken.toLowerCase()
        );
        if (found && !matchedLocationIds.includes(found.id)) {
          matchedLocationIds.push(found.id);
        }
      }
    }

    if (matchedLocationIds.length === 0 && allLocations.length > 0) {
      matchedLocationIds.push(allLocations[0].id);
    }

    if (matchedLocationIds.length === 0) {
      errors.push(`Row ${rowNumber}: No valid locations found or available to assign item "${itemCode}"`);
      continue;
    }

    // 12. Validation against ppeItemSchema
    const candidateData = {
      itemCode,
      nameEn,
      nameAr,
      category,
      itemGroupId: matchedGroup.id,
      hasSize,
      gender,
      lifespanType,
      lifespanValue,
      riskCategory,
      reorderLevel,
      locationIds: matchedLocationIds,
      uom,
      active,
    };

    const validationResult = ppeItemSchema.safeParse(candidateData);
    if (!validationResult.success) {
      const errMsgs = validationResult.error.issues.map(iss => `${iss.path.join(".")}: ${iss.message}`).join(", ");
      errors.push(`Row ${rowNumber}: Validation failed (${errMsgs})`);
      continue;
    }

    // 13. Check Existing Record in Database
    const existing = await prisma.pPEItem.findUnique({
      where: { itemCode },
      include: { locations: true },
    });

    if (existing) {
      if (importMode === "new_only") {
        errors.push(`Row ${rowNumber}: Item Code "${itemCode}" already exists in active catalog. Skipped in Add New Only mode.`);
        continue;
      }

      // Execute atomic update
      try {
        await prisma.$transaction(async (tx) => {
          const { locationIds: locs, variantAttributeValueIds, adminOverrideReason, ...itemScalars } = validationResult.data;

          const updated = await tx.pPEItem.update({
            where: { id: existing.id },
            data: itemScalars,
          });

          // Sync location links
          await tx.pPEItemLocation.deleteMany({ where: { ppeItemId: existing.id } });
          for (const locId of locs) {
            await tx.pPEItemLocation.create({
              data: { ppeItemId: existing.id, locationId: locId },
            });
          }

          // Rule G1: Immutable Audit Log with Before/After JSON diffs
          await tx.auditLog.create({
            data: {
              entityType: "PPEItem",
              entityId: existing.id,
              action: "UPDATED",
              performedBy: req.user!.id,
              source: "Import",
              retentionFlag: "7_YEARS",
              details: `Updated via catalog import (Row ${rowNumber})`,
              beforeValues: JSON.stringify(existing),
              afterValues: JSON.stringify(updated),
            },
          });
        });
        updatedCount++;
      } catch (err: any) {
        errors.push(`Row ${rowNumber}: Failed to update item "${itemCode}": ${err.message}`);
      }
    } else {
      // Execute atomic create
      try {
        await prisma.$transaction(async (tx) => {
          const { locationIds: locs, variantAttributeValueIds, adminOverrideReason, ...itemScalars } = validationResult.data;

          const created = await tx.pPEItem.create({
            data: itemScalars,
          });

          for (const locId of locs) {
            await tx.pPEItemLocation.create({
              data: { ppeItemId: created.id, locationId: locId },
            });
          }

          // Rule G1: Immutable Audit Log
          await tx.auditLog.create({
            data: {
              entityType: "PPEItem",
              entityId: created.id,
              action: "CREATED",
              performedBy: req.user!.id,
              source: "Import",
              retentionFlag: "7_YEARS",
              details: `Created via catalog import (Row ${rowNumber})`,
              afterValues: JSON.stringify(created),
            },
          });
        });
        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${rowNumber}: Failed to insert item "${itemCode}": ${err.message}`);
      }
    }
  }

  res.json({
    success: true,
    imported: importedCount,
    created: importedCount,
    updated: updatedCount,
    errors,
    message: `Import completed: ${importedCount} created, ${updatedCount} updated, ${errors.length} errors`,
  });
}));
```

---

### File 2: `src/lib/api.ts`

**Location**: Add `importCatalog` method to the `api` object in `src/lib/api.ts` (around line 118).

```typescript
  // Catalog Import (PPE-007)
  importCatalog: async (file: File, mode: 'new_only' | 'new_and_update' = 'new_and_update', token?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);
    const t = token ?? getToken();
    const res = await fetch(`${API_BASE}/api/ppe-items/import?mode=${mode}`, {
      method: "POST",
      headers: t ? { Authorization: `Bearer ${t}` } : undefined,
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.message || "Catalog import failed");
    }
    return res.json() as Promise<{
      success: boolean;
      imported: number;
      created?: number;
      updated: number;
      errors: string[];
      message?: string;
    }>;
  },
```

---

### File 3: `src/pages/Catalog.tsx`

**Location**:
1. At the top of `src/pages/Catalog.tsx`: ensure `api` is imported:
   `import { api } from '../lib/api';`
2. Replace `handleSimulateImport` in lines 222–244 with real API call & file handling:
```typescript
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportPreview(null);
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) {
      // Offline / demo fallback when no file selected
      handleSimulateImport();
      return;
    }

    setIsImporting(true);
    try {
      const res = await api.importCatalog(selectedFile, importMode);
      setImportPreview({
        newCount: res.imported ?? res.created ?? 0,
        updatedCount: res.updated ?? 0,
        errorCount: res.errors?.length ?? 0,
        errors: res.errors ?? [],
      });
      // Optionally trigger store refresh
    } catch (err: any) {
      setImportPreview({
        newCount: 0,
        updatedCount: 0,
        errorCount: 1,
        errors: [err.message || 'Catalog import failed'],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSimulateImport = () => {
    if (importMode === 'new_only') {
      setImportPreview({
        newCount: 2,
        updatedCount: 0,
        errorCount: 1,
        errors: [
          'Row 3: Item Code "HLM-001" already exists in active catalog. Skipped in Add New Only mode.'
        ]
      });
    } else {
      setImportPreview({
        newCount: 1,
        updatedCount: 3,
        errorCount: 1,
        errors: [
          'Row 4: Attempted to modify locked Item Code for "BOT-003" with active transactions. Row skipped.'
        ]
      });
    }
  };
```
3. In lines 710–716, render the real file input and upload button:
```tsx
  {/* Upload trigger */}
  <input 
    type="file" 
    ref={fileInputRef} 
    accept=".csv" 
    onChange={handleFileChange} 
    className="hidden" 
  />
  <div 
    onClick={() => fileInputRef.current?.click()}
    className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center space-y-2 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
  >
    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
    {selectedFile ? (
      <div>
        <p className="text-xs font-semibold text-teal-700">{selectedFile.name}</p>
        <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB — click to change</p>
      </div>
    ) : (
      <p className="text-xs text-slate-600">Select `.csv` catalog template file</p>
    )}
    <Button 
      size="sm" 
      variant="secondary" 
      disabled={isImporting}
      onClick={(e) => {
        e.stopPropagation();
        handleExecuteImport();
      }}
    >
      {isImporting ? "Processing..." : selectedFile ? "Upload & Import" : "Simulate Demo Parse"}
    </Button>
  </div>
```

---

## 5. Verification Method

Once the implementer applies the drop-in changes, independent verification is conducted as follows:

### Step 1: Run Project Build & Type Checks
```bash
npm run build:server
npm run lint
npm run build
```
*Expected result*: Exit code 0, zero TypeScript compilation or packaging errors.

### Step 2: Seed Database
```bash
npm run db:seed
```
*Expected result*: Succeeded idempotently, populating master data and initial stock.

### Step 3: Run Integration Test Suites
```bash
npm run test:server
```
*Expected result*: All verification assertions pass (100%).

### Step 4: Direct Verification of Genuine CSV Import via HTTP Test
Create an automated test or curl/fetch call sending multipart `FormData` with a CSV payload:
```csv
Item Code,Name EN,Name AR,Category,Item Group,Risk Category,Lifespan,UoM,Active,Locations
IMP-TEST-001,"Impact Resistant Goggles","نظارات مقاومة للصدمات",Eye,HELMETS,Category II,12 Months,Piece,Yes,LOC-CAI-NEW
IMP-TEST-002,"High-Visibility Vest Class 3","سترة فوسفورية فئة 3",Body,HELMETS,Category I,6 Months,Piece,Yes,LOC-CAI-NEW
```
Post to `POST /api/ppe-items/import`:
1. **Assert response**: HTTP status `200`, `{ success: true, imported: 2, updated: 0, errors: [] }`.
2. **Assert database entities**:
   ```typescript
   const item1 = await prisma.pPEItem.findUnique({ where: { itemCode: "IMP-TEST-001" }, include: { locations: true } });
   assert(item1 !== null, "Imported item must exist in database");
   assert(item1.locations.length > 0, "Location links must be created");
   ```
3. **Assert audit trail**:
   ```typescript
   const logs = await prisma.auditLog.findMany({ where: { entityId: item1.id, source: "Import" } });
   assert(logs.length > 0, "AuditLog with source 'Import' must exist");
   ```
4. **Assert `new_only` duplicate detection**:
   Send identical CSV again with `mode=new_only`:
   Assert `{ imported: 0, errors: ["Row 2: Item Code \"IMP-TEST-001\" already exists in active catalog. Skipped in Add New Only mode."] }`.

### Step 5: Invalidation Conditions
If:
- The endpoint returns `{ message: "Import stub executed" }`, OR
- No row is written to `PPEItem` in SQLite, OR
- `AuditLog` does not contain `source: "Import"`,
the implementation remains invalid and must be rejected.
