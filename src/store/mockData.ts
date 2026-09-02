import { 
  JobPosition, Location, Attribute, ItemGroup, PPEItem, Kit, Employee, 
  Batch, StockBalance, StockAdjustment, Issuance, IssuanceReturn, VisitorLoan, ScrapEntry, 
  OpeningBalance, AuditLog, TrashItem, InAppNotification, ModuleSettings 
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
  {
    id: 'loc-cai-new',
    code: 'LOC-CAI-NEW',
    nameEn: 'Cairo Main Store',
    nameAr: 'مستودع القاهرة الرئيسي',
    site: 'Cairo Site',
    locationType: 'Central Warehouse',
    stockCondition: 'New',
    description: 'Central distribution hub for brand new PPE inventory',
    capacityUnits: 500,
    address: 'Warehouse Block 1, Cairo Logistics Zone',
    assignedStoreKeeperIds: ['emp-8'], // Sam
    openingBalanceStatus: 'Closed',
    hasHeldStock: true,
    active: true
  },
  {
    id: 'loc-cai-usd',
    code: 'LOC-CAI-USD',
    nameEn: 'Cairo Used Pool',
    nameAr: 'مخزن المستعمل - القاهرة',
    site: 'Cairo Site',
    locationType: 'Site Store',
    stockCondition: 'Used',
    description: 'Reused stock pool for secondary issuances and contractor loans',
    capacityUnits: 150,
    address: 'Staging Bay 3, Cairo Site',
    assignedStoreKeeperIds: ['emp-8'], // Sam
    openingBalanceStatus: 'Closed',
    hasHeldStock: true,
    active: true
  },
  {
    id: 'loc-cai-scr',
    code: 'LOC-CAI-SCR',
    nameEn: 'Cairo Scrap Yard',
    nameAr: 'ساحة التخريد - القاهرة',
    site: 'Cairo Site',
    locationType: 'General',
    stockCondition: 'Scrap',
    description: 'Designated disposal area for damaged and end-of-life PPE',
    capacityUnits: 0,
    address: 'Hazardous Waste & Scrap Compound, Cairo Site',
    assignedStoreKeeperIds: [],
    openingBalanceStatus: 'Closed',
    hasHeldStock: true,
    active: true
  },
  {
    id: 'loc-alx-new',
    code: 'LOC-ALX-NEW',
    nameEn: 'Alexandria Site Store',
    nameAr: 'مستودع موقع الإسكندرية',
    site: 'Alexandria Site',
    locationType: 'Site Store',
    stockCondition: 'New',
    description: 'Primary on-site store for Alexandria manufacturing plant',
    capacityUnits: 200,
    address: 'Plant 4, Alexandria Free Zone',
    assignedStoreKeeperIds: ['emp-11'], // Mona
    openingBalanceStatus: 'Open', // Open for testing NEW-01 Opening Balance
    hasHeldStock: false,
    active: true
  },
  {
    id: 'loc-alx-usd',
    code: 'LOC-ALX-USD',
    nameEn: 'Alexandria Used Store',
    nameAr: 'مخزن المستعمل - الإسكندرية',
    site: 'Alexandria Site',
    locationType: 'Site Store',
    stockCondition: 'Used',
    description: 'Reused pool for Alexandria maintenance and temporary workers',
    capacityUnits: 80,
    address: 'Annex B, Alexandria Plant',
    assignedStoreKeeperIds: ['emp-11'], // Mona
    openingBalanceStatus: 'Open',
    hasHeldStock: false,
    active: true
  },
  {
    id: 'loc-main-gen',
    code: 'LOC-MAIN-GEN',
    nameEn: 'Main Campus Storage',
    nameAr: 'مستودع المجمع الرئيسي',
    site: 'Main Campus',
    locationType: 'Central Warehouse',
    stockCondition: 'New',
    description: 'Headquarters supply depot and executive safety kit repository',
    capacityUnits: 300,
    address: 'HQ Tower Basement Level 2',
    assignedStoreKeeperIds: ['emp-11'],
    openingBalanceStatus: 'Closed',
    hasHeldStock: true,
    active: true
  }
];

export const mockAttributes: Attribute[] = [
  {
    id: 'attr-gender',
    code: 'GENDER',
    nameEn: 'Gender',
    nameAr: 'الجنس',
    active: true,
    values: [
      { id: 'val-g-m', valueEn: 'Male', valueAr: 'ذكر', sortOrder: 1, active: true },
      { id: 'val-g-f', valueEn: 'Female', valueAr: 'أنثى', sortOrder: 2, active: true },
      { id: 'val-g-u', valueEn: 'Unisex', valueAr: 'للجنسين', sortOrder: 3, active: true }
    ]
  },
  {
    id: 'attr-size',
    code: 'SIZE',
    nameEn: 'Size',
    nameAr: 'المقاس',
    active: true,
    values: [
      { id: 'val-s-s', valueEn: 'S', valueAr: 'صغير', sortOrder: 1, active: true },
      { id: 'val-s-m', valueEn: 'M', valueAr: 'متوسط', sortOrder: 2, active: true },
      { id: 'val-s-l', valueEn: 'L', valueAr: 'كبير', sortOrder: 3, active: true },
      { id: 'val-s-xl', valueEn: 'XL', valueAr: 'كبير جداً', sortOrder: 4, active: true },
      { id: 'val-s-xxl', valueEn: 'XXL', valueAr: 'كبير جداً مضاعف', sortOrder: 5, active: true },
      { id: 'val-s-42', valueEn: '42', valueAr: '42', sortOrder: 6, active: true },
      { id: 'val-s-44', valueEn: '44', valueAr: '44', sortOrder: 7, active: true }
    ]
  },
  {
    id: 'attr-color',
    code: 'COLOR',
    nameEn: 'Color',
    nameAr: 'اللون',
    active: true,
    values: [
      { id: 'val-c-yel', valueEn: 'Yellow', valueAr: 'أصفر', sortOrder: 1, active: true },
      { id: 'val-c-wht', valueEn: 'White', valueAr: 'أبيض', sortOrder: 2, active: true },
      { id: 'val-c-blu', valueEn: 'Blue', valueAr: 'أزرق', sortOrder: 3, active: true },
      { id: 'val-c-org', valueEn: 'Hi-Vis Orange', valueAr: 'برتقالي عاكس', sortOrder: 4, active: true }
    ]
  }
];

export const mockItemGroups: ItemGroup[] = [
  {
    id: 'grp-helmets',
    code: 'HELMETS',
    nameEn: 'Safety Helmets & Headgear',
    nameAr: 'خوذ وأغطية الرأس للسلامة',
    assignedAttributeIds: ['attr-color'],
    requiresGenderMatch: false,
    active: true
  },
  {
    id: 'grp-gloves',
    code: 'GLOVES',
    nameEn: 'Hand Protection & Heavy Gloves',
    nameAr: 'قفازات وحماية اليدين',
    assignedAttributeIds: ['attr-size', 'attr-color'],
    requiresGenderMatch: false,
    active: true
  },
  {
    id: 'grp-footwear',
    code: 'FOOTWEAR',
    nameEn: 'Safety Footwear & Steel-Toe Boots',
    nameAr: 'أحذية السلامة ومقدمة الفولاذ',
    assignedAttributeIds: ['attr-size', 'attr-gender'],
    requiresGenderMatch: true, // Gender Match strictly required
    active: true
  },
  {
    id: 'grp-respirators',
    code: 'RESPIRATORS',
    nameEn: 'Respiratory Protection Systems',
    nameAr: 'أنظمة حماية التنفس',
    assignedAttributeIds: ['attr-size'],
    requiresGenderMatch: false,
    active: true
  }
];

export const mockPPEItems: PPEItem[] = [
  {
    id: 'ppe-hlm-001',
    itemCode: 'HLM-001',
    nameEn: 'MSA V-Gard Safety Helmet Class E',
    nameAr: 'خوذة سلامة MSA V-Gard فئة E',
    category: 'Head',
    itemGroupId: 'grp-helmets',
    lifespanValue: 3,
    lifespanUnit: 'Years',
    uom: 'Piece',
    descriptionEn: 'High-density polyethylene dielectric protective cap rated up to 20,000V.',
    descriptionAr: 'قبعة واقية عالية الكثافة معزولة حتى 20,000 فولت.',
    manufacturer: 'MSA Safety',
    model: 'V-Gard 500',
    standardCertification: 'ANSI/ISEA Z89.1-2014 / EN 397',
    riskCategory: 'Category II',
    reorderLevels: {
      'loc-cai-new': 50,
      'loc-alx-new': 20
    },
    locationIds: ['loc-cai-new', 'loc-alx-new', 'loc-main-gen'],
    itemCodeLocked: true,
    active: true
  },
  {
    id: 'ppe-glv-002',
    itemCode: 'GLV-002',
    nameEn: 'Ansell ActivArmr Heavy Duty Gloves',
    nameAr: 'قفازات أنسيل للخدمة الشاقة',
    category: 'Hand',
    itemGroupId: 'grp-gloves',
    lifespanValue: 3,
    lifespanUnit: 'Months',
    uom: 'Pair',
    descriptionEn: 'Reinforced split cowhide leather work gloves with Kevlar stitching.',
    descriptionAr: 'قفازات جلد طبيعي مدعمة بخياطة كيفلار لمقاومة التمزق.',
    manufacturer: 'Ansell',
    model: 'ActivArmr 43-216',
    standardCertification: 'EN 388:2016 4243D',
    riskCategory: 'Category II',
    reorderLevels: {
      'loc-cai-new': 100,
      'loc-alx-new': 30
    },
    locationIds: ['loc-cai-new', 'loc-alx-new'],
    itemCodeLocked: true,
    active: true
  },
  {
    id: 'ppe-bot-003',
    itemCode: 'BOT-003',
    nameEn: 'Puma Safety Conquest S3 Boots',
    nameAr: 'حذاء سلامة بوما كونكويست S3',
    category: 'Foot',
    itemGroupId: 'grp-footwear',
    lifespanValue: 12,
    lifespanUnit: 'Months',
    uom: 'Pair',
    descriptionEn: 'Waterproof fiberglass-toe safety boot with puncture-resistant Kevlar midsole.',
    descriptionAr: 'حذاء سلامة مقاوم للماء بمقدمة ألياف زجاجية ونعل مقاوم للاختراق.',
    manufacturer: 'Puma Safety',
    model: 'Conquest High S3 HRO',
    standardCertification: 'EN ISO 20345:2011 S3',
    riskCategory: 'Category II',
    reorderLevels: {
      'loc-cai-new': 20,
      'loc-alx-new': 15
    },
    locationIds: ['loc-cai-new', 'loc-alx-new'],
    itemCodeLocked: true,
    active: true
  },
  {
    id: 'ppe-resp-004',
    itemCode: 'RESP-004',
    nameEn: '3M Aura 9332+ FFP3 Valved Respirator',
    nameAr: 'كمامة تنفس 3M Aura FFP3 بصمام',
    category: 'Respiratory',
    itemGroupId: 'grp-respirators',
    lifespanValue: 30,
    lifespanUnit: 'Days',
    uom: 'Piece',
    descriptionEn: 'High-protection particulate respirator for toxic dusts, mists, and fumes.',
    descriptionAr: 'قناع عالي الحماية ضد الأغبرة السامة والأبخرة الصناعية.',
    manufacturer: '3M',
    model: 'Aura 9332+',
    standardCertification: 'EN 149:2001+A1:2009 FFP3 NR D',
    riskCategory: 'Category III', // Lethal risk
    reorderLevels: {
      'loc-cai-new': 150,
      'loc-alx-new': 50
    },
    locationIds: ['loc-cai-new', 'loc-alx-new'],
    itemCodeLocked: true,
    active: true
  },
  {
    id: 'ppe-harn-005',
    itemCode: 'HARN-005',
    nameEn: 'Petzl Volt Fall Arrest Harness',
    nameAr: 'حزام منع السقوط بيتزل فولت',
    category: 'Fall Protection',
    itemGroupId: 'grp-helmets',
    lifespanValue: 5,
    lifespanUnit: 'Years',
    uom: 'Piece',
    descriptionEn: 'Full body harness with sternal and dorsal attachment points for tower climbing.',
    descriptionAr: 'حزام أمان كامل للجسم مع نقاط تثبيت صدرية وظهرية.',
    manufacturer: 'Petzl',
    model: 'Volt Wind International',
    standardCertification: 'ANSI Z359.11 / EN 361',
    riskCategory: 'Category III', // Lethal risk
    reorderLevels: {
      'loc-cai-new': 10
    },
    locationIds: ['loc-cai-new'],
    itemCodeLocked: true,
    active: true
  },
  {
    id: 'ppe-wld-006',
    itemCode: 'WLD-006',
    nameEn: 'Speedglas 9100XX Auto-Darkening Welding Helmet',
    nameAr: 'خوذة لحام سبيدجلاس تعتيم تلقائي',
    category: 'Head',
    itemGroupId: 'grp-helmets',
    lifespanValue: 2,
    lifespanUnit: 'Years',
    uom: 'Piece',
    descriptionEn: 'Advanced shade 5, 8-13 welding shield with side windows and optical clarity 1/1/1/2.',
    descriptionAr: 'درع لحام متقدم بتعتيم تلقائي 5-13 مع نوافذ جانبية.',
    manufacturer: '3M Speedglas',
    model: '9100XX',
    standardCertification: 'EN 175:B / EN 379',
    riskCategory: 'Category III', // Lethal/irreversible risk
    reorderLevels: {
      'loc-cai-new': 5
    },
    locationIds: ['loc-cai-new'],
    itemCodeLocked: true,
    active: true
  },
  {
    id: 'ppe-vst-007',
    itemCode: 'VST-007',
    nameEn: 'Portwest Hi-Vis Executive Vest',
    nameAr: 'سترة عاكسة للمشرفين بورتويست',
    category: 'Body',
    itemGroupId: 'grp-helmets',
    lifespanValue: 6,
    lifespanUnit: 'Months',
    uom: 'Piece',
    descriptionEn: 'Class 2 high visibility waist coat with mobile pocket and dual ID holder.',
    descriptionAr: 'سترة فسفورية عاكسة فئة 2 مع جيوب إضافية.',
    manufacturer: 'Portwest',
    model: 'C476',
    standardCertification: 'EN ISO 20471 Class 2',
    riskCategory: 'Category I',
    reorderLevels: {
      'loc-cai-new': 40
    },
    locationIds: ['loc-cai-new'],
    itemCodeLocked: false,
    active: true
  }
];

export const mockKits: Kit[] = [
  {
    id: 'kit-elec',
    nameEn: 'Electrical Engineer Safety Kit',
    nameAr: 'طقم مهندس الكهرباء للسلامة',
    jobPositionId: 'jp-1',
    active: true,
    items: [
      { id: 'ki-1', ppeItemId: 'ppe-hlm-001', quantity: 1 },
      { id: 'ki-2', ppeItemId: 'ppe-glv-002', quantity: 1 },
      { id: 'ki-3', ppeItemId: 'ppe-bot-003', quantity: 1 }
    ]
  },
  {
    id: 'kit-weld',
    nameEn: 'Welder Certified Protection Kit',
    nameAr: 'طقم اللحام المعتمد للحماية',
    jobPositionId: 'jp-4',
    active: true,
    items: [
      { id: 'ki-4', ppeItemId: 'ppe-wld-006', quantity: 1 },
      { id: 'ki-5', ppeItemId: 'ppe-glv-002', quantity: 2 },
      { id: 'ki-6', ppeItemId: 'ppe-resp-004', quantity: 5 }
    ]
  },
  {
    id: 'kit-scaff',
    nameEn: 'Scaffolder Fall Protection Kit',
    nameAr: 'طقم السقالات للوقاية من السقوط',
    jobPositionId: 'jp-5',
    active: true, // Sole active kit for Scaffolder job position with recent issuances
    items: [
      { id: 'ki-7', ppeItemId: 'ppe-harn-005', quantity: 1 },
      { id: 'ki-8', ppeItemId: 'ppe-hlm-001', quantity: 1 },
      { id: 'ki-9', ppeItemId: 'ppe-glv-002', quantity: 1 }
    ]
  }
];

export const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'EMP-001',
    name: 'Hesham Mostafa (Admin)',
    jobPositionId: 'jp-8',
    role: 'Admin',
    email: 'hesham.admin@bitwise-hse.com',
    site: 'Main Campus',
    department: 'Health, Safety & Environment',
    status: 'Active',
    gender: 'Male',
    active: true
  },
  {
    id: 'emp-2',
    employeeCode: 'EMP-002',
    name: 'Tarek Ibrahim (HSE Supervisor)',
    jobPositionId: 'jp-8',
    role: 'HSE Supervisor',
    email: 'tarek.supervisor@bitwise-hse.com',
    site: 'Cairo Site',
    department: 'Health, Safety & Environment',
    status: 'Active',
    gender: 'Male',
    supervisorId: 'emp-1',
    active: true
  },
  {
    id: 'emp-3',
    employeeCode: 'EMP-003',
    name: 'Sarah Direct Supervisor',
    jobPositionId: 'jp-3',
    role: 'Direct Supervisor',
    email: 'sarah.direct@bitwise-hse.com',
    site: 'Alexandria Site',
    department: 'Operations',
    status: 'Active',
    gender: 'Female',
    supervisorId: 'emp-1',
    active: true
  },
  {
    id: 'emp-8',
    employeeCode: 'EMP-008',
    name: 'Sam Store Keeper (Cairo)',
    jobPositionId: 'jp-7',
    role: 'Store Keeper',
    email: 'sam.storekeeper@bitwise-hse.com',
    site: 'Cairo Site',
    department: 'Logistics & Warehousing',
    status: 'Active',
    gender: 'Male',
    supervisorId: 'emp-2',
    active: true
  },
  {
    id: 'emp-11',
    employeeCode: 'EMP-011',
    name: 'Mona Store Keeper (Alexandria)',
    jobPositionId: 'jp-7',
    role: 'Store Keeper',
    email: 'mona.storekeeper@bitwise-hse.com',
    site: 'Alexandria Site',
    department: 'Logistics & Warehousing',
    status: 'Active',
    gender: 'Female',
    supervisorId: 'emp-2',
    active: true
  },
  {
    id: 'emp-13',
    employeeCode: 'EMP-013',
    name: 'Unassigned Store Keeper',
    jobPositionId: 'jp-7',
    role: 'Store Keeper',
    email: 'unassigned.keeper@bitwise-hse.com',
    site: 'Cairo Site',
    department: 'Logistics & Warehousing',
    status: 'Active',
    gender: 'Male',
    supervisorId: 'emp-2',
    active: true
  },
  {
    id: 'emp-4',
    employeeCode: 'EMP-004',
    name: 'Ali Worker',
    jobPositionId: 'jp-10',
    role: 'Employee',
    email: 'ali.worker@bitwise-hse.com',
    site: 'Cairo Site',
    department: 'Civil Works',
    status: 'Active',
    gender: 'Male',
    supervisorId: 'emp-3',
    active: true
  },
  {
    id: 'emp-5',
    employeeCode: 'EMP-005',
    name: 'Omer Welder',
    jobPositionId: 'jp-4',
    role: 'Employee',
    email: 'omer.welder@bitwise-hse.com',
    site: 'Cairo Site',
    department: 'Welding Fabrication',
    status: 'Active',
    gender: 'Male',
    supervisorId: 'emp-3',
    active: true
  },
  {
    id: 'emp-6',
    employeeCode: 'EMP-006',
    name: 'Zaid Laborer',
    jobPositionId: 'jp-10',
    role: 'Employee',
    email: 'zaid.laborer@bitwise-hse.com',
    site: 'Alexandria Site',
    department: 'Operations',
    status: 'Active',
    gender: 'Male',
    supervisorId: 'emp-3',
    active: true
  },
  {
    id: 'emp-7',
    employeeCode: 'EMP-007',
    name: 'Fatima Engineer (No Email)',
    jobPositionId: 'jp-1',
    role: 'Employee',
    email: '', // Intentionally blank to test BD-I473 partial failure logging
    site: 'Cairo Site',
    department: 'Electrical Engineering',
    status: 'Active',
    gender: 'Female',
    supervisorId: 'emp-3',
    active: true
  },
  {
    id: 'emp-9',
    employeeCode: 'EMP-009',
    name: 'Tom Driver (Transferred)',
    jobPositionId: 'jp-9',
    role: 'Employee',
    email: 'tom.driver@bitwise-hse.com',
    site: 'Main Campus',
    department: 'Fleet Logistics',
    status: 'Transferred', // No reminders
    gender: 'Male',
    supervisorId: 'emp-3',
    active: true
  },
  {
    id: 'emp-10',
    employeeCode: 'EMP-010',
    name: 'Jerry Scaffolder (Terminated)',
    jobPositionId: 'jp-5',
    role: 'Employee',
    email: 'jerry.scaffold@bitwise-hse.com',
    site: 'Cairo Site',
    department: 'Construction',
    status: 'Terminated', // No reminders
    gender: 'Male',
    supervisorId: 'emp-3',
    active: false
  },
  {
    id: 'emp-12',
    employeeCode: 'EMP-012',
    name: 'Ahmed Mansoor Electrician',
    jobPositionId: 'jp-1',
    role: 'Employee',
    email: 'ahmed.electrician@bitwise-hse.com',
    site: 'Cairo Site',
    department: 'Electrical Engineering',
    status: 'Active',
    gender: 'Male',
    supervisorId: 'emp-3',
    active: true,
    lastReceivedSizes: {
      'ppe-bot-003': { 'attr-size': 'val-s-42', 'attr-gender': 'val-g-m' },
      'ppe-glv-002': { 'attr-size': 'val-s-l', 'attr-color': 'val-c-yel' }
    }
  }
];

export const mockBatches: Batch[] = [
  // Cairo Main Store (New)
  {
    id: 'bat-001',
    batchNumber: 'BAT-2026-001',
    ppeItemId: 'ppe-hlm-001',
    locationId: 'loc-cai-new',
    variantKey: 'COLOR:Yellow',
    quantity: 35, // On hand 35 < reorder 50 -> Low stock flag!
    availableQty: 35,
    quarantinedQty: 0,
    condition: 'New',
    expiryDate: '2029-01-15',
    manufacturerExpiryDate: '2029-01-15',
    status: 'Active',
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'bat-002',
    batchNumber: 'BAT-2026-002',
    ppeItemId: 'ppe-glv-002',
    locationId: 'loc-cai-new',
    variantKey: 'SIZE:L|COLOR:Yellow',
    quantity: 180,
    availableQty: 180,
    quarantinedQty: 0,
    condition: 'New',
    expiryDate: '2028-06-30',
    manufacturerExpiryDate: '2028-06-30',
    status: 'Active',
    createdAt: '2026-02-10T09:00:00Z'
  },
  {
    id: 'bat-003',
    batchNumber: 'BAT-2026-003',
    ppeItemId: 'ppe-bot-003',
    locationId: 'loc-cai-new',
    variantKey: 'SIZE:42|GENDER:Male',
    quantity: 45,
    availableQty: 45,
    quarantinedQty: 0,
    condition: 'New',
    expiryDate: '2029-12-31',
    manufacturerExpiryDate: '2029-12-31',
    status: 'Active',
    createdAt: '2026-02-15T11:00:00Z'
  },
  {
    id: 'bat-004',
    batchNumber: 'BAT-2026-004',
    ppeItemId: 'ppe-resp-004',
    locationId: 'loc-cai-new',
    variantKey: 'SIZE:M',
    quantity: 120,
    availableQty: 80,
    quarantinedQty: 40, // 40 units quarantined
    condition: 'New',
    expiryDate: '2027-05-20',
    manufacturerExpiryDate: '2027-05-20',
    status: 'Quarantined',
    createdAt: '2026-03-01T10:00:00Z'
  },
  {
    id: 'bat-005',
    batchNumber: 'BAT-2026-005',
    ppeItemId: 'ppe-harn-005',
    locationId: 'loc-cai-new',
    quantity: 15,
    availableQty: 15,
    quarantinedQty: 0,
    condition: 'New',
    expiryDate: '2031-01-01',
    manufacturerExpiryDate: '2031-01-01',
    status: 'Active',
    createdAt: '2026-01-20T14:00:00Z'
  },
  // Cairo Used Pool (Used / Reused)
  {
    id: 'bat-usd-001',
    batchNumber: 'BAT-USD-001',
    ppeItemId: 'ppe-hlm-001',
    locationId: 'loc-cai-usd',
    variantKey: 'COLOR:White',
    quantity: 25,
    availableQty: 25,
    quarantinedQty: 0,
    condition: 'Reused',
    status: 'Active',
    createdAt: '2026-02-01T10:00:00Z'
  },
  // Cairo Scrap Yard (Scrapped)
  {
    id: 'bat-scr-001',
    batchNumber: 'BAT-SCR-001',
    ppeItemId: 'ppe-hlm-001',
    locationId: 'loc-cai-scr',
    quantity: 8,
    availableQty: 0,
    quarantinedQty: 0,
    condition: 'Scrapped',
    status: 'Depleted',
    createdAt: '2026-01-10T12:00:00Z'
  }
];

export const mockStockBalances: StockBalance[] = [
  { id: 'sb-1', ppeItemId: 'ppe-hlm-001', locationId: 'loc-cai-new', quantityOnHand: 35, quarantinedQuantity: 0, availableQuantity: 35 },
  { id: 'sb-2', ppeItemId: 'ppe-glv-002', locationId: 'loc-cai-new', quantityOnHand: 180, quarantinedQuantity: 0, availableQuantity: 180 },
  { id: 'sb-3', ppeItemId: 'ppe-bot-003', locationId: 'loc-cai-new', quantityOnHand: 40, quarantinedQuantity: 0, availableQuantity: 40 },
  { id: 'sb-4', ppeItemId: 'ppe-resp-004', locationId: 'loc-cai-new', quantityOnHand: 25, quarantinedQuantity: 0, availableQuantity: 25 },
  { id: 'sb-5', ppeItemId: 'ppe-harn-005', locationId: 'loc-cai-new', quantityOnHand: 15, quarantinedQuantity: 0, availableQuantity: 15 },
  { id: 'sb-6', ppeItemId: 'ppe-hlm-001', locationId: 'loc-cai-usd', quantityOnHand: 25, quarantinedQuantity: 0, availableQuantity: 25 },
  { id: 'sb-7', ppeItemId: 'ppe-hlm-001', locationId: 'loc-cai-scr', quantityOnHand: 8, quarantinedQuantity: 0, availableQuantity: 0 },
];

export const mockOpeningBalances: OpeningBalance[] = [
  {
    id: 'ob-2026-001',
    reference: 'ADJ-OB-2026-00001',
    locationId: 'loc-cai-new',
    referenceDate: '2026-01-01T00:00:00Z',
    notes: 'Go-live initial opening stock verification',
    status: 'Approved',
    preparedBy: 'emp-8',
    lines: [
      {
        id: 'obl-1',
        ppeItemId: 'ppe-hlm-001',
        variantKey: 'COLOR:Yellow',
        batchNumber: 'BAT-2026-001',
        expiryDate: '2029-01-15T00:00:00Z',
        quantity: 35,
        costPerUnit: 45.0
      }
    ],
    createdAt: '2026-01-01T08:00:00Z'
  }
];

export const mockScrapEntries: ScrapEntry[] = [
  {
    id: 'scr-1',
    ppeItemId: 'ppe-hlm-001',
    locationId: 'loc-cai-scr',
    batchNumber: 'BAT-SCR-001',
    quantity: 8,
    reason: 'Cracked outer shell detected during site safety inspection',
    reversed: false,
    scrappedBy: 'emp-8',
    createdAt: '2026-01-10T12:00:00Z'
  }
];

// Dual signature samples (Base64 SVG data URLs for instant crisp rendering)
const sampleStoreKeeperSig = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="50" viewBox="0 0 160 50"><path d="M10,35 Q40,5 70,25 T130,15 T150,30" fill="none" stroke="%230f766e" stroke-width="2.5"/></svg>';
const sampleEmployeeSig = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="50" viewBox="0 0 160 50"><path d="M15,40 C35,10 65,45 95,20 C125,5 140,35 155,25" fill="none" stroke="%231e3a8a" stroke-width="2.5"/></svg>';

export const mockIssuances: Issuance[] = [
  // Ahmed Electrician active issuances
  {
    id: 'iss-2026-001',
    reference: 'ISS-2026-00001',
    employeeId: 'emp-12',
    ppeItemId: 'ppe-hlm-001',
    locationId: 'loc-cai-new',
    quantity: 1,
    batchNumber: 'BAT-2026-001',
    variantKey: 'COLOR:Yellow',
    conditionAtIssue: 'New',
    issueDate: '2024-03-01',
    expectedReplacementDate: '2027-03-01',
    status: 'issued',
    issuedBy: 'emp-8',
    storeKeeperSignature: sampleStoreKeeperSig,
    receiverSignature: sampleEmployeeSig,
    createdAt: '2024-03-01T09:00:00Z'
  },
  {
    id: 'iss-2026-002',
    reference: 'ISS-2026-00002',
    employeeId: 'emp-12',
    ppeItemId: 'ppe-bot-003',
    locationId: 'loc-cai-new',
    quantity: 1,
    batchNumber: 'BAT-2026-003',
    variantKey: 'SIZE:42|GENDER:Male',
    conditionAtIssue: 'New',
    issueDate: '2025-11-10',
    expectedReplacementDate: '2026-11-10', // Upcoming replacement (within ~16 days)
    status: 'issued',
    issuedBy: 'emp-8',
    storeKeeperSignature: sampleStoreKeeperSig,
    receiverSignature: sampleEmployeeSig,
    createdAt: '2025-11-10T10:30:00Z'
  },
  {
    id: 'iss-2026-003',
    reference: 'ISS-2026-00003',
    employeeId: 'emp-12',
    ppeItemId: 'ppe-glv-002',
    locationId: 'loc-cai-new',
    quantity: 1,
    batchNumber: 'BAT-2026-002',
    variantKey: 'SIZE:L|COLOR:Yellow',
    conditionAtIssue: 'New',
    issueDate: '2026-06-15',
    expectedReplacementDate: '2026-09-15', // Overdue replacement! (Expired 40+ days ago)
    status: 'issued',
    issuedBy: 'emp-8',
    storeKeeperSignature: sampleStoreKeeperSig,
    receiverSignature: sampleEmployeeSig,
    createdAt: '2026-06-15T08:15:00Z'
  },
  // Ali Worker past returned issuance
  {
    id: 'iss-2026-004',
    reference: 'ISS-2026-00004',
    employeeId: 'emp-4',
    ppeItemId: 'ppe-hlm-001',
    locationId: 'loc-cai-new',
    quantity: 1,
    batchNumber: 'BAT-2026-001',
    variantKey: 'COLOR:Yellow',
    conditionAtIssue: 'New',
    issueDate: '2025-01-10',
    expectedReplacementDate: '2028-01-10',
    status: 'returned',
    issuedBy: 'emp-8',
    storeKeeperSignature: sampleStoreKeeperSig,
    receiverSignature: sampleEmployeeSig,
    createdAt: '2025-01-10T09:00:00Z'
  },
  // Historical imported issuance (No signatures, isImported flag)
  {
    id: 'iss-hist-001',
    reference: 'ISS-HIST-2024-0091',
    employeeId: 'emp-5',
    ppeItemId: 'ppe-wld-006',
    locationId: 'loc-cai-new',
    quantity: 1,
    batchNumber: 'BAT-HIST-91',
    conditionAtIssue: 'New',
    issueDate: '2024-05-01',
    expectedReplacementDate: '2026-05-01', // Overdue
    status: 'issued',
    isImported: true,
    issuedBy: 'SYSTEM_IMPORT',
    createdAt: '2024-05-01T00:00:00Z'
  }
];

export const mockIssuanceReturns: IssuanceReturn[] = [
  {
    id: 'ret-001',
    issuanceId: 'iss-2026-004',
    quantityReturned: 1,
    condition: 'good',
    physicalReceiptConfirmed: true,
    returnedToLocationId: 'loc-cai-usd',
    storeKeeperSignature: sampleStoreKeeperSig,
    receiverSignature: sampleEmployeeSig,
    returnedBy: 'emp-8',
    returnDate: '2026-07-20T11:00:00Z'
  }
];

export const mockVisitorLoans: VisitorLoan[] = [
  {
    id: 'loan-001',
    loanNumber: 'LN-2026-00001',
    recipientName: 'Kareem Fahmy',
    recipientCompany: 'Siemens Energy Contractor',
    hostEmployeeId: 'emp-12', // Ahmed Electrician
    issueDate: '2026-10-20',
    expectedReturnDate: '2026-10-30', // Open, due in 5 days
    fromLocationId: 'loc-cai-usd',
    status: 'Open',
    items: [
      {
        id: 'li-1',
        ppeItemId: 'ppe-hlm-001',
        variantKey: 'COLOR:White',
        batchNumber: 'BAT-USD-001',
        quantity: 1,
        returnedQuantity: 0,
        fromLocationId: 'loc-cai-usd',
        status: 'Open'
      }
    ],
    storeKeeperSignature: sampleStoreKeeperSig,
    recipientSignature: sampleEmployeeSig,
    issuedBy: 'emp-8',
    createdAt: '2026-10-20T09:30:00Z'
  },
  {
    id: 'loan-002',
    loanNumber: 'LN-2026-00002',
    recipientName: 'Omar Sherif',
    recipientCompany: 'Petrofac Inspection Team',
    hostEmployeeId: 'emp-2', // Tarek HSE Supervisor
    issueDate: '2026-10-01',
    expectedReturnDate: '2026-10-12', // Overdue by ~13 days!
    fromLocationId: 'loc-cai-usd',
    status: 'Overdue',
    items: [
      {
        id: 'li-2',
        ppeItemId: 'ppe-hlm-001',
        variantKey: 'COLOR:White',
        batchNumber: 'BAT-USD-001',
        quantity: 1,
        returnedQuantity: 0,
        fromLocationId: 'loc-cai-usd',
        status: 'Open'
      },
      {
        id: 'li-3',
        ppeItemId: 'ppe-glv-002',
        variantKey: 'SIZE:L|COLOR:Yellow',
        batchNumber: 'BAT-2026-002',
        quantity: 1,
        returnedQuantity: 0,
        fromLocationId: 'loc-cai-new',
        status: 'Open'
      }
    ],
    storeKeeperSignature: sampleStoreKeeperSig,
    recipientSignature: sampleEmployeeSig,
    issuedBy: 'emp-8',
    createdAt: '2026-10-01T08:00:00Z'
  }
];

export const mockStockAdjustments: StockAdjustment[] = [
  {
    id: 'adj-in-31',
    reference: 'ADJ-IN-2026-00031',
    type: 'IN',
    ppeItemId: 'ppe-resp-004', // Category III -> Requires HSE Supervisor Approval
    locationId: 'loc-cai-new',
    batchNumber: 'BAT-2026-004B',
    variantKey: 'SIZE:M',
    quantityDelta: 60,
    reasonCategory: 'Stock Count Correction',
    reasonDetail: 'Surplus count found during annual cycle stock check in high-security respirator locker.',
    manufacturerExpiryDate: '2028-12-31',
    supplierDeliveryNote: 'CORR-2026-Q3',
    status: 'pending', // Pending Approval by HSE Supervisor
    submittedBy: 'emp-8',
    createdAt: '2026-10-24T14:00:00Z'
  },
  {
    id: 'adj-out-32',
    reference: 'ADJ-OUT-2026-00032',
    type: 'OUT',
    ppeItemId: 'ppe-harn-005', // Category III
    locationId: 'loc-cai-new',
    batchNumber: 'BAT-2026-005',
    quantityDelta: -2,
    reasonCategory: 'Physical Damage',
    reasonDetail: 'Two harnesses incurred deep webbing cuts from contact with sharp structural beam flange during transit.',
    status: 'pending', // Pending Approval by HSE Supervisor
    submittedBy: 'emp-8',
    createdAt: '2026-10-25T10:15:00Z'
  }
];

export const mockTrashItems: TrashItem[] = [
  {
    id: 'trash-1',
    entityType: 'Item',
    originalId: 'ppe-old-goggle',
    code: 'GOG-OLD-01',
    nameEn: 'Legacy Clear Polycarbonate Goggles',
    nameAr: 'نظارات واقية قديمة من البولي كربونات',
    deletedBy: 'Hesham Mostafa (Admin)',
    deletedAt: '2026-09-01T10:00:00Z',
    reason: 'Phased out in favor of EN 166 panoramic anti-fog goggles.',
    hasHistory: true, // Marked Retained - has history (no countdown, never auto-purged)
    daysInTrash: 54,
    data: {
      itemCode: 'GOG-OLD-01',
      nameEn: 'Legacy Clear Polycarbonate Goggles',
      nameAr: 'نظارات واقية قديمة من البولي كربونات'
    }
  },
  {
    id: 'trash-2',
    entityType: 'Attribute',
    originalId: 'attr-temp-filter',
    code: 'FILTER-SPEC',
    nameEn: 'Temporary Filter Rating',
    nameAr: 'تصنيف الفلتر المؤقت',
    deletedBy: 'Hesham Mostafa (Admin)',
    deletedAt: '2026-08-01T08:00:00Z',
    reason: 'Consolidated into respiratory item group standard certifications.',
    hasHistory: false, // Counts down from 90 days. 90 - 85 = 5 days left (< 7 days warning!)
    daysInTrash: 85,
    data: {
      code: 'FILTER-SPEC',
      nameEn: 'Temporary Filter Rating',
      nameAr: 'تصنيف الفلتر المؤقت'
    }
  },
  {
    id: 'trash-3',
    entityType: 'Kit',
    originalId: 'kit-summer-intern',
    code: 'KIT-INTERN',
    nameEn: 'Summer Intern Safety Pack',
    nameAr: 'حقيبة سلامة المتدرب الصيفي',
    deletedBy: 'Hesham Mostafa (Admin)',
    deletedAt: '2026-10-05T12:00:00Z',
    reason: 'Internship season concluded.',
    hasHistory: false,
    daysInTrash: 20,
    data: {
      nameEn: 'Summer Intern Safety Pack',
      nameAr: 'حقيبة سلامة المتدرب الصيفي',
      jobPositionId: 'jp-10'
    }
  }
];

export const mockNotifications: InAppNotification[] = [
  {
    id: 'notif-1',
    type: 'low_stock',
    title: 'Low Stock Alert: MSA V-Gard Safety Helmet',
    message: 'Available stock (35) is below reorder level (50) at Cairo Main Store.',
    timestamp: '2026-10-25T11:00:00Z',
    read: false,
    severity: 'warning',
    linkTo: '/stock'
  },
  {
    id: 'notif-2',
    type: 'overdue_loan',
    title: 'Overdue Loan Alert: LN-2026-00002',
    message: 'Loan to Omar Sherif (Petrofac) is overdue by 13 days. Host: Tarek Ibrahim.',
    timestamp: '2026-10-25T08:00:00Z',
    read: false,
    severity: 'critical',
    linkTo: '/issuances/open-loans'
  },
  {
    id: 'notif-3',
    type: 'approval_request',
    title: 'Approval Required: Category III Stock Adjustment',
    message: 'ADJ-IN-2026-00031 for 3M Aura Respirators (60 pcs) requires HSE Supervisor review.',
    timestamp: '2026-10-24T14:05:00Z',
    read: false,
    severity: 'warning',
    linkTo: '/stock/adjustments'
  },
  {
    id: 'notif-4',
    type: 'trash_purge_warning',
    title: 'Trash Bin Auto-Purge Notice (5 Days Left)',
    message: 'Attribute "FILTER-SPEC" will be permanently deleted in 5 days (no history).',
    timestamp: '2026-10-25T00:01:00Z',
    read: false,
    severity: 'warning',
    linkTo: '/trash'
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-001',
    timestampUTC: '2026-10-20T09:30:00Z',
    user: 'Sam Store Keeper (Cairo)',
    role: 'Store Keeper',
    objectType: 'Loan',
    objectReference: 'LN-2026-00001',
    action: 'LOAN_ISSUED',
    beforeValues: null,
    afterValues: { recipientName: 'Kareem Fahmy', itemsCount: 1, status: 'Open' },
    reason: 'Standard contractor safety clearance equipment loan',
    source: 'Screen',
    retentionFlag: '7_YEARS'
  },
  {
    id: 'audit-002',
    timestampUTC: '2026-10-24T14:00:00Z',
    user: 'Sam Store Keeper (Cairo)',
    role: 'Store Keeper',
    objectType: 'StockAdjustment',
    objectReference: 'ADJ-IN-2026-00031',
    action: 'ADJUSTMENT_SUBMITTED',
    beforeValues: { status: 'none' },
    afterValues: { status: 'pending', quantityDelta: 60, riskCategory: 'Category III' },
    reason: 'Surplus count found during annual cycle stock check in high-security respirator locker.',
    source: 'Screen',
    retentionFlag: '7_YEARS'
  },
  {
    id: 'audit-003',
    timestampUTC: '2026-10-25T09:00:00Z',
    user: 'Hesham Mostafa (Admin)',
    role: 'Admin',
    objectType: 'Settings',
    objectReference: 'MODULE_CONFIG',
    action: 'SETTINGS_UPDATED',
    beforeValues: { reminderLeadTimePerSite: { 'Cairo Site': 10 } },
    afterValues: { reminderLeadTimePerSite: { 'Cairo Site': 14 } },
    reason: 'Aligned reminder lead time with revised HSE corporate directive',
    source: 'Screen',
    retentionFlag: '7_YEARS'
  }
];

export const mockModuleSettings: ModuleSettings = {
  reminderLeadTimePerSite: {
    'Main Campus': 14,
    'Cairo Site': 14,
    'Alexandria Site': 21
  },
  recentIssuanceWindowDays: 90,
  trashRetentionDays: 90
};
