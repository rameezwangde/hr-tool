import { getContracts, getStaffProfiles, getPermanentClauses } from "./storage.js";

export const INSURANCE_SETTINGS_KEY = "socialInsuranceSettingsV1";

// Standard statutory contribution rates in Vietnam (as defined in contracts Article 11)
// Employer: Social Insurance (17.5%), Health Insurance (3%), Unemployment Insurance (1%) = Total 21.5%
// Employee: Social Insurance (8%), Health Insurance (1.5%), Unemployment Insurance (1%) = Total 10.5%
export const DEFAULT_INSURANCE_RATES = {
  // Employer rates (%)
  employerSocialPct: 17.5,
  employerHealthPct: 3.0,
  employerUnemploymentPct: 1.0,

  // Employee rates (%)
  employeeSocialPct: 8.0,
  employeeHealthPct: 1.5,
  employeeUnemploymentPct: 1.0,
};

export const getInsuranceSettings = () => {
  try {
    const saved = localStorage.getItem(INSURANCE_SETTINGS_KEY);
    return saved ? { ...DEFAULT_INSURANCE_RATES, ...JSON.parse(saved) } : { ...DEFAULT_INSURANCE_RATES };
  } catch {
    return { ...DEFAULT_INSURANCE_RATES };
  }
};

export const saveInsuranceSettings = (settings) => {
  localStorage.setItem(INSURANCE_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("insuranceSettingsChanged"));
};

export const formatMoneyVnd = (value) => {
  const num = Math.round(Number(value) || 0);
  return `${new Intl.NumberFormat("en-US").format(num)} VND`;
};

export const parseNumber = (val) => {
  if (!val) return 0;
  return Number(String(val).replace(/,/g, "")) || 0;
};

/**
 * Parses contract clauses text or rates to verify employer insurance percentages.
 * e.g. "Social Insurance (17.5%), Health Insurance (3%), Unemployment Insurance (1%)"
 */
export const extractRatesFromContract = (contract, defaultSettings = DEFAULT_INSURANCE_RATES) => {
  const clause = String(contract?.employerInsuranceContributionClause || "");
  let employerSocialPct = defaultSettings.employerSocialPct;
  let employerHealthPct = defaultSettings.employerHealthPct;
  let employerUnemploymentPct = defaultSettings.employerUnemploymentPct;

  const socialMatch = clause.match(/Social Insurance \(?([0-9.]+)%?\)?/i) || clause.match(/Bảo hiểm xã hội \(?([0-9.]+)%?\)?/i);
  if (socialMatch && !isNaN(parseFloat(socialMatch[1]))) {
    employerSocialPct = parseFloat(socialMatch[1]);
  }

  const healthMatch = clause.match(/Health Insurance \(?([0-9.]+)%?\)?/i) || clause.match(/Bảo hiểm y tế \(?([0-9.]+)%?\)?/i);
  if (healthMatch && !isNaN(parseFloat(healthMatch[1]))) {
    employerHealthPct = parseFloat(healthMatch[1]);
  }

  const unempMatch = clause.match(/Unemployment Insurance \(?([0-9.]+)%?\)?/i) || clause.match(/Bảo hiểm thất nghiệp \(?([0-9.]+)%?\)?/i);
  if (unempMatch && !isNaN(parseFloat(unempMatch[1]))) {
    employerUnemploymentPct = parseFloat(unempMatch[1]);
  }

  // Employee rates from contract fields or defaults
  const employeeSocialPct = contract?.socialInsurancePct !== undefined ? parseNumber(contract.socialInsurancePct) : defaultSettings.employeeSocialPct;
  const employeeHealthPct = contract?.healthInsurancePct !== undefined ? parseNumber(contract.healthInsurancePct) : defaultSettings.employeeHealthPct;
  const employeeUnemploymentPct = contract?.unemploymentInsurancePct !== undefined ? parseNumber(contract.unemploymentInsurancePct) : defaultSettings.employeeUnemploymentPct;

  return {
    employerSocialPct,
    employerHealthPct,
    employerUnemploymentPct,
    employerTotalPct: employerSocialPct + employerHealthPct + employerUnemploymentPct,
    employeeSocialPct,
    employeeHealthPct,
    employeeUnemploymentPct,
    employeeTotalPct: employeeSocialPct + employeeHealthPct + employeeUnemploymentPct,
  };
};

/**
 * Builds a unified list of company employees with all insurance details dynamically interlinked from contracts.
 */
export const loadCompanyInsuranceOverview = () => {
  const contracts = getContracts();
  const staffProfiles = getStaffProfiles();
  const settings = getInsuranceSettings();

  // Create a map of staff profile keyed by employeeId and contractNumber
  const profileByEmpId = new Map();
  const profileByContractNo = new Map();

  staffProfiles.forEach((profile) => {
    if (profile.employeeId) profileByEmpId.set(String(profile.employeeId).trim(), profile);
    if (profile.contractNumber) profileByContractNo.set(String(profile.contractNumber).trim(), profile);
  });

  // Track processed to avoid duplicate employee cards
  const employeeRecords = [];
  const processedKeys = new Set();

  // 1. First prioritize active and signed staff profiles
  staffProfiles.forEach((profile) => {
    const empId = String(profile.employeeId || "").trim();
    const contractNo = String(profile.contractNumber || "").trim();
    const uniqueKey = empId || contractNo || profile.fullName;
    if (!uniqueKey || processedKeys.has(uniqueKey)) return;
    processedKeys.add(uniqueKey);

    // Look for matching contract
    const contract = contracts.find((c) =>
      (contractNo && String(c.contractNumber || "").trim() === contractNo) ||
      (empId && String(c.employeeId || "").trim() === empId) ||
      (profile.fullName && String(c.fullName || "").trim().toLowerCase() === String(profile.fullName).trim().toLowerCase())
    );

    const merged = { ...contract, ...profile };
    const record = calculateEmployeeInsuranceRecord(merged, contract, profile, settings);
    employeeRecords.push(record);
  });

  // 2. Also check contracts that might not have a profile record yet
  contracts.forEach((contract) => {
    const contractNo = String(contract.contractNumber || "").trim();
    const empId = String(contract.employeeId || "").trim();
    const uniqueKey = empId || contractNo || contract.fullName;
    if (!uniqueKey || processedKeys.has(uniqueKey)) return;
    processedKeys.add(uniqueKey);

    const profile = profileByContractNo.get(contractNo) || (empId ? profileByEmpId.get(empId) : null);
    const merged = { ...profile, ...contract };
    const record = calculateEmployeeInsuranceRecord(merged, contract, profile, settings);
    employeeRecords.push(record);
  });

  return employeeRecords;
};

/**
 * Computes exact insurance contribution amounts for an employee based directly on their contract base salary and clauses.
 */
export const calculateEmployeeInsuranceRecord = (data, contract, profile, settings) => {
  const rates = extractRatesFromContract(contract, settings);

  // Insurance base calculation: base salary from contract (or profile fallback)
  const baseSalary = parseNumber(data.baseSalary);
  const grossSalary = parseNumber(data.grossSalary) || baseSalary;

  // Employer Contributions (Budget spent by Company)
  const employerSocialAmount = baseSalary * (rates.employerSocialPct / 100);
  const employerHealthAmount = baseSalary * (rates.employerHealthPct / 100);
  const employerUnemploymentAmount = baseSalary * (rates.employerUnemploymentPct / 100);
  const employerTotalCost = employerSocialAmount + employerHealthAmount + employerUnemploymentAmount;

  // Employee Deductions (from contract/salary slip)
  // If contract already has computed amounts, cross-reference them
  const employeeSocialAmount = data.socialInsuranceAmount !== undefined && data.socialInsuranceAmount > 0
    ? parseNumber(data.socialInsuranceAmount)
    : baseSalary * (rates.employeeSocialPct / 100);

  const employeeHealthAmount = data.healthInsuranceAmount !== undefined && data.healthInsuranceAmount > 0
    ? parseNumber(data.healthInsuranceAmount)
    : baseSalary * (rates.employeeHealthPct / 100);

  const employeeUnemploymentAmount = data.unemploymentInsuranceAmount !== undefined && data.unemploymentInsuranceAmount > 0
    ? parseNumber(data.unemploymentInsuranceAmount)
    : baseSalary * (rates.employeeUnemploymentPct / 100);

  const employeeTotalDeduction = employeeSocialAmount + employeeHealthAmount + employeeUnemploymentAmount;

  // Total Combined Insurance package (Employer Budget + Employee share)
  const combinedTotalInsurance = employerTotalCost + employeeTotalDeduction;

  const probationMonths = data.insuranceStartAfterMonths || data.probationPeriod || 2;
  const contractStatus = data.contractStatus || contract?.status || (contract ? "Signed" : "Draft");
  const employmentStatus = data.employmentStatus || "Active";

  return {
    id: data.employeeId || data.contractNumber || Math.random().toString(),
    employeeId: data.employeeId || "—",
    fullName: data.fullName || "Unnamed Employee",
    jobTitle: data.jobTitle || data.position || "Staff",
    department: data.department || "General",
    workLocation: data.workLocation || data.workLocation1 || data.branch || "Head Office",
    contractNumber: data.contractNumber || (contract?.contractNumber) || "No Contract Linked",
    contractDuration: data.contractDuration || "12 Months",
    contractType: data.contractType || "Labor Contract",
    contractDate: data.contractDate || contract?.createdAt || "—",
    contractStatus,
    employmentStatus,
    probationMonths,
    baseSalary,
    grossSalary,

    // Rates breakdown
    rates,

    // Company Budget Spent (Employer)
    employerSocialAmount,
    employerHealthAmount,
    employerUnemploymentAmount,
    employerTotalCost,

    // Employee Deductions
    employeeSocialAmount,
    employeeHealthAmount,
    employeeUnemploymentAmount,
    employeeTotalDeduction,

    // Overall Total
    combinedTotalInsurance,

    // Raw sources for verification / link-back
    hasContract: Boolean(contract),
    hasProfile: Boolean(profile),
  };
};

/**
 * Aggregates company-wide insurance metrics for quick executive/HR overview
 */
export const calculateCumulativeInsuranceBudget = (records) => {
  const activeRecords = records.filter(
    (r) => !["inactive", "terminated", "resigned"].includes(String(r.employmentStatus).toLowerCase())
  );

  const totalEmployees = records.length;
  const activeCount = activeRecords.length;

  const totalBaseSalary = activeRecords.reduce((sum, r) => sum + r.baseSalary, 0);
  const totalCompanyBudgetSpent = activeRecords.reduce((sum, r) => sum + r.employerTotalCost, 0);
  const totalEmployeeDeductions = activeRecords.reduce((sum, r) => sum + r.employeeTotalDeduction, 0);
  const totalCombinedInsuranceFund = totalCompanyBudgetSpent + totalEmployeeDeductions;

  // Breakdown of company contribution
  const companySocialFund = activeRecords.reduce((sum, r) => sum + r.employerSocialAmount, 0);
  const companyHealthFund = activeRecords.reduce((sum, r) => sum + r.employerHealthAmount, 0);
  const companyUnemploymentFund = activeRecords.reduce((sum, r) => sum + r.employerUnemploymentAmount, 0);

  // Breakdown of employee deductions
  const employeeSocialFund = activeRecords.reduce((sum, r) => sum + r.employeeSocialAmount, 0);
  const employeeHealthFund = activeRecords.reduce((sum, r) => sum + r.employeeHealthAmount, 0);
  const employeeUnemploymentFund = activeRecords.reduce((sum, r) => sum + r.employeeUnemploymentAmount, 0);

  return {
    totalEmployees,
    activeCount,
    totalBaseSalary,
    totalCompanyBudgetSpent,
    totalEmployeeDeductions,
    totalCombinedInsuranceFund,
    companySocialFund,
    companyHealthFund,
    companyUnemploymentFund,
    employeeSocialFund,
    employeeHealthFund,
    employeeUnemploymentFund,
  };
};
