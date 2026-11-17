import { 
  JobPosition, Location, Attribute, ItemGroup, PPEItem, Kit, Employee, 
  StockBalance, StockAdjustment, Issuance, IssuanceReturn, 
  ScrapEntry, ModuleSettings, OpeningBalance, Batch, AuditLog,
  UnitOfMeasure, SerialUnit, SerialEvent
} from '../types';

export const mockJobPositions: JobPosition[] = [
  { id: 'jp-1', code: 'JP-001', name: 'Electrical Engineer', active: true },
  { id: 'jp-2', code: 'JP-002', name: 'Mechanical Engineer', active: true },
  { id: 'jp-3', code: 'JP-003', name: 'Site Supervisor', active: true },
  { id: 'jp-4', code: 'JP-004', name: 'Welder', active: true },
  { id: 'jp-5', code: 'JP-005', name: 'Scaffolder', active: true },
  { id: 'jp-6', code: 'JP-006', name: 'Laboratory Technician', active: true },
  { id: 'jp-7', code: 'JP-007', name: 'Warehouse Operator', active: true },
  { id: 'jp-8', code: 'JP-008', name: 'HSE Officer', active: true },
  { id: 'jp-9', code: 'JP-009', name: 'Driver', active: true },
  { id: 'jp-10', code: 'JP-010', name: 'General Laborer', active: true },
];

export const mockLocations: Location[] = [
  { id: 'loc-1', code: 'HQ-WH-01', name: 'Main Warehouse', site: 'Main Campus', locationType: 'Central Warehouse', stockCondition: 'New', description: 'Primary central receiving store', capacityUnits: 1000, address: 'Site A, Block 1', active: true, assignedStoreKeeperIds: ['emp-8'] },
  { id: 'loc-2', code: 'HQ-WH-02', name: 'Secondary Warehouse', site: 'North Field', locationType: 'Site Store', stockCondition: 'New', description: 'Site store for North Field', capacityUnits: 500, address: 'North Field Depot', active: true, assignedStoreKeeperIds: ['emp-8'] },
  { id: 'loc-3', code: 'SITEB-01', name: 'Site B Store', site: 'South Field', locationType: 'Site Store', stockCondition: 'New', description: 'Sub-store on South Field', capacityUnits: 200, address: 'Site B Storehouse', active: true, assignedStoreKeeperIds: [] },
  { id: 'loc-4', code: 'SITEC-01', name: 'Site C Store', site: 'Main Campus', locationType: 'General', stockCondition: 'New', description: 'General utility store', capacityUnits: 100, address: 'Site C Depot', active: true, assignedStoreKeeperIds: [] },
  { id: 'loc-5', code: 'USED-WH-01', name: 'Used Equipment Store', site: 'Main Campus', locationType: 'Used', stockCondition: 'Used', description: 'Restored and inspected reusable PPE', capacityUnits: 500, address: 'Site A, Shed 2', active: true, assignedStoreKeeperIds: ['emp-8'] },
  { id: 'loc-6', code: 'SCRAP-YD-01', name: 'HSE Scrap Yard', site: 'Main Campus', locationType: 'Scrap', stockCondition: 'Scrap', description: 'Damaged and decommissioned items awaiting disposal', capacityUnits: 400, address: 'Disposal Yard 4', active: true, assignedStoreKeeperIds: ['emp-8'] },
];

export const mockAttributes: Attribute[] = [
  { id: 'attr-1', code: 'SIZE-CLOTHING', name: 'Clothing Size', active: true, values: [
    { id: 'val-1-1', value: 'S', sortOrder: 1 }, { id: 'val-1-2', value: 'M', sortOrder: 2 }, { id: 'val-1-3', value: 'L', sortOrder: 3 }, { id: 'val-1-4', value: 'XL', sortOrder: 4 }
  ]},
  { id: 'attr-2', code: 'SIZE-SHOES', name: 'Shoe Size', active: true, values: [
    { id: 'val-2-1', value: '39', sortOrder: 1 }, { id: 'val-2-2', value: '40', sortOrder: 2 }, { id: 'val-2-3', value: '41', sortOrder: 3 }, { id: 'val-2-4', value: '42', sortOrder: 4 }
  ]},
  { id: 'attr-3', code: 'COLOR', name: 'Color', active: true, values: [
    { id: 'val-3-1', value: 'Red', sortOrder: 1 }, { id: 'val-3-2', value: 'Blue', sortOrder: 2 }, { id: 'val-3-3', value: 'Yellow', sortOrder: 3 }
  ]},
  { id: 'attr-4', code: 'GLOVE-SIZE', name: 'Glove Size', active: true, values: [
    { id: 'val-4-1', value: '8', sortOrder: 1 }, { id: 'val-4-2', value: '9', sortOrder: 2 }, { id: 'val-4-3', value: '10', sortOrder: 3 }
  ]},
  { id: 'attr-5', code: 'MATERIAL', name: 'Material', active: true, values: [
    { id: 'val-5-1', value: 'Cotton', sortOrder: 1 }, { id: 'val-5-2', value: 'Leather', sortOrder: 2 }
  ]},
  { id: 'attr-6', code: 'FILTER-TYPE', name: 'Filter Type', active: true, values: [
    { id: 'val-6-1', value: 'P1', sortOrder: 1 }, { id: 'val-6-2', value: 'P2', sortOrder: 2 }, { id: 'val-6-3', value: 'P3', sortOrder: 3 }
  ]},
  { id: 'attr-7', code: 'GENDER', name: 'Gender Variant', active: true, values: [
    { id: 'val-7-1', value: 'Male', sortOrder: 1 }, { id: 'val-7-2', value: 'Female', sortOrder: 2 }, { id: 'val-7-3', value: 'Unisex', sortOrder: 3 }
  ]},
];

export const mockItemGroups: ItemGroup[] = [
  { id: 'ig-1', code: 'HEAD', name: 'Head Protection', active: true, attributeIds: ['attr-3'], requiresGenderMatch: false },
  { id: 'ig-2', code: 'HAND', name: 'Hand Protection', active: true, attributeIds: ['attr-4', 'attr-5'], requiresGenderMatch: false },
  { id: 'ig-3', code: 'FOOT', name: 'Footwear', active: true, attributeIds: ['attr-2', 'attr-7'], requiresGenderMatch: true },
  { id: 'ig-4', code: 'BODY', name: 'Clothing', active: true, attributeIds: ['attr-1', 'attr-3', 'attr-7'], requiresGenderMatch: true },
  { id: 'ig-5', code: 'RESP', name: 'Respiratory', active: true, attributeIds: ['attr-6'], requiresGenderMatch: false },
];

export const mockPPEItems: PPEItem[] = [
  { id: 'ppe-1', itemCode: 'HELM-YEL', name: 'Safety Helmet Yellow', category: 'Head Protection', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Years', lifespanValue: 3, description: 'Standard safety helmet for construction', manufacturer: 'MSA', model: 'V-Gard', standardCertification: 'EN 397', riskCategory: 'II', reorderLevel: 50, active: true, locationIds: ['loc-1', 'loc-3'], variantAttributeValueIds: [], unitId: 'uom-pcs', serialTracked: false },
  { id: 'ppe-2', itemCode: 'HELM-RED', name: 'Safety Helmet Red', category: 'Head Protection', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Years', lifespanValue: 3, description: 'Standard safety helmet for fire team', manufacturer: 'MSA', model: 'V-Gard', standardCertification: 'EN 397', riskCategory: 'II', reorderLevel: 10, active: true, locationIds: ['loc-1'], variantAttributeValueIds: [], unitId: 'uom-pcs', serialTracked: false },
  { id: 'ppe-3', itemCode: 'GLOV-LTH-9', name: 'Leather Gloves Size 9', category: 'Hand Protection', itemGroupId: 'ig-2', hasSize: true, gender: 'Unisex', lifespanType: 'Months', lifespanValue: 3, description: 'Heavy duty leather gloves for welding and rigging', manufacturer: 'Ansell', model: 'ActivArmr', standardCertification: 'EN 388', riskCategory: 'II', reorderLevel: 100, active: true, locationIds: ['loc-1', 'loc-2', 'loc-3'], variantAttributeValueIds: ['val-4-2', 'val-5-2'], unitId: 'uom-prs', serialTracked: false },
  { id: 'ppe-4', itemCode: 'BOOT-S3-41', name: 'Safety Boots S3 Size 41', category: 'Footwear', itemGroupId: 'ig-3', hasSize: true, gender: 'Male', lifespanType: 'Months', lifespanValue: 12, description: 'Steel toe puncture-resistant safety boots', manufacturer: 'Puma Safety', model: 'Conquest', standardCertification: 'EN ISO 20345', riskCategory: 'II', reorderLevel: 20, active: true, locationIds: ['loc-1', 'loc-4'], variantAttributeValueIds: ['val-2-3', 'val-7-1'], unitId: 'uom-prs', serialTracked: false },
  { id: 'ppe-5', itemCode: 'COV-COT-L', name: 'Cotton Coverall Size L', category: 'Clothing', itemGroupId: 'ig-4', hasSize: true, gender: 'Male', lifespanType: 'Months', lifespanValue: 6, description: '100% Breathable cotton coverall with reflective tape', manufacturer: 'Dickies', model: 'Redhawk', standardCertification: 'CE', riskCategory: 'I', reorderLevel: 30, active: true, locationIds: ['loc-1'], variantAttributeValueIds: ['val-1-3', 'val-5-1', 'val-7-1'], unitId: 'uom-pcs', serialTracked: false },
  { id: 'ppe-6', itemCode: 'RESP-P3', name: 'P3 Respirator', category: 'Respiratory', itemGroupId: 'ig-5', hasSize: false, gender: 'Unisex', lifespanType: 'Days', lifespanValue: 30, description: 'High efficiency particulate respirator FFP3', manufacturer: '3M', model: 'Aura 9332+', standardCertification: 'EN 149', riskCategory: 'III', reorderLevel: 200, active: true, locationIds: ['loc-1', 'loc-2'], variantAttributeValueIds: ['val-6-3'], unitId: 'uom-pcs', serialTracked: false },
  { id: 'ppe-7', itemCode: 'HELM-WELD', name: 'Welding Helmet', category: 'Head Protection', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Years', lifespanValue: 2, description: 'Auto-darkening welding helmet solar powered', manufacturer: 'Speedglas', model: '9100', standardCertification: 'EN 175', riskCategory: 'III', reorderLevel: 5, active: true, locationIds: ['loc-1', 'loc-3'], variantAttributeValueIds: [], unitId: 'uom-pcs', serialTracked: false },
  { id: 'ppe-8', itemCode: 'VEST-YEL', name: 'Hi-Vis Vest Yellow', category: 'Clothing', itemGroupId: 'ig-4', hasSize: true, gender: 'Unisex', lifespanType: 'Months', lifespanValue: 6, description: 'Class 2 high visibility vest with front zipper', manufacturer: 'Portwest', model: 'C470', standardCertification: 'EN ISO 20471', riskCategory: 'I', reorderLevel: 100, active: true, locationIds: ['loc-1', 'loc-3', 'loc-4'], variantAttributeValueIds: ['val-1-3', 'val-3-3', 'val-7-3'], unitId: 'uom-pcs', serialTracked: false },
  { id: 'ppe-9', itemCode: 'GLOV-COT-M', name: 'Cotton Gloves M', category: 'Hand Protection', itemGroupId: 'ig-2', hasSize: true, gender: 'Unisex', lifespanType: 'Days', lifespanValue: 15, description: 'Light general handling cotton gloves', manufacturer: 'Local', model: 'Basic', standardCertification: 'CE', riskCategory: 'I', reorderLevel: 500, active: true, locationIds: ['loc-1'], variantAttributeValueIds: ['val-4-2', 'val-5-1'], unitId: 'uom-prs', serialTracked: false },
  { id: 'ppe-10', itemCode: 'GLOV-COT-L', name: 'Cotton Gloves L', category: 'Hand Protection', itemGroupId: 'ig-2', hasSize: true, gender: 'Unisex', lifespanType: 'Days', lifespanValue: 15, description: 'Light general handling cotton gloves', manufacturer: 'Local', model: 'Basic', standardCertification: 'CE', riskCategory: 'I', reorderLevel: 500, active: true, locationIds: ['loc-1'], variantAttributeValueIds: ['val-4-3', 'val-5-1'], unitId: 'uom-prs', serialTracked: false },
  { id: 'ppe-11', itemCode: 'HARNESS-FB', name: 'Full Body Harness', category: 'Fall Protection', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Years', lifespanValue: 5, description: 'Fall arrest full body safety harness with dorsal D-ring', manufacturer: 'Petzl', model: 'Volt', standardCertification: 'EN 361', riskCategory: 'III', reorderLevel: 10, active: true, locationIds: ['loc-1'], variantAttributeValueIds: [], unitId: 'uom-pcs', serialTracked: false },
  { id: 'ppe-12', itemCode: 'EARPLUG-DISP', name: 'Disposable Earplugs', category: 'Hearing Protection', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Days', lifespanValue: 1, description: 'Soft polyurethane foam earplugs SNR 37dB', manufacturer: 'Howard Leight', model: 'Max', standardCertification: 'EN 352-2', riskCategory: 'II', reorderLevel: 50, active: true, locationIds: ['loc-1', 'loc-3'], variantAttributeValueIds: [], unitId: 'uom-box', serialTracked: false },
  { id: 'ppe-13', itemCode: 'GOGGLE-CLR', name: 'Clear Safety Goggles', category: 'Eye Protection', itemGroupId: 'ig-1', hasSize: false, gender: 'Unisex', lifespanType: 'Months', lifespanValue: 6, description: 'Anti-scratch and anti-fog clear goggles', manufacturer: 'Uvex', model: 'Pheos', standardCertification: 'EN 166', riskCategory: 'II', reorderLevel: 30, active: true, locationIds: ['loc-1'], variantAttributeValueIds: [], unitId: 'uom-pcs', serialTracked: false },
  { id: 'ppe-14', itemCode: 'BOOT-S3-42', name: 'Safety Boots S3 Size 42', category: 'Footwear', itemGroupId: 'ig-3', hasSize: true, gender: 'Male', lifespanType: 'Months', lifespanValue: 12, description: 'Steel toe safety boots', manufacturer: 'Puma Safety', model: 'Conquest', standardCertification: 'EN ISO 20345', riskCategory: 'II', reorderLevel: 20, active: true, locationIds: ['loc-1'], variantAttributeValueIds: ['val-2-4', 'val-7-1'], unitId: 'uom-prs', serialTracked: false },
  { id: 'ppe-15', itemCode: 'BOOT-RUB-41', name: 'Rubber Boots Size 41', category: 'Footwear', itemGroupId: 'ig-3', hasSize: true, gender: 'Unisex', lifespanType: 'Months', lifespanValue: 24, description: 'Waterproof chemical resistant rubber boots', manufacturer: 'Dunlop', model: 'Purofort', standardCertification: 'EN ISO 20347', riskCategory: 'I', reorderLevel: 15, active: true, locationIds: ['loc-1'], variantAttributeValueIds: ['val-2-3', 'val-7-3'], unitId: 'uom-prs', serialTracked: false },
  { id: 'ppe-16', itemCode: 'GASDET-4G', name: 'Portable 4-Gas Detector', category: 'Respiratory', itemGroupId: 'ig-5', hasSize: false, gender: 'Unisex', lifespanType: 'Years', lifespanValue: 2, description: 'Personal multi-gas monitor (O2, LEL, CO, H2S), serial tracked', manufacturer: 'MSA', model: 'ALTAIR 4XR', standardCertification: 'ATEX', riskCategory: 'III', reorderLevel: 2, active: true, locationIds: ['loc-1', 'loc-2'], variantAttributeValueIds: [], unitId: 'uom-pcs', serialTracked: true },
];

export const mockKits: Kit[] = [
  { id: 'kit-1', name: 'Standard Site Kit', active: true, jobPositionId: 'jp-10', items: [
    { id: 'ki-1', ppeItemId: 'ppe-1', qty: 1 }, { id: 'ki-2', ppeItemId: 'ppe-8', qty: 1 }, { id: 'ki-3', ppeItemId: 'ppe-13', qty: 1 }
  ]},
  { id: 'kit-2', name: 'Welder Kit', active: true, jobPositionId: 'jp-4', items: [
    { id: 'ki-4', ppeItemId: 'ppe-7', qty: 1 }, { id: 'ki-5', ppeItemId: 'ppe-3', qty: 2 }, { id: 'ki-6', ppeItemId: 'ppe-5', qty: 1 }
  ]},
  { id: 'kit-3', name: 'Scaffolder Kit', active: true, jobPositionId: 'jp-5', items: [
    { id: 'ki-7', ppeItemId: 'ppe-1', qty: 1 }, { id: 'ki-8', ppeItemId: 'ppe-11', qty: 1 }, { id: 'ki-9', ppeItemId: 'ppe-9', qty: 3 }
  ]},
  { id: 'kit-4', name: 'Lab Technician Kit', active: true, jobPositionId: 'jp-6', items: [
    { id: 'ki-10', ppeItemId: 'ppe-13', qty: 1 }, { id: 'ki-11', ppeItemId: 'ppe-9', qty: 5 }, { id: 'ki-12', ppeItemId: 'ppe-6', qty: 1 }
  ]},
  { id: 'kit-5', name: 'Manager Site Visit Kit', active: true, jobPositionId: 'jp-1', items: [
    { id: 'ki-13', ppeItemId: 'ppe-1', qty: 1 }, { id: 'ki-14', ppeItemId: 'ppe-8', qty: 1 }
  ]},
];

export const mockEmployees: Employee[] = [
  { id: 'emp-1', employeeCode: 'EMP-001', name: 'Ahmed Khaled (Admin)', jobPositionId: 'jp-8', role: 'Admin', gender: 'Male', status: 'Active', department: 'HSE', site: 'Main Campus', active: true },
  { id: 'emp-2', employeeCode: 'EMP-002', name: 'John Doe (HSE Super)', jobPositionId: 'jp-8', role: 'HSE Supervisor', gender: 'Male', status: 'Active', department: 'HSE', site: 'Main Campus', active: true },
  { id: 'emp-3', employeeCode: 'EMP-003', name: 'Sarah Connor (Direct Super)', jobPositionId: 'jp-3', role: 'Direct Supervisor', gender: 'Female', status: 'Active', department: 'Operations', site: 'Main Campus', active: true },
  { id: 'emp-8', employeeCode: 'EMP-008', name: 'Mike Store Keeper', jobPositionId: 'jp-7', role: 'Store Keeper', gender: 'Male', status: 'Active', department: 'Logistics', site: 'Main Campus', active: true },
  { id: 'emp-4', employeeCode: 'EMP-004', name: 'Ali Mahmoud', jobPositionId: 'jp-4', role: 'Employee', gender: 'Male', status: 'Active', department: 'Operations', site: 'Main Campus', supervisorId: 'emp-3', active: true },
  { id: 'emp-5', employeeCode: 'EMP-005', name: 'Omer Farooq', jobPositionId: 'jp-4', role: 'Employee', gender: 'Male', status: 'Active', department: 'Operations', site: 'Main Campus', supervisorId: 'emp-3', active: true },
  { id: 'emp-6', employeeCode: 'EMP-006', name: 'Zaid Hassan', jobPositionId: 'jp-10', role: 'Employee', gender: 'Male', status: 'Active', department: 'Operations', site: 'Main Campus', supervisorId: 'emp-3', active: true },
  { id: 'emp-7', employeeCode: 'EMP-007', name: 'Sara Youssef', jobPositionId: 'jp-10', role: 'Employee', gender: 'Female', status: 'Active', department: 'Operations', site: 'Main Campus', supervisorId: 'emp-2', active: true },
  { id: 'emp-9', employeeCode: 'EMP-009', name: 'Tom Hardy', jobPositionId: 'jp-9', role: 'Employee', gender: 'Male', status: 'Active', department: 'Transport', site: 'Main Campus', supervisorId: 'emp-2', active: true },
  { id: 'emp-10', employeeCode: 'EMP-010', name: 'Jerry Seinfeld', jobPositionId: 'jp-5', role: 'Employee', gender: 'Male', status: 'Active', department: 'Operations', site: 'Main Campus', supervisorId: 'emp-3', active: true },
  { id: 'emp-11', employeeCode: 'EMP-011', name: 'Mona Zaki (Terminated)', jobPositionId: 'jp-6', role: 'Employee', gender: 'Female', status: 'Terminated', department: 'Lab', site: 'Main Campus', supervisorId: 'emp-2', active: false },
  { id: 'emp-12', employeeCode: 'EMP-012', name: 'Hossam Electrician (Transferred)', jobPositionId: 'jp-1', role: 'Employee', gender: 'Male', status: 'Transferred', department: 'Engineering', site: 'Site B', supervisorId: 'emp-3', active: false },
];

export const mockStockBalances: StockBalance[] = [
  { id: 'sb-1', ppeItemId: 'ppe-1', locationId: 'loc-1', quantityOnHand: 150, quarantinedOnHand: 10 },
  { id: 'sb-2', ppeItemId: 'ppe-2', locationId: 'loc-1', quantityOnHand: 5, quarantinedOnHand: 0 }, // Low stock (reorder 10)
  { id: 'sb-3', ppeItemId: 'ppe-3', locationId: 'loc-1', quantityOnHand: 200, quarantinedOnHand: 0 },
  { id: 'sb-4', ppeItemId: 'ppe-4', locationId: 'loc-1', quantityOnHand: 15, quarantinedOnHand: 0 }, // Low stock (reorder 20)
  { id: 'sb-5', ppeItemId: 'ppe-6', locationId: 'loc-1', quantityOnHand: 0, quarantinedOnHand: 0 },  // Out of stock
  { id: 'sb-6', ppeItemId: 'ppe-8', locationId: 'loc-1', quantityOnHand: 120, quarantinedOnHand: 0 },
  { id: 'sb-7', ppeItemId: 'ppe-11', locationId: 'loc-1', quantityOnHand: 8, quarantinedOnHand: 0 }, // Low stock (reorder 10)
  { id: 'sb-8', ppeItemId: 'ppe-1', locationId: 'loc-3', quantityOnHand: 20, quarantinedOnHand: 0 },
  { id: 'sb-9', ppeItemId: 'ppe-1', locationId: 'loc-5', quantityOnHand: 12, quarantinedOnHand: 0 }, // Used location
  { id: 'sb-10', ppeItemId: 'ppe-7', locationId: 'loc-6', quantityOnHand: 3, quarantinedOnHand: 0 }, // Scrap location
  { id: 'sb-11', ppeItemId: 'ppe-16', locationId: 'loc-1', quantityOnHand: 3, quarantinedOnHand: 0 }, // Serial tracked: equals In Stock serials
];

export const mockBatches: Batch[] = [
  { id: 'batch-1', batchNumber: 'B-26-001', ppeItemId: 'ppe-1', locationId: 'loc-1', quantity: 150, availableQty: 140, quarantinedQty: 10, isQuarantined: false, expiryDate: '2028-08-01', costPerUnit: 15.5, status: 'Active', openingBalanceId: 'ob-1', createdAt: '2026-08-02T10:00:00Z' },
  { id: 'batch-2', batchNumber: 'B-26-002', ppeItemId: 'ppe-2', locationId: 'loc-1', quantity: 5, availableQty: 5, quarantinedQty: 0, isQuarantined: false, expiryDate: '2028-08-01', costPerUnit: 18.0, status: 'Active', openingBalanceId: 'ob-1', createdAt: '2026-08-02T10:00:00Z' },
  { id: 'batch-3', batchNumber: 'B-26-003', ppeItemId: 'ppe-3', locationId: 'loc-1', quantity: 200, availableQty: 200, quarantinedQty: 0, isQuarantined: false, expiryDate: '2027-12-31', costPerUnit: 8.5, status: 'Active', openingBalanceId: 'ob-1', createdAt: '2026-08-02T10:00:00Z' },
  { id: 'batch-4', batchNumber: 'B-26-004', ppeItemId: 'ppe-4', locationId: 'loc-1', quantity: 15, availableQty: 15, quarantinedQty: 0, isQuarantined: false, expiryDate: '2028-06-30', costPerUnit: 45.0, status: 'Active', openingBalanceId: 'ob-1', createdAt: '2026-08-02T10:00:00Z' },
  { id: 'batch-5', batchNumber: 'B-26-005', ppeItemId: 'ppe-8', locationId: 'loc-1', quantity: 120, availableQty: 120, quarantinedQty: 0, isQuarantined: false, expiryDate: '2028-01-15', costPerUnit: 6.0, status: 'Active', openingBalanceId: 'ob-1', createdAt: '2026-08-02T10:00:00Z' },
  { id: 'batch-6', batchNumber: 'B-26-006', ppeItemId: 'ppe-16', locationId: 'loc-1', quantity: 3, availableQty: 3, quarantinedQty: 0, isQuarantined: false, expiryDate: '2028-08-01', costPerUnit: 950, status: 'Active', createdAt: '2026-08-02T10:00:00Z' },
];

export const mockIssuances: Issuance[] = [
  { 
    id: 'iss-1', 
    reference: 'ISS-2023-00001',
    employeeId: 'emp-4', 
    ppeItemId: 'ppe-1', 
    locationId: 'loc-1', 
    quantity: 1, 
    batchNumber: 'B-26-001',
    issueDate: '2023-01-10T10:00:00Z', 
    expectedReplacementDate: '2026-01-10T10:00:00Z', 
    status: 'issued', 
    issuedBy: 'emp-8',
    storeKeeperSignature: 'data:image/png;base64,mockSignSK',
    receiverSignature: 'data:image/png;base64,mockSignRec'
  },
  { 
    id: 'iss-2', 
    reference: 'ISS-2026-00002',
    employeeId: 'emp-4', 
    ppeItemId: 'ppe-8', 
    locationId: 'loc-1', 
    quantity: 1, 
    batchNumber: 'B-26-005',
    issueDate: '2026-08-01T09:30:00Z', 
    expectedReplacementDate: '2027-02-01T09:30:00Z', 
    status: 'issued', 
    issuedBy: 'emp-8',
    storeKeeperSignature: 'data:image/png;base64,mockSignSK',
    receiverSignature: 'data:image/png;base64,mockSignRec'
  },
  { 
    id: 'iss-3', 
    reference: 'ISS-2025-00003',
    employeeId: 'emp-5', 
    ppeItemId: 'ppe-7', 
    locationId: 'loc-1', 
    quantity: 1, 
    issueDate: '2025-01-15T08:00:00Z', 
    expectedReplacementDate: '2026-11-20T08:00:00Z', // Expiring soon!
    status: 'issued', 
    issuedBy: 'emp-8',
    storeKeeperSignature: 'data:image/png;base64,mockSignSK',
    receiverSignature: 'data:image/png;base64,mockSignRec'
  },
  { 
    id: 'iss-4', 
    reference: 'LN-2026-00001',
    holderName: 'Kareem Visitor', 
    holderType: 'Visitor', 
    companyName: 'PetroChem Inspection',
    contactNumber: '+20 100 123 4567',
    hostEmployeeId: 'emp-3',
    ppeItemId: 'ppe-1', 
    locationId: 'loc-1', 
    quantity: 1, 
    batchNumber: 'B-26-001',
    issueDate: '2026-08-15T10:00:00Z', 
    expectedReturnDate: '2026-08-16T17:00:00Z', // Overdue loan!
    status: 'issued', 
    isLoan: true,
    issuedBy: 'emp-8',
    lines: [
      { id: 'lnl-1', ppeItemId: 'ppe-1', quantity: 1, returnedQty: 0, status: 'open' }
    ],
    storeKeeperSignature: 'data:image/png;base64,mockSignSK',
    receiverSignature: 'data:image/png;base64,mockSignRec'
  },
  { 
    id: 'iss-5', 
    reference: 'ISS-2026-00005',
    employeeId: 'emp-6', 
    kitId: 'kit-1', 
    locationId: 'loc-1', 
    quantity: 1, 
    issueDate: '2026-07-01T11:00:00Z', 
    status: 'returned', 
    issuedBy: 'emp-8',
    storeKeeperSignature: 'data:image/png;base64,mockSignSK',
    receiverSignature: 'data:image/png;base64,mockSignRec'
  },
  { 
    id: 'iss-6', 
    reference: 'LN-2026-00002',
    holderName: 'Apex Contractors Crew', 
    holderType: 'Contractor', 
    companyName: 'Apex Scaffolding LLC',
    contactNumber: '+20 102 999 8888',
    hostEmployeeId: 'emp-2',
    ppeItemId: 'ppe-8', 
    locationId: 'loc-1', 
    quantity: 2, 
    batchNumber: 'B-26-005',
    issueDate: '2026-09-01T08:00:00Z', 
    expectedReturnDate: '2026-12-01T17:00:00Z', // Open loan
    status: 'issued', 
    isLoan: true,
    issuedBy: 'emp-8',
    lines: [
      { id: 'lnl-2', ppeItemId: 'ppe-8', quantity: 2, returnedQty: 0, status: 'open' }
    ],
    storeKeeperSignature: 'data:image/png;base64,mockSignSK',
    receiverSignature: 'data:image/png;base64,mockSignRec'
  },
  {
    id: 'iss-7',
    reference: 'HIST-2022-00088',
    employeeId: 'emp-10',
    ppeItemId: 'ppe-11',
    locationId: 'loc-1',
    quantity: 1,
    issueDate: '2022-05-10T09:00:00Z',
    expectedReplacementDate: '2027-05-10T09:00:00Z',
    status: 'issued',
    isHistorical: true,
    issuedBy: 'emp-1',
  }
];

export const mockIssuanceReturns: IssuanceReturn[] = [
  { id: 'ret-1', issuanceId: 'iss-5', condition: 'good', autoScrapped: false, returnedBy: 'emp-8', returnDate: '2026-08-01T14:00:00Z' },
];

export const mockStockAdjustments: StockAdjustment[] = [
  { id: 'adj-1', reference: 'ADJ-IN-PPE-2026-00001', type: 'IN', ppeItemId: 'ppe-1', locationId: 'loc-1', batchNumber: 'B-26-001', quantityDelta: 50, reasonCategory: 'Manual Correction', reason: 'Physical inventory audit variance adjustment', status: 'pending', submittedBy: 'emp-8', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'adj-2', reference: 'ADJ-IN-PPE-2026-00002', type: 'IN', ppeItemId: 'ppe-6', locationId: 'loc-1', batchNumber: 'B-26-004', quantityDelta: 100, reasonCategory: 'New Delivery', reason: 'Emergency shipment direct delivery from vendor', status: 'applied', submittedBy: 'emp-8', createdAt: '2026-09-02T08:00:00Z' },
  { id: 'adj-3', reference: 'ADJ-OUT-PPE-2026-00003', type: 'OUT', ppeItemId: 'ppe-4', locationId: 'loc-1', batchNumber: 'B-26-005', quantityDelta: -2, reasonCategory: 'Physical Damage', reason: 'Packaging breached by warehouse water leakage', status: 'applied', submittedBy: 'emp-8', createdAt: '2026-09-02T09:00:00Z' },
];

export const mockScrapEntries: ScrapEntry[] = [
  { id: 'scr-1', ppeItemId: 'ppe-1', locationId: 'loc-6', quantity: 1, reason: 'Severe crack from heavy impact at scaffold area', reversed: false, scrappedBy: 'emp-8', createdAt: '2026-08-20T10:00:00Z' },
  { id: 'scr-2', ppeItemId: 'ppe-4', locationId: 'loc-6', quantity: 2, reason: 'Outsole delamination after chemical contact', reversed: false, scrappedBy: 'emp-8', createdAt: '2026-08-25T10:00:00Z' },
  { id: 'scr-3', ppeItemId: 'ppe-8', locationId: 'loc-6', quantity: 1, reason: 'Torn during welding activity', reversed: true, reversedBy: 'emp-1', reversedAt: '2026-08-26T10:00:00Z', reversalReason: 'Repaired by HSE fabric maintenance team', scrappedBy: 'emp-8', createdAt: '2026-08-22T10:00:00Z' },
];

export const mockExpirySettings: ModuleSettings = {
  generalLeadTimeDays: 30,
  categoryOverrides: [
    { riskCategory: 'I', leadTimeDays: 15 },
    { riskCategory: 'II', leadTimeDays: 30 },
    { riskCategory: 'III', leadTimeDays: 60 },
  ],
  recentIssuanceWindowDays: 90,
  trashRetentionDays: 90,
  siteLeadTimes: [
    { site: 'North Field', leadTimeDays: 45 },
    { site: 'South Field', leadTimeDays: 45 },
  ],
};

export const mockOpeningBalances: OpeningBalance[] = [
  {
    id: 'ob-1',
    locationId: 'loc-1',
    referenceDate: '2026-08-01',
    notes: 'Initial physical count for main warehouse kickoff',
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
    notes: 'Draft physical audit for Site B',
    status: 'Draft',
    preparedBy: 'emp-8',
    createdAt: '2026-09-01T08:00:00Z',
    lines: [
      { id: 'obl-3', ppeItemId: 'ppe-1', batchNumber: 'B-26-003', expiryDate: '2028-09-01', quantity: 20 }
    ]
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    entityType: 'OpeningBalance',
    entityId: 'ob-1',
    action: 'APPROVED',
    details: 'Opening balance approved by HSE Supervisor',
    performedBy: 'emp-2',
    user: 'John Doe (HSE Super)',
    objectType: 'OpeningBalance',
    objectReference: 'ob-1',
    timestamp: '2026-08-02T10:00:00Z'
  },
  {
    id: 'aud-2',
    entityType: 'StockAdjustment',
    entityId: 'adj-2',
    action: 'APPLIED',
    details: 'Stock IN applied: +100 RESP-P3',
    performedBy: 'emp-8',
    user: 'Mike Store Keeper',
    objectType: 'StockAdjustment',
    objectReference: 'ADJ-IN-PPE-2026-00002',
    timestamp: '2026-09-02T08:00:00Z'
  },
  {
    id: 'aud-3',
    entityType: 'Issuance',
    entityId: 'iss-2',
    action: 'ISSUED',
    details: 'Issued 1 VEST-YEL to Ali Mahmoud',
    performedBy: 'emp-8',
    user: 'Mike Store Keeper',
    objectType: 'Issuance',
    objectReference: 'ISS-2026-00002',
    timestamp: '2026-08-01T09:30:00Z'
  }
];

// Epic 11: units that exist besides the PPE-056 defaults (created by the free-text unit migration for 'Box').
// The defaults PCS, PRS and SET are added once by seedDefaultUnits at store setup.
export const mockUnits: UnitOfMeasure[] = [
  { id: 'uom-box', code: 'BOX', name: 'Box', symbol: 'box', active: true, deletedAt: null, createdAt: '2026-08-01T08:00:00Z', createdBy: 'migration' },
];

// Epic 12: serial units of the demo tracked item (GASDET-4G), all In Stock at Main Warehouse.
export const mockSerialUnits: SerialUnit[] = ['SN-GD-1001', 'SN-GD-1002', 'SN-GD-1003'].map((serial, i) => ({
  id: `sn-${i + 1}`,
  ppeItemId: 'ppe-16',
  serial,
  status: 'In Stock' as const,
  locationId: 'loc-1',
  lastLocationId: 'loc-1',
  batchNumber: 'B-26-006',
  createdAt: '2026-08-02T10:00:00Z',
  createdBy: 'emp-8',
  updatedAt: '2026-08-02T10:00:00Z',
  updatedBy: 'emp-8',
}));

export const mockSerialEvents: SerialEvent[] = mockSerialUnits.map((u, i) => ({
  id: `sev-${i + 1}`,
  serialUnitId: u.id,
  type: 'Stock in' as const,
  date: u.createdAt,
  userId: 'emp-8',
  toLocationId: 'loc-1',
  reference: 'B-26-006',
}));
