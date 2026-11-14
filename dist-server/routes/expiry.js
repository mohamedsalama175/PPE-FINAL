import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { expirySettingsSchema } from "../schemas/entities.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";
const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(async (_req, res) => {
    let settings = await prisma.expirySettings.findFirst();
    if (!settings) {
        settings = await prisma.expirySettings.create({ data: { generalLeadTimeDays: 30, categoryILeadTimeDays: 15, categoryIILeadTimeDays: 30, categoryIIILeadTimeDays: 60 } });
    }
    res.json({
        generalLeadTimeDays: settings.generalLeadTimeDays,
        categoryOverrides: [
            { riskCategory: "I", leadTimeDays: settings.categoryILeadTimeDays },
            { riskCategory: "II", leadTimeDays: settings.categoryIILeadTimeDays },
            { riskCategory: "III", leadTimeDays: settings.categoryIIILeadTimeDays },
        ],
        raw: settings
    });
}));
router.put("/", authorize("Admin"), validate(expirySettingsSchema), asyncHandler(async (req, res) => {
    let settings = await prisma.expirySettings.findFirst();
    const { generalLeadTimeDays, categoryILeadTimeDays, categoryIILeadTimeDays, categoryIIILeadTimeDays } = req.body;
    if (!settings) {
        settings = await prisma.expirySettings.create({ data: { generalLeadTimeDays, categoryILeadTimeDays, categoryIILeadTimeDays, categoryIIILeadTimeDays } });
    }
    else {
        settings = await prisma.expirySettings.update({ where: { id: settings.id }, data: { generalLeadTimeDays, categoryILeadTimeDays, categoryIILeadTimeDays, categoryIIILeadTimeDays } });
    }
    res.json({
        generalLeadTimeDays: settings.generalLeadTimeDays,
        categoryOverrides: [
            { riskCategory: "I", leadTimeDays: settings.categoryILeadTimeDays },
            { riskCategory: "II", leadTimeDays: settings.categoryIILeadTimeDays },
            { riskCategory: "III", leadTimeDays: settings.categoryIIILeadTimeDays },
        ],
        raw: settings
    });
}));
export default router;
