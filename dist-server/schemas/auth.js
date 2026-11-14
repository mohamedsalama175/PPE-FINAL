import { z } from "zod";
export const loginSchema = z.object({
    employeeCode: z.string().min(1),
    password: z.string().min(1),
});
export const registerSchema = z.object({
    employeeCode: z.string().min(1),
    name: z.string().min(1),
    jobPositionId: z.string().min(1),
    role: z.enum(["Admin", "HSE Supervisor", "Direct Supervisor", "Store Keeper", "Employee", "HSE_Supervisor", "Direct_Supervisor", "Store_Keeper"]),
    password: z.string().min(6),
    active: z.boolean().optional(),
});
