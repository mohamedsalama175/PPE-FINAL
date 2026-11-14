import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate } from "../middleware/validate.js";
import { ppeItemSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";
import multer from "multer";
import fs from "fs";
const router = Router();
router.use(authenticate);
const uploadDir = "uploads/ppe";
if (!fs.existsSync(uploadDir))
    fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_")),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
router.get("/", asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const search = req.query.search?.toLowerCase();
    const includeDeleted = req.query.includeDeleted === "true";
    const activeFilter = req.query.active;
    const groupFilter = req.query.itemGroupId;
    const categoryFilter = req.query.category;
    const where = {};
    if (!includeDeleted)
        where.deletedAt = null;
    if (activeFilter === "true")
        where.active = true;
    if (activeFilter === "false")
        where.active = false;
    if (groupFilter)
        where.itemGroupId = groupFilter;
    if (categoryFilter)
        where.category = categoryFilter;
    if (search) {
        where.OR = [
            { itemCode: { contains: search } },
            { nameEn: { contains: search } },
            { nameAr: { contains: search } },
        ];
    }
    const total = await prisma.pPEItem.count({ where });
    const data = await prisma.pPEItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            itemGroup: true,
            locations: { include: { location: true } },
            variantValues: { include: { attributeValue: true } },
        },
    });
    const mapped = data.map(p => ({
        ...p,
        locationIds: p.locations.map(l => l.locationId),
        variantAttributeValueIds: p.variantValues.map(v => v.attributeValueId),
    }));
    res.json({ data: mapped, meta: paginateMeta(total, page, limit) });
}));
router.get("/export", asyncHandler(async (req, res) => {
    const where = { deletedAt: null };
    const data = await prisma.pPEItem.findMany({ where, orderBy: { itemCode: "asc" } });
    const headers = ["Item Code", "Name EN", "Name AR", "Category", "Risk Category", "UoM", "Active"];
    const rows = data.map(d => [d.itemCode, `"${d.nameEn.replace(/"/g, '""')}"`, `"${d.nameAr.replace(/"/g, '""')}"`, d.category, d.riskCategory, d.uom, d.active ? "Yes" : "No"].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=ppe_catalog_export.csv");
    res.send(csv);
}));
router.get("/:id", asyncHandler(async (req, res) => {
    const p = await prisma.pPEItem.findUnique({
        where: { id: req.params.id },
        include: { locations: true, variantValues: true, itemGroup: true },
    });
    if (!p)
        throw new ApiError(404, "PPE Item not found");
    res.json({
        ...p,
        locationIds: p.locations.map(l => l.locationId),
        variantAttributeValueIds: p.variantValues.map(v => v.attributeValueId),
    });
}));
router.post("/", authorize("Admin", "HSE Supervisor"), validate(ppeItemSchema), asyncHandler(async (req, res) => {
    const { locationIds, variantAttributeValueIds, ...rest } = req.body;
    const item = await prisma.pPEItem.create({ data: rest });
    for (const locId of locationIds) {
        await prisma.pPEItemLocation.create({ data: { ppeItemId: item.id, locationId: locId } });
    }
    for (const valId of variantAttributeValueIds || []) {
        await prisma.pPEItemVariantValue.create({ data: { ppeItemId: item.id, attributeValueId: valId } });
    }
    await prisma.auditLog.create({
        data: {
            entityType: "PPEItem",
            entityId: item.id,
            action: "CREATED",
            performedBy: req.user.id,
            afterValues: JSON.stringify(item),
        },
    });
    res.status(201).json(item);
}));
router.put("/:id", authorize("Admin", "HSE Supervisor"), validate(ppeItemSchema), asyncHandler(async (req, res) => {
    const existing = await prisma.pPEItem.findUnique({ where: { id: req.params.id } });
    if (!existing)
        throw new ApiError(404, "PPE item not found");
    const { locationIds, variantAttributeValueIds, ...rest } = req.body;
    // PPE-002: Item Code locked after transactions exist
    if (rest.itemCode && rest.itemCode !== existing.itemCode) {
        const [hasStock, hasBatches, hasIssuances, hasAdjustments, hasMovements] = await Promise.all([
            prisma.stockBalance.count({ where: { ppeItemId: req.params.id, quantityOnHand: { gt: 0 } } }),
            prisma.batch.count({ where: { ppeItemId: req.params.id } }),
            prisma.issuance.count({ where: { ppeItemId: req.params.id } }),
            prisma.stockAdjustment.count({ where: { ppeItemId: req.params.id } }),
            prisma.stockMovement.count({ where: { ppeItemId: req.params.id } }),
        ]);
        const hasTransactions = hasStock > 0 || hasBatches > 0 || hasIssuances > 0 || hasAdjustments > 0 || hasMovements > 0;
        if (hasTransactions) {
            throw new ApiError(400, "Item code is locked and cannot be changed once transactions exist");
        }
    }
    const item = await prisma.pPEItem.update({ where: { id: req.params.id }, data: rest });
    if (locationIds) {
        await prisma.pPEItemLocation.deleteMany({ where: { ppeItemId: req.params.id } });
        for (const locId of locationIds) {
            await prisma.pPEItemLocation.create({ data: { ppeItemId: item.id, locationId: locId } });
        }
    }
    if (variantAttributeValueIds) {
        await prisma.pPEItemVariantValue.deleteMany({ where: { ppeItemId: req.params.id } });
        for (const valId of variantAttributeValueIds || []) {
            await prisma.pPEItemVariantValue.create({ data: { ppeItemId: item.id, attributeValueId: valId } });
        }
    }
    await prisma.auditLog.create({
        data: {
            entityType: "PPEItem",
            entityId: item.id,
            action: "UPDATED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(existing),
            afterValues: JSON.stringify(item),
        },
    });
    res.json(item);
}));
async function checkItemInUse(itemId) {
    const activeIssuances = await prisma.issuance.count({
        where: { ppeItemId: itemId, status: { in: ["issued", "Active"] } },
    });
    const activeStock = await prisma.stockBalance.count({
        where: { ppeItemId: itemId, quantityOnHand: { gt: 0 } },
    });
    const activeKits = await prisma.kitItem.count({
        where: { ppeItemId: itemId, kit: { deletedAt: null, active: true } },
    });
    const inUse = activeIssuances > 0 || activeStock > 0 || activeKits > 0;
    return { inUse, activeIssuances, activeStock, activeKits };
}
router.get("/:id/in-use", asyncHandler(async (req, res) => {
    const check = await checkItemInUse(req.params.id);
    res.json({
        inUse: check.inUse,
        activeIssuanceCount: check.activeIssuances,
        activeStockCount: check.activeStock,
        activeKitCount: check.activeKits,
    });
}));
router.patch("/:id/active", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
    const { active, adminOverrideReason } = req.body;
    if (typeof active !== "boolean")
        throw new ApiError(400, "active boolean required");
    if (!active) {
        const inUseCheck = await checkItemInUse(req.params.id);
        if (inUseCheck.inUse) {
            const isAdmin = req.user.role === "Admin" || req.user.role.replace(/_/g, " ") === "Admin";
            if (!isAdmin) {
                throw new ApiError(400, "Cannot deactivate in-use PPE item without Admin override");
            }
            if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
                throw new ApiError(400, "Admin override reason is required to deactivate in-use PPE item");
            }
            const existing = await prisma.pPEItem.findUnique({ where: { id: req.params.id } });
            const item = await prisma.pPEItem.update({ where: { id: req.params.id }, data: { active } });
            await prisma.auditLog.create({
                data: {
                    entityType: "PPEItem",
                    entityId: item.id,
                    action: "OVERRIDE_DEACTIVATE",
                    performedBy: req.user.id,
                    reason: adminOverrideReason.trim(),
                    beforeValues: JSON.stringify(existing),
                    afterValues: JSON.stringify(item),
                },
            });
            return res.json(item);
        }
    }
    const existing = await prisma.pPEItem.findUnique({ where: { id: req.params.id } });
    const item = await prisma.pPEItem.update({ where: { id: req.params.id }, data: { active } });
    await prisma.auditLog.create({
        data: {
            entityType: "PPEItem",
            entityId: item.id,
            action: active ? "ACTIVATED" : "DEACTIVATED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(existing),
            afterValues: JSON.stringify(item),
        },
    });
    res.json(item);
}));
router.delete("/:id", authorize("Admin", "HSE Supervisor"), asyncHandler(async (req, res) => {
    const { adminOverrideReason } = req.body || {};
    const inUseCheck = await checkItemInUse(req.params.id);
    if (inUseCheck.inUse) {
        const isAdmin = req.user.role === "Admin" || req.user.role.replace(/_/g, " ") === "Admin";
        if (!isAdmin) {
            throw new ApiError(400, "Cannot delete in-use PPE item without Admin override");
        }
        if (!adminOverrideReason || typeof adminOverrideReason !== "string" || !adminOverrideReason.trim()) {
            throw new ApiError(400, "Admin override reason is required to delete in-use PPE item");
        }
        const existing = await prisma.pPEItem.findUnique({ where: { id: req.params.id } });
        await prisma.pPEItem.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
        await prisma.auditLog.create({
            data: {
                entityType: "PPEItem",
                entityId: req.params.id,
                action: "OVERRIDE_DELETE",
                performedBy: req.user.id,
                reason: adminOverrideReason.trim(),
                beforeValues: JSON.stringify(existing),
            },
        });
        return res.json({ message: "Soft deleted with Admin override" });
    }
    const existing = await prisma.pPEItem.findUnique({ where: { id: req.params.id } });
    await prisma.pPEItem.update({ where: { id: req.params.id }, data: { active: false, deletedAt: new Date() } });
    await prisma.auditLog.create({
        data: {
            entityType: "PPEItem",
            entityId: req.params.id,
            action: "SOFT_DELETED",
            performedBy: req.user.id,
            beforeValues: JSON.stringify(existing),
        },
    });
    res.json({ message: "Soft deleted" });
}));
router.post("/:id/restore", authorize("Admin"), asyncHandler(async (req, res) => {
    const existing = await prisma.pPEItem.findUnique({ where: { id: req.params.id } });
    const item = await prisma.pPEItem.update({ where: { id: req.params.id }, data: { active: true, deletedAt: null } });
    await prisma.auditLog.create({
        data: {
            entityType: "PPEItem",
            entityId: item.id,
            action: "RESTORED",
            performedBy: req.user.id,
            beforeValues: existing ? JSON.stringify(existing) : undefined,
            afterValues: JSON.stringify(item),
        },
    });
    res.json(item);
}));
router.post("/:id/photo", authorize("Admin", "HSE Supervisor"), upload.single("photo"), asyncHandler(async (req, res) => {
    if (!req.file)
        throw new ApiError(400, "Photo file required");
    const url = `/${uploadDir}/${req.file.filename}`;
    const item = await prisma.pPEItem.update({ where: { id: req.params.id }, data: { photoUrl: url } });
    res.json({ photoUrl: url, item });
}));
// ============================================================================
// HELPER UTILITIES FOR PPE-007 CATALOG IMPORT
// ============================================================================
/**
 * RFC 4180 compliant CSV parser with quote escaping, multi-line support,
 * and UTF-8 Byte Order Mark (BOM) stripping.
 */
function parseCsvContent(text) {
    let cleanText = text;
    // Strip UTF-8 BOM if present
    if (cleanText.charCodeAt(0) === 0xfeff) {
        cleanText = cleanText.slice(1);
    }
    const lines = [];
    let currentRow = [];
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
            }
            else if (char === '"') {
                inQuotes = false;
            }
            else {
                currentField += char;
            }
        }
        else {
            if (char === '"') {
                inQuotes = true;
            }
            else if (char === ",") {
                currentRow.push(currentField.trim());
                currentField = "";
            }
            else if (char === "\n") {
                currentRow.push(currentField.trim());
                if (currentRow.some(col => col.length > 0)) {
                    lines.push(currentRow);
                }
                currentRow = [];
                currentField = "";
            }
            else {
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
    if (lines.length === 0)
        return { headers: [], rows: [] };
    const rawHeaders = lines[0].map(h => h.trim().replace(/^"|"$/g, ""));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const row = {};
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
function getCsvColumnValue(row, ...aliases) {
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
    if (!req.file)
        throw new ApiError(400, "CSV file required");
    const filePath = req.file.path;
    let fileContent = "";
    try {
        fileContent = fs.readFileSync(filePath, "utf-8");
    }
    catch (err) {
        throw new ApiError(400, `Failed to read uploaded file: ${err.message}`);
    }
    finally {
        // Clean up temporary upload file to prevent storage leaks
        try {
            if (fs.existsSync(filePath))
                fs.unlinkSync(filePath);
        }
        catch { }
    }
    const { rows } = parseCsvContent(fileContent);
    if (rows.length === 0) {
        throw new ApiError(400, "The uploaded CSV file contains no data rows");
    }
    const importMode = (req.body.mode || req.query.mode || "new_and_update");
    // Pre-fetch active master data for foreign key lookups
    const allItemGroups = await prisma.itemGroup.findMany({ where: { deletedAt: null } });
    const allLocations = await prisma.location.findMany({ where: { deletedAt: null } });
    let importedCount = 0;
    let updatedCount = 0;
    const errors = [];
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
        let matchedGroup = allItemGroups.find(g => g.id.toLowerCase() === rawItemGroup.toLowerCase() ||
            g.code.toLowerCase() === rawItemGroup.toLowerCase() ||
            g.nameEn.toLowerCase() === rawItemGroup.toLowerCase() ||
            g.nameAr.toLowerCase() === rawItemGroup.toLowerCase());
        if (!matchedGroup && allItemGroups.length > 0) {
            if (!rawItemGroup) {
                matchedGroup = allItemGroups[0];
            }
            else {
                errors.push(`Row ${rowNumber}: Item Group "${rawItemGroup}" not found in system for item "${itemCode}"`);
                continue;
            }
        }
        else if (!matchedGroup) {
            errors.push(`Row ${rowNumber}: No active Item Groups exist in the system to assign item "${itemCode}"`);
            continue;
        }
        // 5. Risk Category Normalization
        const rawRisk = getCsvColumnValue(row, "Risk Category", "riskCategory", "risk").toUpperCase();
        let riskCategory = "II";
        if (rawRisk.includes("III") || rawRisk === "3") {
            riskCategory = "III";
        }
        else if (rawRisk.includes("II") || rawRisk === "2") {
            riskCategory = "II";
        }
        else if (rawRisk.includes("I") || rawRisk === "1") {
            riskCategory = "I";
        }
        // 6. Lifespan Parsing
        let lifespanType = "Months";
        let lifespanValue = 12;
        const rawLifespanValue = getCsvColumnValue(row, "Lifespan Value", "lifespanValue", "lifespan_value");
        const rawLifespanUnit = getCsvColumnValue(row, "Lifespan Unit", "lifespanUnit", "lifespan_unit", "Lifespan Type", "lifespanType");
        const rawCombinedLifespan = getCsvColumnValue(row, "Lifespan", "lifespan", "Lifespan Period");
        if (rawLifespanValue) {
            const parsedVal = parseInt(rawLifespanValue, 10);
            if (!isNaN(parsedVal) && parsedVal > 0)
                lifespanValue = parsedVal;
        }
        if (rawLifespanUnit) {
            const u = rawLifespanUnit.toLowerCase();
            if (u.startsWith("day"))
                lifespanType = "Days";
            else if (u.startsWith("year"))
                lifespanType = "Years";
            else
                lifespanType = "Months";
        }
        else if (rawCombinedLifespan) {
            const match = rawCombinedLifespan.match(/^(\d+)\s*(days?|months?|years?)$/i);
            if (match) {
                lifespanValue = parseInt(match[1], 10);
                const u = match[2].toLowerCase();
                if (u.startsWith("day"))
                    lifespanType = "Days";
                else if (u.startsWith("year"))
                    lifespanType = "Years";
                else
                    lifespanType = "Months";
            }
        }
        // 7. Unit of Measure
        const uom = getCsvColumnValue(row, "UoM", "uom", "Unit", "Unit of Measure") || "Piece";
        // 8. Reorder Level
        let reorderLevel = 10;
        const rawReorder = getCsvColumnValue(row, "Reorder Level", "reorderLevel", "reorder_level", "Reorder Levels");
        if (rawReorder) {
            const numMatch = rawReorder.match(/(\d+)/);
            if (numMatch)
                reorderLevel = parseInt(numMatch[1], 10);
        }
        // 9. Gender & Size Attributes
        const rawGender = getCsvColumnValue(row, "Gender", "gender").toLowerCase();
        let gender = "Unisex";
        if (rawGender === "male")
            gender = "Male";
        else if (rawGender === "female")
            gender = "Female";
        const rawHasSize = getCsvColumnValue(row, "Has Size", "hasSize").toLowerCase();
        const hasSize = rawHasSize === "true" || rawHasSize === "yes" || rawHasSize === "1";
        // 10. Active Status
        const rawActive = getCsvColumnValue(row, "Active", "active").toLowerCase();
        const active = rawActive === "" || rawActive === "yes" || rawActive === "true" || rawActive === "1";
        // 11. Foreign Key Lookup: Location IDs
        const rawLocations = getCsvColumnValue(row, "Locations", "Location Codes", "locationIds", "location_ids", "Location");
        const matchedLocationIds = [];
        if (rawLocations) {
            const tokens = rawLocations.split(/[;,]/).map(s => s.trim()).filter(Boolean);
            for (const token of tokens) {
                const cleanToken = token.split(":")[0].trim();
                const found = allLocations.find(l => l.id.toLowerCase() === cleanToken.toLowerCase() ||
                    l.code.toLowerCase() === cleanToken.toLowerCase() ||
                    l.nameEn.toLowerCase() === cleanToken.toLowerCase() ||
                    l.nameAr.toLowerCase() === cleanToken.toLowerCase());
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
                            performedBy: req.user.id,
                            source: "Import",
                            retentionFlag: "7_YEARS",
                            details: `Updated via catalog import (Row ${rowNumber})`,
                            beforeValues: JSON.stringify(existing),
                            afterValues: JSON.stringify(updated),
                        },
                    });
                });
                updatedCount++;
            }
            catch (err) {
                errors.push(`Row ${rowNumber}: Failed to update item "${itemCode}": ${err.message}`);
            }
        }
        else {
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
                            performedBy: req.user.id,
                            source: "Import",
                            retentionFlag: "7_YEARS",
                            details: `Created via catalog import (Row ${rowNumber})`,
                            afterValues: JSON.stringify(created),
                        },
                    });
                });
                importedCount++;
            }
            catch (err) {
                errors.push(`Row ${rowNumber}: Failed to insert item "${itemCode}": ${err.message}`);
            }
        }
    }
    const totalImported = importedCount + updatedCount;
    res.json({
        success: true,
        imported: totalImported,
        created: importedCount,
        updated: updatedCount,
        errors,
        message: `Import completed: ${importedCount} created, ${updatedCount} updated, ${errors.length} errors`,
    });
}));
export default router;
