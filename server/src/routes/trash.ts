import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/roleGuard.js";

const router = Router();
router.use(authenticate);
router.use(authorize("Admin"));

router.get("/", asyncHandler(async (_req,res)=>{
  const [ppeItems, attributes, itemGroups, locations, kits] = await Promise.all([
    prisma.pPEItem.findMany({ where:{ deletedAt:{ not:null } }, orderBy:{ deletedAt:"desc"} }),
    prisma.attribute.findMany({ where:{ deletedAt:{ not:null } }, orderBy:{ deletedAt:"desc"} }),
    prisma.itemGroup.findMany({ where:{ deletedAt:{ not:null } }, orderBy:{ deletedAt:"desc"} }),
    prisma.location.findMany({ where:{ deletedAt:{ not:null } }, orderBy:{ deletedAt:"desc"} }),
    prisma.kit.findMany({ where:{ deletedAt:{ not:null } }, orderBy:{ deletedAt:"desc"} }),
  ]);
  const items = [
    ...ppeItems.map(i=> ({ ...i, entityType:"PPEItem"})),
    ...attributes.map(a=> ({ ...a, entityType:"Attribute"})),
    ...itemGroups.map(g=> ({ ...g, entityType:"ItemGroup"})),
    ...locations.map(l=> ({ ...l, entityType:"Location"})),
    ...kits.map(k=> ({ ...k, entityType:"Kit"})),
  ].sort((a,b)=> new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
  res.json({ data: items });
}));

export default router;
