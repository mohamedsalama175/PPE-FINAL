export function generateReference(prefix: string): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}${rand}`;
}

export function normalizeLocationType(val: string): string {
  const map: Record<string, string> = {
    "Central Warehouse": "Central_Warehouse",
    "Site Store": "Site_Store",
    "Department Store": "Department_Store",
    "Central_Warehouse": "Central_Warehouse",
    "Site_Store": "Site_Store",
    "Department_Store": "Department_Store",
    "Scrap": "Scrap",
    "Used": "Used",
    "General": "General",
  };
  return map[val] || val;
}

export function normalizeRole(val: string): string {
  const map: Record<string, string> = {
    "Admin": "Admin",
    "HSE Supervisor": "HSE_Supervisor",
    "Direct Supervisor": "Direct_Supervisor",
    "Store Keeper": "Store_Keeper",
    "Employee": "Employee",
    "HSE_Supervisor": "HSE_Supervisor",
    "Direct_Supervisor": "Direct_Supervisor",
    "Store_Keeper": "Store_Keeper",
  };
  return map[val] || val;
}

export function denormalizeRole(val: string): string {
  const map: Record<string, string> = {
    "HSE_Supervisor": "HSE Supervisor",
    "Direct_Supervisor": "Direct Supervisor",
    "Store_Keeper": "Store Keeper",
  };
  return map[val] || val;
}

export function denormalizeLocationType(val: string): string {
  const map: Record<string, string> = {
    "Central_Warehouse": "Central Warehouse",
    "Site_Store": "Site Store",
    "Department_Store": "Department Store",
  };
  return map[val] || val;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
export function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}
