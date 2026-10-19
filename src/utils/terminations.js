import { getStaffProfiles, updateStaffProfile } from "./storage";
import { getExitCases, saveExitCase, createExitCase } from "./exitInterviews";

export const TERMINATION_CASES_KEY = "terminationCasesV1";
export const TERMINATION_NOTIFICATIONS_KEY = "terminationNotificationsV1";

export const TERMINATION_TYPES = [
  "Performance Related",
  "Misconduct",
  "Attendance",
  "Policy Violation",
  "Redundancy / Restructuring",
  "End of Contract",
  "Probation Termination",
  "Position Elimination",
  "Mutual Separation",
  "Other"
];

export const TERMINATION_NATURES = [
  "With Notice",
  "Immediate",
  "End of Contract",
  "Mutual Separation"
];

export const TERMINATION_STATUSES = [
  "Draft",
  "Under HR Review",
  "Awaiting Approval",
  "Approved",
  "Rejected",
  "Scheduled",
  "Notice Period",
  "Termination Executed",
  "Offboarding",
  "Completed",
  "Cancelled"
];

export const TERMINATION_STAGES = [
  "Case Created",
  "HR Review",
  "Approval",
  "Employee Notification",
  "Termination Effective",
  "Offboarding",
  "Completed"
];

const readStorage = (key, fallback) => {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
};

const writeStorage = (key, data) => {
  if (typeof localStorage === "undefined") return data;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("terminationDataChanged", { detail: { key } }));
    return data;
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
    return data;
  }
};

export const notifyTerminationsChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("terminationsChanged"));
  }
};

// Seed demonstration cases
export const SEED_TERMINATION_CASES = [
  {
    id: "TERM-2026-001",
    employeeId: "EMP-1004",
    employeeName: "Tariq Mahmoud",
    employeePhoto: "",
    designation: "Senior Grill Cook",
    department: "Kitchen Staff",
    manager: "Rami Haddad",
    joiningDate: "2023-05-18",
    employmentType: "Full-Time Permanent",
    currentEmploymentStatus: "Notice Period",

    terminationType: "Attendance",
    terminationNature: "With Notice",
    status: "Notice Period", // "Draft", "Under HR Review", "Awaiting Approval", "Approved", "Rejected", "Scheduled", "Notice Period", "Termination Executed", "Offboarding", "Completed", "Cancelled"
    currentStage: "Termination Effective",

    primaryReason: "Chronic unexcused shift tardiness and absence during peak holiday service.",
    detailedReason: "Employee accumulated repeated undocumented absences across July–September 2026, violating kitchen operational continuity standards. Multiple counselling sessions and formal warnings issued without sustained improvement.",
    initiatedDate: "2026-09-25",
    proposedLastWorkingDay: "2026-10-31",
    effectiveDate: "2026-10-31",
    noticePeriod: "30 Days",
    initiatedBy: "Rami Haddad (Branch Manager)",
    hrRepresentative: "Sara Jenkins (HR Lead)",
    internalHrNotes: "Confidential: Replacement grill cook recruitment has commenced under expedited job requisitions. Employee was briefed with union/legal witness present.",
    createdAt: "2026-09-25T09:00:00.000Z",
    updatedAt: "2026-10-15T16:00:00.000Z",

    // HR Review Checklist
    hrReview: {
      status: "Approved", // "Pending", "Approved", "Changes Requested", "On Hold", "Cancelled"
      reviewerName: "Sara Jenkins",
      reviewedAt: "2026-09-26T14:30:00Z",
      comments: "All documentation, previous warnings, and 30-day contractual notice verified in compliance with internal policy.",
      checklist: {
        reasonDocumented: true,
        supportingRecordsReviewed: true,
        previousHrActionsReviewed: true,
        contractChecked: true,
        noticeRequirementsReviewed: true,
        outstandingLeaveReviewed: true,
        requiredApprovalsIdentified: true,
        documentationAvailable: true
      }
    },

    // Approval Workflow Chain
    approvals: [
      {
        id: "appr-1",
        role: "Employee Manager",
        approverName: "Rami Haddad",
        status: "Approved",
        decisionDate: "2026-09-27T10:00:00Z",
        comment: "Repeated shift disruptions have severely impacted weekend kitchen orders. Termination supported."
      },
      {
        id: "appr-2",
        role: "HR Manager",
        approverName: "Sara Jenkins",
        status: "Approved",
        decisionDate: "2026-09-28T11:30:00Z",
        comment: "Documented history of progressive discipline meets procedural requirements."
      },
      {
        id: "appr-3",
        role: "Department Head",
        approverName: "Executive Head Chef",
        status: "Approved",
        decisionDate: "2026-09-29T15:00:00Z",
        comment: "Endorsed. Branch cross-coverage scheduled."
      },
      {
        id: "appr-4",
        role: "Senior Management",
        approverName: "Operations Director",
        status: "Approved",
        decisionDate: "2026-09-30T09:00:00Z",
        comment: "Final executive approval granted."
      }
    ],

    // Supporting Records / Evidence links
    supportingRecords: [
      {
        id: "sup-1",
        type: "Written Warning",
        title: "First Written Warning: Unexcused Weekend Absence",
        date: "2026-07-14",
        source: "Staff Profiles / Disciplinary",
        linkText: "View Warning Letter",
        summary: "Formal written reprimand issued after 3 consecutive missed shifts without notification."
      },
      {
        id: "sup-2",
        type: "Performance Improvement Plan",
        title: "30-Day Attendance & Punctuality PIP",
        date: "2026-08-01 – 2026-08-31",
        source: "HR Operations / Performance",
        linkText: "View PIP File",
        summary: "Target: 100% on-time check-in. Employee achieved 74% attendance adherence during trial."
      },
      {
        id: "sup-3",
        type: "Attendance Record",
        title: "Bi-Monthly Attendance & Biometric Log Gaps",
        date: "2026-09-15",
        source: "Payroll / Attendance",
        linkText: "View Biometric Records",
        summary: "12 recorded late arrivals (>30 min) and 4 unapproved absences."
      }
    ],

    // Documents
    documents: [
      {
        id: "doc-t1",
        name: "Formal_Notice_of_Termination_Tariq_Mahmoud.pdf",
        category: "Termination Letter",
        uploadedBy: "Sara Jenkins (HR)",
        uploadDate: "2026-10-01",
        visibility: "Restricted HR",
        status: "Issued"
      },
      {
        id: "doc-t2",
        name: "Signed_Written_Warning_Notice_July2026.pdf",
        category: "Warning Letters",
        uploadedBy: "Rami Haddad",
        uploadDate: "2026-07-15",
        visibility: "Restricted HR",
        status: "Verified"
      },
      {
        id: "doc-t3",
        name: "PIP_Failure_Evaluation_Report.pdf",
        category: "PIP Documents",
        uploadedBy: "Sara Jenkins (HR)",
        uploadDate: "2026-09-02",
        visibility: "Restricted HR",
        status: "Verified"
      }
    ],

    // Termination Meeting
    meeting: {
      status: "Completed", // "Not Scheduled", "Scheduled", "Completed", "Cancelled"
      meetingDate: "2026-10-01",
      meetingTime: "11:00 AM",
      location: "Greek Souvlaki Central Office, Meeting Room 2",
      meetingType: "In Person",
      participants: ["Tariq Mahmoud", "Rami Haddad (Manager)", "Sara Jenkins (HR Lead)"],
      notes: "Termination decision and contractual 30-day notice terms communicated. Handover requirements and company asset return schedule explained in detail.",
      employeeResponse: "Employee acknowledged receipt of the notice letter and agreed to work through the notice period professionally.",
      completedBy: "Sara Jenkins",
      completedAt: "2026-10-01T12:00:00Z"
    },

    // Termination Letter & Issuance
    terminationLetter: {
      status: "Issued", // "Draft", "Awaiting Review", "Approved", "Issued"
      preparedBy: "Sara Jenkins",
      approvedBy: "Operations Director",
      issuedDate: "2026-10-01",
      contentSummary: "Official 30-day notice of employment termination effective 31 October 2026 with full final settlement calculation.",
      fileName: "Formal_Notice_of_Termination_Tariq_Mahmoud.pdf"
    },

    // Employee Acknowledgement
    acknowledgement: {
      status: "Employee Acknowledged", // "Employee Acknowledged", "Employee Declined to Acknowledge", "Acknowledgement Not Required"
      communicatedDate: "2026-10-01",
      communicatedTime: "11:30 AM",
      communicatedBy: "Sara Jenkins",
      method: "In-Person Meeting & Hard Copy Handover",
      notes: "Employee signed physical copy acknowledging receipt of the notice."
    },

    // Notice Period Tracking
    noticeTracking: {
      noticeStart: "2026-10-01",
      noticeEnd: "2026-10-31",
      lastWorkingDay: "2026-10-31",
      status: "Notice Active" // "Notice Active", "Notice Completed", "Waived"
    },

    // Settlement / Pay Tracking
    settlementTracking: [
      { id: "s-1", item: "Salary Processing", status: "Processing", remarks: "Prorated October salary" },
      { id: "s-2", item: "Unused Leave Review", status: "Reviewed", remarks: "3 days accrued leave encashment approved" },
      { id: "s-3", item: "Pending Expenses", status: "Completed", remarks: "No claims outstanding" },
      { id: "s-4", item: "Company Advances", status: "Completed", remarks: "Zero advances" },
      { id: "s-5", item: "Loans", status: "Completed", remarks: "No loans" },
      { id: "s-6", item: "End-of-Service / Gratuity Processing", status: "Processing", remarks: "Gratuity being processed under 3-year term" },
      { id: "s-7", item: "Deductions", status: "Completed", remarks: "None" }
    ],

    // Exit Interview configuration
    exitInterviewRequirement: "Optional", // "Required", "Optional", "Not Required"

    // Linked Offboarding Case
    linkedExitCaseId: "EXIT-2026-003",
    offboardingProgress: 45,

    // Activity Timeline
    activity: [
      {
        id: "act-t1",
        action: "Termination case created",
        performedBy: "Rami Haddad (Manager)",
        date: "2026-09-25",
        time: "09:00 AM",
        details: "Initiated termination on grounds of attendance non-compliance."
      },
      {
        id: "act-t2",
        action: "HR review completed and verified",
        performedBy: "Sara Jenkins (HR)",
        date: "2026-09-26",
        time: "02:30 PM",
        details: "Verified disciplinary trail and contractual notice requirements."
      },
      {
        id: "act-t3",
        action: "All mandatory management approvals completed",
        performedBy: "Operations Director",
        date: "2026-09-30",
        time: "09:00 AM",
        details: "Case approved to proceed to employee notification."
      },
      {
        id: "act-t4",
        action: "Termination meeting completed & letter issued",
        performedBy: "Sara Jenkins (HR)",
        date: "2026-10-01",
        time: "11:30 AM",
        details: "Employee met in person; hard copy letter issued and acknowledged."
      },
      {
        id: "act-t5",
        action: "Offboarding case automatically generated & linked (EXIT-2026-003)",
        performedBy: "System / HR",
        date: "2026-10-01",
        time: "11:45 AM",
        details: "Connected to Exit Interviews & Offboarding module for handover and clearances."
      }
    ]
  },
  {
    id: "TERM-2026-002",
    employeeId: "EMP-1006",
    employeeName: "Hassan Ali",
    employeePhoto: "",
    designation: "Wrapping Specialist",
    department: "Kitchen Staff",
    manager: "Rami Haddad",
    joiningDate: "2023-06-20",
    employmentType: "Full-Time Permanent",
    currentEmploymentStatus: "Active",

    terminationType: "Policy Violation",
    terminationNature: "Immediate",
    status: "Awaiting Approval",
    currentStage: "Approval",

    primaryReason: "Gross violation of food safety hygiene protocol and tampering with kitchen temperature logs.",
    detailedReason: "Audited falsification of cooler temperature HACCP records during municipal health inspection. Immediate risk to operating license.",
    initiatedDate: "2026-10-18",
    proposedLastWorkingDay: "2026-10-20",
    effectiveDate: "2026-10-20",
    noticePeriod: "Immediate / Zero Notice",
    initiatedBy: "Rami Haddad (Branch Manager)",
    hrRepresentative: "Sara Jenkins (HR Lead)",
    internalHrNotes: "Immediate summary termination recommendation under gross misconduct food safety regulations.",
    createdAt: "2026-10-18T10:00:00.000Z",
    updatedAt: "2026-10-19T14:00:00.000Z",

    hrReview: {
      status: "Approved",
      reviewerName: "Sara Jenkins",
      reviewedAt: "2026-10-18T14:00:00Z",
      comments: "Health inspection audit report and CCTV footage confirm incident. Escalated for emergency executive approval.",
      checklist: {
        reasonDocumented: true,
        supportingRecordsReviewed: true,
        previousHrActionsReviewed: true,
        contractChecked: true,
        noticeRequirementsReviewed: true,
        outstandingLeaveReviewed: true,
        requiredApprovalsIdentified: true,
        documentationAvailable: true
      }
    },

    approvals: [
      {
        id: "appr-201",
        role: "Employee Manager",
        approverName: "Rami Haddad",
        status: "Approved",
        decisionDate: "2026-10-18T15:00:00Z",
        comment: "Zero tolerance for hygiene falsification. Supported."
      },
      {
        id: "appr-202",
        role: "HR Manager",
        approverName: "Sara Jenkins",
        status: "Approved",
        decisionDate: "2026-10-18T16:00:00Z",
        comment: "Incident report and supervisor statement attached."
      },
      {
        id: "appr-203",
        role: "Department Head",
        approverName: "Executive Head Chef",
        status: "Pending",
        decisionDate: "",
        comment: ""
      },
      {
        id: "appr-204",
        role: "Senior Management",
        approverName: "Operations Director",
        status: "Pending",
        decisionDate: "",
        comment: ""
      }
    ],

    supportingRecords: [
      {
        id: "sup-201",
        type: "Incident Report",
        title: "Municipal Food Safety Inspection Audit Failure & Log Tampering",
        date: "2026-10-17",
        source: "Kitchen Quality & Safety",
        linkText: "View Audit Log",
        summary: "Cold meat storage unit temperature recorded as 3°C on sheet, but thermometer measured 11°C."
      }
    ],

    documents: [
      {
        id: "doc-t201",
        name: "HACCP_Incident_Report_17Oct2026.pdf",
        category: "Incident Reports",
        uploadedBy: "Rami Haddad",
        uploadDate: "2026-10-18",
        visibility: "Restricted HR",
        status: "Verified"
      }
    ],

    meeting: {
      status: "Scheduled",
      meetingDate: "2026-10-20",
      meetingTime: "02:00 PM",
      location: "Greek Souvlaki - Branch 1 Office",
      meetingType: "In Person",
      participants: ["Hassan Ali", "Rami Haddad (Manager)", "Sara Jenkins (HR Lead)"],
      notes: "Scheduled formal hearing and termination delivery meeting.",
      employeeResponse: "",
      completedBy: "",
      completedAt: ""
    },

    terminationLetter: {
      status: "Awaiting Review",
      preparedBy: "Sara Jenkins",
      approvedBy: "",
      issuedDate: "",
      contentSummary: "Summary termination letter citing gross safety breach.",
      fileName: "Immediate_Termination_Notice_Hassan_Ali.pdf"
    },

    acknowledgement: {
      status: "Acknowledgement Not Required",
      communicatedDate: "",
      communicatedTime: "",
      communicatedBy: "",
      method: "",
      notes: "Pending meeting."
    },

    noticeTracking: {
      noticeStart: "2026-10-20",
      noticeEnd: "2026-10-20",
      lastWorkingDay: "2026-10-20",
      status: "Immediate"
    },

    settlementTracking: [
      { id: "s-201", item: "Salary Processing", status: "Processing", remarks: "Days worked in October" },
      { id: "s-202", item: "Unused Leave Review", status: "Pending", remarks: "To be calculated" },
      { id: "s-203", item: "Pending Expenses", status: "Completed", remarks: "None" },
      { id: "s-204", item: "Company Advances", status: "Completed", remarks: "None" }
    ],

    exitInterviewRequirement: "Not Required",
    linkedExitCaseId: "",
    offboardingProgress: 0,

    activity: [
      {
        id: "act-t201",
        action: "Termination case created",
        performedBy: "Rami Haddad (Manager)",
        date: "2026-10-18",
        time: "10:00 AM",
        details: "Created immediate termination case for gross safety non-compliance."
      },
      {
        id: "act-t202",
        action: "HR review completed & approved",
        performedBy: "Sara Jenkins (HR)",
        date: "2026-10-18",
        time: "02:00 PM",
        details: "Case verified and forwarded into emergency approval queue."
      }
    ]
  }
];

export const getTerminationCases = () => {
  const existing = readStorage(TERMINATION_CASES_KEY, null);
  if (existing && Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  writeStorage(TERMINATION_CASES_KEY, SEED_TERMINATION_CASES);
  return SEED_TERMINATION_CASES;
};

export const getTerminationCaseById = (id) => {
  const cases = getTerminationCases();
  return cases.find((c) => c.id === id) || null;
};

export const saveTerminationCase = (termCase) => {
  const cases = getTerminationCases();
  const index = cases.findIndex((c) => c.id === termCase.id);
  const now = new Date().toISOString();
  const caseToSave = {
    ...termCase,
    updatedAt: now
  };

  let updated;
  if (index !== -1) {
    updated = cases.map((c) => (c.id === termCase.id ? caseToSave : c));
  } else {
    updated = [caseToSave, ...cases];
  }

  writeStorage(TERMINATION_CASES_KEY, updated);
  notifyTerminationsChanged();
  return caseToSave;
};

export const logTerminationActivity = (caseId, action, performedBy, details = "") => {
  const termCase = getTerminationCaseById(caseId);
  if (!termCase) return;

  const now = new Date();
  const newActivity = {
    id: `act-term-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    performedBy: performedBy || "HR Staff",
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    details
  };

  const updatedCase = {
    ...termCase,
    activity: [newActivity, ...(termCase.activity || [])]
  };

  saveTerminationCase(updatedCase);
};

export const createTerminationCase = (formData, user) => {
  const cases = getTerminationCases();
  const year = new Date().getFullYear();
  const nextNum = (cases.length + 1).toString().padStart(3, "0");
  const caseId = `TERM-${year}-${nextNum}`;
  const now = new Date().toISOString();
  const todayStr = now.slice(0, 10);
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || "HR Staff";

  // Prevent multiple active termination cases for the same employee
  const activeExisting = cases.find(
    (c) => c.employeeId === formData.employeeId && c.status !== "Completed" && c.status !== "Cancelled"
  );
  if (activeExisting) {
    throw new Error(`An active termination case (${activeExisting.id}) already exists for this employee.`);
  }

  const isImmediate = formData.terminationNature === "Immediate";

  const newCase = {
    id: caseId,
    employeeId: formData.employeeId,
    employeeName: formData.employeeName,
    employeePhoto: formData.employeePhoto || "",
    designation: formData.designation || "Staff",
    department: formData.department || "General",
    manager: formData.manager || "Branch Manager",
    joiningDate: formData.joiningDate || "",
    employmentType: formData.employmentType || "Full-Time Permanent",
    currentEmploymentStatus: "Active",

    terminationType: formData.terminationType || "Performance Related",
    terminationNature: formData.terminationNature || "With Notice",
    status: "Draft",
    currentStage: "Case Created",

    primaryReason: formData.primaryReason || "",
    detailedReason: formData.detailedReason || "",
    initiatedDate: formData.initiatedDate || todayStr,
    proposedLastWorkingDay: formData.proposedLastWorkingDay || (isImmediate ? todayStr : ""),
    effectiveDate: formData.effectiveDate || (isImmediate ? todayStr : ""),
    noticePeriod: isImmediate ? "Immediate" : (formData.noticePeriod || "30 Days"),
    initiatedBy: formData.initiatedBy || userName,
    hrRepresentative: formData.hrRepresentative || userName,
    internalHrNotes: formData.internalHrNotes || "",
    createdAt: now,
    updatedAt: now,

    hrReview: {
      status: "Pending",
      reviewerName: "",
      reviewedAt: "",
      comments: "",
      checklist: {
        reasonDocumented: Boolean(formData.primaryReason),
        supportingRecordsReviewed: false,
        previousHrActionsReviewed: false,
        contractChecked: false,
        noticeRequirementsReviewed: false,
        outstandingLeaveReviewed: false,
        requiredApprovalsIdentified: false,
        documentationAvailable: false
      }
    },

    approvals: [
      {
        id: "appr-1",
        role: "Employee Manager",
        approverName: formData.manager || "Branch Manager",
        status: "Pending",
        decisionDate: "",
        comment: ""
      },
      {
        id: "appr-2",
        role: "HR Manager",
        approverName: "Sara Jenkins",
        status: "Pending",
        decisionDate: "",
        comment: ""
      },
      {
        id: "appr-3",
        role: "Department Head",
        approverName: "Head of Operations",
        status: "Pending",
        decisionDate: "",
        comment: ""
      },
      {
        id: "appr-4",
        role: "Senior Management",
        approverName: "Operations Director",
        status: "Pending",
        decisionDate: "",
        comment: ""
      }
    ],

    supportingRecords: [],
    documents: [],

    meeting: {
      status: "Not Scheduled",
      meetingDate: "",
      meetingTime: "",
      location: "",
      meetingType: "In Person",
      participants: [formData.employeeName, formData.manager || "Manager", userName],
      notes: "",
      employeeResponse: "",
      completedBy: "",
      completedAt: ""
    },

    terminationLetter: {
      status: "Draft",
      preparedBy: userName,
      approvedBy: "",
      issuedDate: "",
      contentSummary: "",
      fileName: ""
    },

    acknowledgement: {
      status: "Acknowledgement Not Required",
      communicatedDate: "",
      communicatedTime: "",
      communicatedBy: "",
      method: "",
      notes: ""
    },

    noticeTracking: {
      noticeStart: todayStr,
      noticeEnd: formData.effectiveDate || todayStr,
      lastWorkingDay: formData.proposedLastWorkingDay || todayStr,
      status: isImmediate ? "Immediate" : "Notice Active"
    },

    settlementTracking: [
      { id: "s-1", item: "Salary Processing", status: "Pending", remarks: "Pending final prorated days" },
      { id: "s-2", item: "Unused Leave Review", status: "Pending", remarks: "To be verified" },
      { id: "s-3", item: "Pending Expenses", status: "Pending", remarks: "Check reimbursement receipts" },
      { id: "s-4", item: "Company Advances", status: "Pending", remarks: "Check payroll balances" },
      { id: "s-5", item: "Loans", status: "Pending", remarks: "Check employee ledger" },
      { id: "s-6", item: "End-of-Service / Gratuity Processing", status: "Pending", remarks: "Awaiting final clearance" },
      { id: "s-7", item: "Deductions", status: "Pending", remarks: "None" }
    ],

    exitInterviewRequirement: "Optional",
    linkedExitCaseId: "",
    offboardingProgress: 0,

    activity: [
      {
        id: `act-term-${Date.now()}`,
        action: "Termination case created",
        performedBy: userName,
        date: todayStr,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        details: `Termination case created for ${formData.employeeName} (${formData.employeeId}). Type: ${formData.terminationType}, Nature: ${formData.terminationNature}.`
      }
    ]
  };

  saveTerminationCase(newCase);
  return newCase;
};

// Automatic Offboarding Integration (Requirement 18 & 19)
export const linkOrCreateOffboardingCase = (termCase, user) => {
  if (!termCase) return null;
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || "HR Staff";

  // Check if offboarding case already exists
  const existingCases = getExitCases();
  const existing = existingCases.find((c) => c.employeeId === termCase.employeeId);

  if (existing) {
    const updatedTerm = {
      ...termCase,
      linkedExitCaseId: existing.id,
      status: "Offboarding",
      currentStage: "Offboarding"
    };
    saveTerminationCase(updatedTerm);
    logTerminationActivity(termCase.id, `Connected to existing Offboarding case (${existing.id})`, userName);
    return existing;
  }

  // Automatically create new Exit/Offboarding Case without manual re-entry
  const newExitCase = createExitCase(
    {
      employeeId: termCase.employeeId,
      employeeName: termCase.employeeName,
      employeePhoto: termCase.employeePhoto || "",
      designation: termCase.designation,
      department: termCase.department,
      manager: termCase.manager,
      joiningDate: termCase.joiningDate,
      exitType: "Termination",
      resignationDate: termCase.initiatedDate || new Date().toISOString().slice(0, 10),
      lastWorkingDay: termCase.effectiveDate || termCase.proposedLastWorkingDay || new Date().toISOString().slice(0, 10),
      noticePeriod: termCase.noticePeriod || "30 Days",
      exitReason: termCase.terminationType,
      hrNotes: `Case linked from Termination Case ${termCase.id}. Primary Reason: ${termCase.primaryReason}`
    },
    user
  );

  // Link in termination case
  const updatedTerm = {
    ...termCase,
    linkedExitCaseId: newExitCase.id,
    status: "Offboarding",
    currentStage: "Offboarding"
  };
  saveTerminationCase(updatedTerm);
  logTerminationActivity(
    termCase.id,
    `Automatically created and connected Offboarding Case (${newExitCase.id})`,
    userName
  );

  return newExitCase;
};

// Execute Termination (Requirement 11, 22)
export const executeTermination = (caseId, user) => {
  const termCase = getTerminationCaseById(caseId);
  if (!termCase) throw new Error("Termination case not found.");

  const allApproved = (termCase.approvals || []).every((a) => a.status === "Approved");
  if (!allApproved) {
    throw new Error("Cannot execute termination: all mandatory management approvals must be approved first.");
  }

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || "HR Staff";
  const now = new Date().toISOString();

  // 1. Update Employee Status in Staff Profiles
  const nextStatus = termCase.terminationNature === "Immediate" ? "Inactive" : "Notice Period";
  updateStaffProfile(termCase.employeeId, {
    employmentStatus: nextStatus,
    exitType: "Termination",
    terminationCaseId: caseId,
    lastWorkingDay: termCase.effectiveDate || termCase.proposedLastWorkingDay
  });

  // 2. Automatically generate/link Offboarding Case
  const exitCase = linkOrCreateOffboardingCase(termCase, user);

  // 3. Update termination record
  const updatedTerm = {
    ...termCase,
    status: termCase.terminationNature === "Immediate" ? "Offboarding" : "Termination Executed",
    currentStage: "Termination Effective",
    currentEmploymentStatus: nextStatus,
    updatedAt: now
  };

  saveTerminationCase(updatedTerm);
  logTerminationActivity(
    caseId,
    `Termination executed by ${userName}. Staff profile status updated to '${nextStatus}'.`,
    userName
  );

  return updatedTerm;
};
