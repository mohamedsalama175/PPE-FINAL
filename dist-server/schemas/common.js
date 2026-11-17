import { z } from "zod";
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    active: z.enum(["true", "false", "all"]).optional(),
    includeDeleted: z.coerce.boolean().optional().default(false),
});
export const idParam = z.object({ id: z.string().min(1) });
