import { generateId } from '../lib/utils';
import { 
  JobPosition, Location, Attribute, ItemGroup, PPEItem, Kit, Employee, 
  StockBalance, StockMovement, StockAdjustment, Issuance, IssuanceReturn, 
  ScrapEntry, ExpirySettings 
} from '../types';

export const mockJobPositions: JobPosition[] = [
  { id: 'jp-1', code: 'JP-001', nameEn: 'Electrical Engineer', nameAr: 'مهندس كهرباء', active: true },
  { id: 'jp-2', code: 'JP-002', nameEn: 'Mechanical Engineer', nameAr: 'مهندس ميكانيكا', active: true },
  { id: 'jp-3', code: 'JP-003', nameEn: 'Site Supervisor', nameAr: 'مشرف موقع', active: true },
  { id: 'jp-4', code: 'JP-004', nameEn: 'Welder', nameAr: 'لحام', active: true },
  { id: 'jp-5', code: 'JP-005', nameEn: 'Scaffolder', nameAr: 'سقّال', active: true },
  { id: 'jp-6', code: 'JP-006', nameEn: 'Laboratory Technician', nameAr: 'فني مختبر', active: true },
  { id: 'jp-7', code: 'JP-007', nameEn: 'Warehouse Operator', nameAr: 'مشغل مستودع', active: true },
  { id: 'jp-8', code: 'JP-008', nameEn: 'HSE Officer', nameAr: 'مسؤول سلامة', active: true },
  { id: 'jp-9', code: 'JP-009', nameEn: 'Driver', nameAr: 'سائق', active: true },
  { id: 'jp-10', code: 'JP-010', nameEn: 'General Laborer', nameAr: 'عامل عام', active: true },
];

export const mockLocations: Location[] = [
  { id: 'loc-1', code: 'HQ-WH-01', nameEn: 'Main Warehouse', nameAr: 'المستودع الرئيسي', site: 'Main Campus', locationType: 'Central Warehouse', description: '', capacityUnits: 1000, address: 'Site A', active: true, assignedStoreKeeperIds: ['emp-8'] },
  { id: 'loc-2', code: 'HQ-WH-02', nameEn: 'Secondary Warehouse', nameAr: 'المستودع الثانوي', site: 'North Field', locationType: 'Site Store', description: '', capacityUnits: 500, address: 'Site A', active: true, assignedStoreKeeperIds: ['emp-8'] },
  { id: 'loc-3', code: 'SITEB-01', nameEn: 'Site B Store', nameAr: 'مخزن الموقع ب', site: 'South Field', locationType: 'Site Store', description: '', capacityUnits: 200, address: 'Site B', active: true, assignedStoreKeeperIds: [] },
  { id: 'loc-4', code: 'SITEC-01', nameEn: 'Site C Store', nameAr: 'مخزن الموقع ج', site: 'Main Campus', locationType: 'General', description: '', capacityUnits: 100, address: 'Site C', active: true, assignedStoreKeeperIds: [] },
];

export const mockAttributes: Attribute[] = [
  { id: 'attr-1', code: 'SIZE-CLOTHING', nameEn: 'Clothing Size', nameAr: 'مقاس الملابس', active: true, values: [
    { id: 'val-1-1', value: 'S', sortOrder: 1 }, { id: 'val-1-2', value: 'M', sortOrder: 2 }, { id: 'val-1-3', value: 'L', sortOrder: 3 }, { id: 'val-1-4', value: 'XL', sortOrder: 4 }
  ]},
  { id: 'attr-2', code: 'SIZE-SHOES', nameEn: 'Shoe Size', nameAr: 'مقاس الحذاء', active: true, values: [
    { id: 'val-2-1', value: '39', sortOrder: 1 }, { id: 'val-2-2', value: '40', sortOrder: 2 }, { id: 'val-2-3', value: '41', sortOrder: 3 }, { id: 'val-2-4', value: '42', sortOrder: 4 }
  ]},
  { id: 'attr-3', code: 'COLOR', nameEn: 'Color', nameAr: 'اللون', active: true, values: [
    { id: 'val-3-1', value: 'Red', sortOrder: 1 }, { id: 'val-3-2', value: 'Blue', sortOrder: 2 }, { id: 'val-3-3', value: 'Yellow', sortOrder: 3 }
  ]},
  { id: 'attr-4', code: 'GLOVE-SIZE', nameEn: 'Glove Size', nameAr: 'مقاس القفاز', active: true, values: [
    { id: 'val-4-1', value: '8', sortOrder: 1 }, { id: 'val-4-2', value: '9', sortOrder: 2 }, { id: 'val-4-3', value: '10', sortOrder: 3 }
  ]},
  { id: 'attr-5', code: 'MATERIAL', nameEn: 'Material', nameAr: 'المادة', active: true, values: [
    { id: 'val-5-1', value: 'Cotton', sortOrder: 1 }, { id: 'val-5-2', value: 'Leather', sortOrder: 2 }
  ]},
  { id: 'attr-6', code: 'FILTER-TYPE', nameEn: 'Filter Type', nameAr: 'نوع الفلتر', active: true, values: [
    { id: 'val-6-1', value: 'P1', sortOrder: 1 }, { id: 'val-6-2', value: 'P2', sortOrder: 2 }, { id: 'val-6-3', value: 'P3', sortOrder: 3 }
  ]},
];

export const mockItemGroups: ItemGroup[] = [
  { id: 'ig-1', code: 'HEAD', nameEn: 'Head Protection', nameAr: 'حماية الرأس', active: true, attributeIds: ['attr-3'] },
  { id: 'ig-2', code: 'HAND', nameEn: 'Hand Protection', nameAr: 'حماية اليدين', active: true, attributeIds: ['attr-4', 'attr-5'] },
  { id: 'ig-3', code: 'FOOT', nameEn: 'Footwear', nameAr: 'أحذية', active: true, attributeIds: ['attr-2'] },
  { id: 'ig-4', code: 'BODY', nameEn: 'Clothing', nameAr: 'ملابس', active: true, attributeIds: ['attr-1', 'attr-3'] },
  { id: 'ig-5', code: 'RESP', nameEn: 'Respiratory', nameAr: 'تنفسية', active: true, attributeIds: ['attr-6'] },
];

export const mockPPEItems: PPEItem[] = [
  { id: 'ppe-1', itemCode: 'HELM-YEL', nameEn: 'Safety Helmet Yellow', nameAr: 'خوذة سلامة صفراء', category: 'General', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Years', lifespanValue: 3, descriptionEn: 'Standard safety helmet', descriptionAr: 'خوذة قياسية', manufacturer: 'MSA', model: 'V-Gard', standardCertification: 'EN 397', riskCategory: 'II', reorderLevel: 50, active: true, locationIds: ['loc-1', 'loc-3'], variantAttributeValueIds: [], uom: 'Piece' },
  { id: 'ppe-2', itemCode: 'HELM-RED', nameEn: 'Safety Helmet Red', nameAr: 'خوذة سلامة حمراء', category: 'General', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Years', lifespanValue: 3, descriptionEn: 'Standard safety helmet for fire team', descriptionAr: 'خوذة لفريق الإطفاء', manufacturer: 'MSA', model: 'V-Gard', standardCertification: 'EN 397', riskCategory: 'II', reorderLevel: 10, active: true, locationIds: ['loc-1'], variantAttributeValueIds: [], uom: 'Piece' },
  { id: 'ppe-3', itemCode: 'GLOV-LTH-9', nameEn: 'Leather Gloves Size 9', nameAr: 'قفازات جلد مقاس 9', category: 'Welding', itemGroupId: 'ig-2', hasSize: true, gender: 'Unisex', lifespanType: 'Months', lifespanValue: 3, descriptionEn: 'Heavy duty leather gloves', descriptionAr: 'قفازات للخدمة الشاقة', manufacturer: 'Ansell', model: 'ActivArmr', standardCertification: 'EN 388', riskCategory: 'II', reorderLevel: 100, active: true, locationIds: ['loc-1', 'loc-2', 'loc-3'], variantAttributeValueIds: ['val-4-2', 'val-5-2'], uom: 'Pair' },
  { id: 'ppe-4', itemCode: 'BOOT-S3-41', nameEn: 'Safety Boots S3 Size 41', nameAr: 'حذاء سلامة مقاس 41', category: 'Footwear', itemGroupId: 'ig-3', hasSize: true, gender: 'Male', lifespanType: 'Months', lifespanValue: 12, descriptionEn: 'Steel toe safety boots', descriptionAr: 'حذاء بمقدمة فولاذية', manufacturer: 'Puma Safety', model: 'Conquest', standardCertification: 'EN ISO 20345', riskCategory: 'II', reorderLevel: 20, active: true, locationIds: ['loc-1', 'loc-4'], variantAttributeValueIds: ['val-2-3'], uom: 'Pair' },
  { id: 'ppe-5', itemCode: 'COV-COT-L', nameEn: 'Cotton Coverall Size L', nameAr: 'بدلة عمل قطن مقاس L', category: 'Clothing', itemGroupId: 'ig-4', hasSize: true, gender: 'Male', lifespanType: 'Months', lifespanValue: 6, descriptionEn: 'Breathable coverall', descriptionAr: 'بدلة مريحة', manufacturer: 'Dickies', model: 'Redhawk', standardCertification: 'CE', riskCategory: 'I', reorderLevel: 30, active: true, locationIds: ['loc-1'], variantAttributeValueIds: ['val-1-3', 'val-5-1'], uom: 'Piece' },
  { id: 'ppe-6', itemCode: 'RESP-P3', nameEn: 'P3 Respirator', nameAr: 'قناع تنفس P3', category: 'Respiratory', itemGroupId: 'ig-5', hasSize: false, gender: 'Unisex', lifespanType: 'Days', lifespanValue: 30, descriptionEn: 'High efficiency particulate respirator', descriptionAr: 'قناع عالي الكفاءة', manufacturer: '3M', model: 'Aura 9332+', standardCertification: 'EN 149', riskCategory: 'III', reorderLevel: 200, active: true, locationIds: ['loc-1', 'loc-2'], variantAttributeValueIds: ['val-6-3'], uom: 'Piece' },
  { id: 'ppe-7', itemCode: 'HELM-WELD', nameEn: 'Welding Helmet', nameAr: 'خوذة لحام', category: 'Welding', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Years', lifespanValue: 2, descriptionEn: 'Auto-darkening welding helmet', descriptionAr: 'خوذة لحام تعتيم تلقائي', manufacturer: 'Speedglas', model: '9100', standardCertification: 'EN 175', riskCategory: 'III', reorderLevel: 5, active: true, locationIds: ['loc-1', 'loc-3'], variantAttributeValueIds: [], uom: 'Piece' },
  { id: 'ppe-8', itemCode: 'VEST-YEL', nameEn: 'Hi-Vis Vest Yellow', nameAr: 'سترة عاكسة صفراء', category: 'Clothing', itemGroupId: 'ig-4', hasSize: true, gender: 'Unisex', lifespanType: 'Months', lifespanValue: 6, descriptionEn: 'High visibility vest', descriptionAr: 'سترة عاكسة', manufacturer: 'Portwest', model: 'C470', standardCertification: 'EN ISO 20471', riskCategory: 'I', reorderLevel: 100, active: true, locationIds: ['loc-1', 'loc-3', 'loc-4'], variantAttributeValueIds: ['val-1-3', 'val-3-3'], uom: 'Piece' },
  { id: 'ppe-9', itemCode: 'GLOV-COT-M', nameEn: 'Cotton Gloves M', nameAr: 'قفازات قطن M', category: 'General', itemGroupId: 'ig-2', hasSize: true, gender: 'Unisex', lifespanType: 'Days', lifespanValue: 15, descriptionEn: 'Light work gloves', descriptionAr: 'قفازات عمل خفيفة', manufacturer: 'Local', model: 'Basic', standardCertification: 'CE', riskCategory: 'I', reorderLevel: 500, active: true, locationIds: ['loc-1'], variantAttributeValueIds: ['val-4-2', 'val-5-1'], uom: 'Pair' },
  { id: 'ppe-10', itemCode: 'GLOV-COT-L', nameEn: 'Cotton Gloves L', nameAr: 'قفازات قطن L', category: 'General', itemGroupId: 'ig-2', hasSize: true, gender: 'Unisex', lifespanType: 'Days', lifespanValue: 15, descriptionEn: 'Light work gloves', descriptionAr: 'قفازات عمل خفيفة', manufacturer: 'Local', model: 'Basic', standardCertification: 'CE', riskCategory: 'I', reorderLevel: 500, active: true, locationIds: ['loc-1'], variantAttributeValueIds: ['val-4-3', 'val-5-1'], uom: 'Pair' },
  { id: 'ppe-11', itemCode: 'HARNESS-FB', nameEn: 'Full Body Harness', nameAr: 'حزام أمان كامل', category: 'Fall Protection', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Years', lifespanValue: 5, descriptionEn: 'Fall arrest harness', descriptionAr: 'حزام منع السقوط', manufacturer: 'Petzl', model: 'Volt', standardCertification: 'EN 361', riskCategory: 'III', reorderLevel: 10, active: true, locationIds: ['loc-1'], variantAttributeValueIds: [], uom: 'Piece' },
  { id: 'ppe-12', itemCode: 'EARPLUG-DISP', nameEn: 'Disposable Earplugs', nameAr: 'سدادات أذن', category: 'Hearing', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Days', lifespanValue: 1, descriptionEn: 'Foam earplugs box 200', descriptionAr: 'علبة سدادات', manufacturer: 'Howard Leight', model: 'Max', standardCertification: 'EN 352-2', riskCategory: 'II', reorderLevel: 50, active: true, locationIds: ['loc-1', 'loc-3'], variantAttributeValueIds: [], uom: 'Box' },
  { id: 'ppe-13', itemCode: 'GOGGLE-CLR', nameEn: 'Clear Safety Goggles', nameAr: 'نظارات سلامة شفافة', category: 'Eye Protection', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Months', lifespanValue: 6, descriptionEn: 'Anti-scratch clear goggles', descriptionAr: 'نظارات مقاومة للخدش', manufacturer: 'Uvex', model: 'Pheos', standardCertification: 'EN 166', riskCategory: 'II', reorderLevel: 30, active: true, locationIds: ['loc-1'], variantAttributeValueIds: [], uom: 'Piece' },
  { id: 'ppe-14', itemCode: 'BOOT-S3-42', nameEn: 'Safety Boots S3 Size 42', nameAr: 'حذاء سلامة مقاس 42', category: 'Footwear', itemGroupId: 'ig-3', hasSize: true, gender: 'Male', lifespanType: 'Months', lifespanValue: 12, descriptionEn: 'Steel toe safety boots', descriptionAr: 'حذاء بمقدمة فولاذية', manufacturer: 'Puma Safety', model: 'Conquest', standardCertification: 'EN ISO 20345', riskCategory: 'II', reorderLevel: 20, active: true, locationIds: ['loc-1'], variantAttributeValueIds: ['val-2-4'], uom: 'Pair' },
  { id: 'ppe-15', itemCode: 'BOOT-RUB-41', nameEn: 'Rubber Boots Size 41', nameAr: 'حذاء مطاط مقاس 41', category: 'Footwear', itemGroupId: 'ig-3', hasSize: true, gender: 'Unisex', lifespanType: 'Months', lifespanValue: 24, descriptionEn: 'Waterproof boots', descriptionAr: 'حذاء مقاوم للماء', manufacturer: 'Dunlop', model: 'Purofort', standardCertification: 'EN ISO 20347', riskCategory: 'I', reorderLevel: 15, active: true, locationIds: ['loc-1'], variantAttributeValueIds: ['val-2-3'], uom: 'Pair' },
];

export const mockKits: Kit[] = [
  { id: 'kit-1', nameEn: 'Standard Site Kit', nameAr: 'طقم الموقع القياسي', active: true, jobPositionId: 'jp-10', items: [
    { id: 'ki-1', ppeItemId: 'ppe-1', qty: 1 }, { id: 'ki-2', ppeItemId: 'ppe-8', qty: 1 }, { id: 'ki-3', ppeItemId: 'ppe-13', qty: 1 }
  ]},
  { id: 'kit-2', nameEn: 'Welder Kit', nameAr: 'طقم اللحام', active: true, jobPositionId: 'jp-4', items: [
    { id: 'ki-4', ppeItemId: 'ppe-7', qty: 1 }, { id: 'ki-5', ppeItemId: 'ppe-3', qty: 2 }, { id: 'ki-6', ppeItemId: 'ppe-5', qty: 1 }
  ]},
  { id: 'kit-3', nameEn: 'Scaffolder Kit', nameAr: 'طقم السقالات', active: true, jobPositionId: 'jp-5', items: [
    { id: 'ki-7', ppeItemId: 'ppe-1', qty: 1 }, { id: 'ki-8', ppeItemId: 'ppe-11', qty: 1 }, { id: 'ki-9', ppeItemId: 'ppe-9', qty: 3 }
  ]},
  { id: 'kit-4', nameEn: 'Lab Technician Kit', nameAr: 'طقم فني المختبر', active: true, jobPositionId: 'jp-6', items: [
    { id: 'ki-10', ppeItemId: 'ppe-13', qty: 1 }, { id: 'ki-11', ppeItemId: 'ppe-9', qty: 5 }, { id: 'ki-12', ppeItemId: 'ppe-6', qty: 1 }
  ]},
  { id: 'kit-5', nameEn: 'Manager Visit Kit', nameAr: 'طقم زيارة المدير', active: true, jobPositionId: 'jp-1', items: [
    { id: 'ki-13', ppeItemId: 'ppe-1', qty: 1 }, { id: 'ki-14', ppeItemId: 'ppe-8', qty: 1 }
  ]},
];

export const mockEmployees: Employee[] = [
  { id: 'emp-1', employeeCode: 'EMP-001', name: 'Admin User', jobPositionId: 'jp-8', role: 'Admin', active: true },
  { id: 'emp-2', employeeCode: 'EMP-002', name: 'John HSE Supervisor', jobPositionId: 'jp-8', role: 'HSE Supervisor', active: true },
  { id: 'emp-3', employeeCode: 'EMP-003', name: 'Sarah Direct Super', jobPositionId: 'jp-3', role: 'Direct Supervisor', active: true },
  { id: 'emp-8', employeeCode: 'EMP-008', name: 'Mike Store Keeper', jobPositionId: 'jp-7', role: 'Store Keeper', active: true },
  { id: 'emp-4', employeeCode: 'EMP-004', name: 'Ali Employee', jobPositionId: 'jp-4', role: 'Employee', active: true },
  { id: 'emp-5', employeeCode: 'EMP-005', name: 'Omer Welder', jobPositionId: 'jp-4', role: 'Employee', active: true },
  { id: 'emp-6', employeeCode: 'EMP-006', name: 'Zaid Laborer', jobPositionId: 'jp-10', role: 'Employee', active: true },
  { id: 'emp-7', employeeCode: 'EMP-007', name: 'Sara Laborer', jobPositionId: 'jp-10', role: 'Employee', active: true },
  { id: 'emp-9', employeeCode: 'EMP-009', name: 'Tom Driver', jobPositionId: 'jp-9', role: 'Employee', active: true },
  { id: 'emp-10', employeeCode: 'EMP-010', name: 'Jerry Scaffolder', jobPositionId: 'jp-5', role: 'Employee', active: true },
  { id: 'emp-11', employeeCode: 'EMP-011', name: 'Mona Lab Tech', jobPositionId: 'jp-6', role: 'Employee', active: true },
  { id: 'emp-12', employeeCode: 'EMP-012', name: 'Ahmed Electrician', jobPositionId: 'jp-1', role: 'Employee', active: true },
];

export const mockStockBalances: StockBalance[] = [
  { id: 'sb-1', ppeItemId: 'ppe-1', locationId: 'loc-1', quantityOnHand: 150 },
  { id: 'sb-2', ppeItemId: 'ppe-2', locationId: 'loc-1', quantityOnHand: 5 }, // Low stock (reorder 10)
  { id: 'sb-3', ppeItemId: 'ppe-3', locationId: 'loc-1', quantityOnHand: 200 },
  { id: 'sb-4', ppeItemId: 'ppe-4', locationId: 'loc-1', quantityOnHand: 15 }, // Low stock (reorder 20)
  { id: 'sb-5', ppeItemId: 'ppe-6', locationId: 'loc-1', quantityOnHand: 0 },  // Out of stock
  { id: 'sb-6', ppeItemId: 'ppe-8', locationId: 'loc-1', quantityOnHand: 120 },
  { id: 'sb-7', ppeItemId: 'ppe-11', locationId: 'loc-1', quantityOnHand: 8 }, // Low stock (reorder 10)
  { id: 'sb-8', ppeItemId: 'ppe-1', locationId: 'loc-3', quantityOnHand: 20 },
];

export const mockIssuances: Issuance[] = [
  { id: 'iss-1', employeeId: 'emp-4', ppeItemId: 'ppe-1', locationId: 'loc-1', quantity: 1, issueDate: '2023-01-10', status: 'issued', issuedBy: 'emp-8' }, // Expired (3 years from 2023 is 2026, but let's say it's expired for mock)
  { id: 'iss-2', employeeId: 'emp-4', ppeItemId: 'ppe-8', locationId: 'loc-1', quantity: 1, issueDate: '2026-08-01', status: 'issued', issuedBy: 'emp-8' }, // Active
  { id: 'iss-3', employeeId: 'emp-5', ppeItemId: 'ppe-7', locationId: 'loc-1', quantity: 1, issueDate: '2025-01-15', status: 'issued', issuedBy: 'emp-8' }, // Expiring Soon? 
  { id: 'iss-4', holderName: 'Visitor 1', holderType: 'Visitor', ppeItemId: 'ppe-1', locationId: 'loc-1', quantity: 1, issueDate: '2026-08-15', expectedReturnDate: '2026-08-16', status: 'issued', issuedBy: 'emp-8' }, // Overdue open loan
  { id: 'iss-5', employeeId: 'emp-6', kitId: 'kit-1', locationId: 'loc-1', quantity: 1, issueDate: '2026-07-01', status: 'returned', issuedBy: 'emp-8' }, 
  { id: 'iss-6', holderName: 'Contractor A', holderType: 'Contractor', ppeItemId: 'ppe-8', locationId: 'loc-1', quantity: 1, issueDate: '2026-09-01', expectedReturnDate: '2026-10-01', status: 'issued', issuedBy: 'emp-8' }, // Open loan
];

export const mockIssuanceReturns: IssuanceReturn[] = [
  { id: 'ret-1', issuanceId: 'iss-5', condition: 'good', autoScrapped: false, returnedBy: 'emp-8', returnDate: '2026-08-01' },
];

export const mockStockAdjustments: StockAdjustment[] = [
  { id: 'adj-1', reference: 'ADJ-IN-PPE-2026-00001', type: 'IN', ppeItemId: 'ppe-1', locationId: 'loc-1', batchNumber: 'B-26-001', quantityDelta: 50, reasonCategory: 'Manual Correction', reason: 'Physical count mismatch', status: 'pending', submittedBy: 'emp-8', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'adj-2', reference: 'ADJ-IN-PPE-2026-00002', type: 'IN', ppeItemId: 'ppe-6', locationId: 'loc-1', batchNumber: 'B-26-004', quantityDelta: 100, reasonCategory: 'New Delivery', reason: 'Found old stock', status: 'applied', submittedBy: 'emp-8', createdAt: '2026-09-02T08:00:00Z' },
  { id: 'adj-3', reference: 'ADJ-OUT-PPE-2026-00003', type: 'OUT', ppeItemId: 'ppe-4', locationId: 'loc-1', batchNumber: 'B-26-005', quantityDelta: -2, reasonCategory: 'Physical Damage', reason: 'Damaged in warehouse', status: 'applied', submittedBy: 'emp-8', createdAt: '2026-09-02T09:00:00Z' },
];

export const mockScrapEntries: ScrapEntry[] = [
  { id: 'scr-1', ppeItemId: 'ppe-1', locationId: 'loc-1', quantity: 1, reason: 'Damaged on site', reversed: false, scrappedBy: 'emp-8', createdAt: '2026-08-20T10:00:00Z' },
  { id: 'scr-2', ppeItemId: 'ppe-4', locationId: 'loc-1', quantity: 2, reason: 'Expired', reversed: false, scrappedBy: 'emp-8', createdAt: '2026-08-25T10:00:00Z' },
  { id: 'scr-3', ppeItemId: 'ppe-8', locationId: 'loc-1', quantity: 1, reason: 'Lost', reversed: true, reversedBy: 'emp-1', reversedAt: '2026-08-26T10:00:00Z', scrappedBy: 'emp-8', createdAt: '2026-08-22T10:00:00Z' },
];

export const mockExpirySettings: ExpirySettings = {
  generalLeadTimeDays: 30,
  categoryOverrides: [
    { riskCategory: 'I', leadTimeDays: 15 },
    { riskCategory: 'II', leadTimeDays: 30 },
    { riskCategory: 'III', leadTimeDays: 60 },
  ],
};

import { OpeningBalance, Batch } from '../types';

export const mockOpeningBalances: OpeningBalance[] = [
  {
    id: 'ob-1',
    locationId: 'loc-1',
    referenceDate: '2026-08-01',
    notes: 'Initial physical count for main warehouse',
    status: 'Approved',
    preparedBy: 'emp-1',
    approvedBy: 'emp-2',
    approvedAt: '2026-08-02T10:00:00Z',
    createdAt: '2026-08-01T10:00:00Z',
    lines: [
      { id: 'obl-1', ppeItemId: 'ppe-1', batchNumber: 'B-26-001', expiryDate: '2028-08-01', quantity: 150, costPerUnit: 15.5 },
      { id: 'obl-2', ppeItemId: 'ppe-2', batchNumber: 'B-26-002', expiryDate: '2028-08-01', quantity: 5, costPerUnit: 18.0 }
    ]
  },
  {
    id: 'ob-2',
    locationId: 'loc-3',
    referenceDate: '2026-09-01',
    notes: 'Draft count for Site B',
    status: 'Draft',
    preparedBy: 'emp-8',
    createdAt: '2026-09-01T08:00:00Z',
    lines: [
      { id: 'obl-3', ppeItemId: 'ppe-1', batchNumber: 'B-26-003', expiryDate: '2028-09-01', quantity: 20 }
    ]
  }
];

export const mockBatches: Batch[] = [
  { id: 'batch-1', batchNumber: 'B-26-001', ppeItemId: 'ppe-1', locationId: 'loc-1', quantity: 150, availableQty: 150, expiryDate: '2028-08-01', costPerUnit: 15.5, status: 'Active', openingBalanceId: 'ob-1', createdAt: '2026-08-02T10:00:00Z' },
  { id: 'batch-2', batchNumber: 'B-26-002', ppeItemId: 'ppe-2', locationId: 'loc-1', quantity: 5, availableQty: 5, expiryDate: '2028-08-01', costPerUnit: 18.0, status: 'Active', openingBalanceId: 'ob-1', createdAt: '2026-08-02T10:00:00Z' }
];

