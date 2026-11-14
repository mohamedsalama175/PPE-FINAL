import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
const router = Router();
router.use(authenticate);
router.get("/stats", asyncHandler(async (req, res) => {
    const userId = req.user.id;
    // scope for store keeper
    const user = await prisma.employee.findUnique({ where: { id: userId }, select: { role: true } });
    const isStoreKeeper = user?.role === "Store_Keeper";
    let allowedLocationIds = null;
    if (isStoreKeeper) {
        const links = await prisma.locationStoreKeeper.findMany({ where: { employeeId: userId } });
        allowedLocationIds = links.map(l => l.locationId);
    }
    const whereBalance = {};
    if (allowedLocationIds)
        whereBalance.locationId = { in: allowedLocationIds };
    const balances = await prisma.stockBalance.findMany({ where: whereBalance, include: { ppeItem: true } });
    let outOfStockCount = 0, lowStockCount = 0;
    let totalValuation = 0;
    for (const b of balances) {
        if (b.quantityOnHand === 0)
            outOfStockCount++;
        else if (b.quantityOnHand <= b.ppeItem.reorderLevel)
            lowStockCount++;
    }
    // valuation from batches
    const batchWhere = { status: "Active" };
    if (allowedLocationIds)
        batchWhere.locationId = { in: allowedLocationIds };
    const batches = await prisma.batch.findMany({ where: batchWhere });
    for (const batch of batches) {
        if (batch.costPerUnit)
            totalValuation += batch.availableQty * batch.costPerUnit;
    }
    const pendingAdjustments = await prisma.stockAdjustment.count({ where: { status: "pending", ...(allowedLocationIds ? { locationId: { in: allowedLocationIds } } : {}) } });
    const openLoans = await prisma.issuance.count({ where: { status: "issued", expectedReturnDate: { not: null }, ...(allowedLocationIds ? { locationId: { in: allowedLocationIds } } : {}) } });
    // expiringSoon & overdue based on expectedReplacementDate and expectedReturnDate
    const now = new Date();
    const expiringSoon = await prisma.issuance.count({ where: { status: "issued", expectedReplacementDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } } });
    const overdue = await prisma.issuance.count({ where: { status: "issued", expectedReturnDate: { lt: now } } });
    const totalPPEItems = await prisma.pPEItem.count({ where: { deletedAt: null, active: true } });
    const totalLocations = allowedLocationIds ? allowedLocationIds.length : await prisma.location.count({ where: { deletedAt: null } });
    const totalIssuances = await prisma.issuance.count({ ...(allowedLocationIds ? { where: { locationId: { in: allowedLocationIds } } } : {}) });
    res.json({
        outOfStockCount,
        lowStockCount,
        totalValuation,
        pendingAdjustments,
        openLoans,
        expiringSoon,
        overdue,
        totalPPEItems,
        totalLocations,
        totalIssuances,
        balancesCount: balances.length,
    });
}));
export default router;
