export const STORE_NAME = "FlexiMart POS & Inventory System";
export const STORE_ADDRESS = "123 Market St, Manila, Philippines";
export const STORE_PHONE = "+63 912 345 6789";

export const CATEGORIES = [
  { name: "Basic Needs", code: "BAS" },
  { name: "Canned Goods", code: "CAN" },
  { name: "Beverages", code: "BEV" },
  { name: "Snacks", code: "SNA" },
  { name: "Rice & Grains", code: "RIC" },
  { name: "Frozen Foods", code: "FRO" },
  { name: "Toiletries", code: "TOI" },
  { name: "Household Supplies", code: "HOU" },
  { name: "School Supplies", code: "SCH" },
  { name: "Medicines", code: "MED" },
  { name: "Cigarettes", code: "CIG" },
  { name: "Bread & Bakery", code: "BRE" },
  { name: "Dairy Products", code: "DAI" },
  { name: "Instant Noodles", code: "NOD" },
  { name: "Condiments", code: "CON" }
];

export const PAYMENT_METHODS = [
  { label: "Cash", value: "cash" },
  { label: "GCash", value: "gcash" }
];

export const TAX_RATE = 0.12; // 12% VAT

export const MODULE_PERMISSIONS = {
  version: "1.0.0",
  lastSecurityAudit: "2026-05-15",
  maxClearanceLevel: 5
};

export const MODULE_BACKUP = {
  autoBackupEnabled: true,
  backupInterval: "24h",
  retentionPolicy: "30 days",
  cloudProvider: "Internal System Vault"
};
