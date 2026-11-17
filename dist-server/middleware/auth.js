import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
export async function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return next(new ApiError(401, "Missing or invalid Authorization header"));
    }
    const token = header.substring(7);
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        const user = await prisma.employee.findUnique({
            where: { id: payload.id },
            select: { id: true, employeeCode: true, role: true, name: true, active: true, deletedAt: true },
        });
        if (!user || !user.active || user.deletedAt) {
            return next(new ApiError(401, "User not found or inactive"));
        }
        req.user = {
            id: user.id,
            employeeCode: user.employeeCode,
            role: user.role,
            name: user.name,
        };
        next();
    }
    catch (e) {
        if (e instanceof ApiError)
            return next(e);
        return next(new ApiError(401, "Invalid or expired token"));
    }
}
export function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
        return next();
    const token = header.substring(7);
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        req.user = { id: payload.id, employeeCode: payload.employeeCode, role: payload.role, name: payload.name };
    }
    catch { }
    next();
}
