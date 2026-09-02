import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";
import { parsePagination, paginateMeta } from "../utils/pagination.js";

const router = Router();
router.use(authenticate);
router.use(authorize("Admin","HSE Supervisor"));

router.get("/", asyncHandler(async (req,res)=>{
  const { page, limit } = parsePagination(req.query);
  const entityType = req.query.entityType as string;
  const action = req.query.action as string;
  const performedBy = req.query.performedBy as string;
  const from = req.query.from as string;
  const to = req.query.to as string;
  const where:any={};
  if(entityType) where.entityType = entityType as any;
  if(action) where.action = action;
  if(performedBy) where.performedBy = performedBy;
  if(from || to){
    where.timestamp={};
    if(from) where.timestamp.gte = new Date(from);
    if(to) where.timestamp.lte = new Date(to);
  }
  const total=await prisma.auditLog.count({ where });
  const data=await prisma.auditLog.findMany({ where, skip:(page-1)*limit, take:limit, orderBy:{ timestamp:"desc"}, include:{ performer:true }});
  res.json({ data, meta: paginateMeta(total,page,limit)});
}));

export default router;
