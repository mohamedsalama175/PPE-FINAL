import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";

const roleMap: Record<string, string> = {
  "Admin": "Admin",
  "HSE Supervisor": "HSE_Supervisor",
  "Direct Supervisor": "Direct_Supervisor",
  "Store Keeper": "Store_Keeper",
  "Employee": "Employee",
};

function normalize(role: string): string {
  return roleMap[role] || role.replace(/\s/g, "_");
}

export function authorize(...allowed: string[]) {
  const allowedNormalized = allowed.map(normalize);
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const userRoleNorm = normalize(req.user.role);
    // DB stores with underscores via @map, request stores display name? Actually JWT stores raw role from DB (which is enum value). Prisma returns enum key like Admin, HSE_Supervisor etc. So normalize both.
    if (!allowedNormalized.includes(userRoleNorm) && !allowedNormalized.includes(req.user.role)) {
      throw new ApiError(403, `Forbidden: requires one of ${allowed.join(", ")}`);
    }
    next();
  };
}

// Helper to check if user is Store Keeper and scope locationIds
export async function getScopedLocationIds(userId: string, prisma: any): Promise<string[] | null> {
  // returns null if not store keeper (no scoping), otherwise array of locationIds
  const employee = await prisma.employee.findUnique({ where: { id: userId }, select: { role: true } });
  const norm = (employee?.role || "").replace(/_/g, " ");
  if (norm !== "Store Keeper" && employee?.role !== "Store_Keeper") return null;
  const links = await prisma.locationStoreKeeper.findMany({ where: { employeeId: userId }, select: { locationId: true } });
  return links.map((l: any) => l.locationId);
}

// Helper to check if user is Direct Supervisor and scope subordinate employee IDs
export async function getScopedSubordinateIds(userId: string, prisma: any): Promise<string[] | null> {
  // returns null if not direct supervisor (no scoping), otherwise array of employee IDs (own team)
  const employee = await prisma.employee.findUnique({ where: { id: userId }, select: { role: true } });
  const norm = (employee?.role || "").replace(/_/g, " ");
  if (norm !== "Direct Supervisor" && employee?.role !== "Direct_Supervisor") return null;
  const subs = await prisma.employee.findMany({ where: { supervisorId: userId }, select: { id: true } });
  return [userId, ...subs.map((s: any) => s.id)];
}
