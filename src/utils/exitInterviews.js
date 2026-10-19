import { getStaffProfiles, updateStaffProfile } from "./storage";

export const EXIT_CASES_KEY = "exitCasesV1";
export const EXIT_NOTIFICATIONS_KEY = "exitNotificationsV1";

export const EXIT_TYPES = [
  "Resignation",
  "Termination",
  "Contract Completion",
  "Retirement",
  "Redundancy",
  "Other"
];

export const EXIT_STAGES = [
  "Exit Initiated",
  "Knowledge Handover",
  "Manager Approval",
  "Department Clearances",
  "Exit Interview",
  "HR Final Review",
  "Completed"
];

export const HANDOVER_CATEGORIES = [
  "Active Project",
  "Pending Task",
  "Recurring Responsibility",
  "Client",
  "Vendor",
  "Operational Process",
  "Document / File",
  "System / Tool",
  "Other"
];

export const PRIORITIES = ["High", "Medium", "Low"];

export const DEFAULT_IT_ITEMS = [
  "Company Email",
  "HR System",
  "CRM",
  "ERP",
  "VPN",
  "Cloud Storage",
  "Internal Applications",
  "Shared Accounts",
  "Other Access"
];

export const DEFAULT_ASSET_ITEMS = [
  "Laptop",
  "Desktop",
  "Mobile Phone",
  "SIM",
  "Access Card",
  "Keys",
  "Uniform",
  "Tools",
  "Equipment",
  "Company Vehicle",
  "Other Assets"
];

export const DEFAULT_FINANCE_ITEMS = [
  "Final Salary",
  "Pending Expense Claims",
  "Company Advances",
  "Loans",
  "Leave Settlement",
  "End-of-Service / Gratuity Processing",
  "Other Outstanding Amounts"
];

export const DEFAULT_HR_ITEMS = [
  "Notice period completed",
  "Company documents returned",
  "Required exit documents prepared",
  "Experience/service documentation",
  "Final settlement documentation",
  "Exit interview completed"
];

export const EXIT_REASONS = [
  "Career Growth",
  "Compensation",
  "Management",
  "Work Environment",
  "Workload",
  "Relocation",
  "Personal Reasons",
  "Better Opportunity",
  "Contract Completion",
  "Other"
];

export const SATISFACTION_CATEGORIES = [
  { id: "overallSatisfaction", label: "Overall Job Satisfaction" },
  { id: "managementSupport", label: "Management Support" },
  { id: "workEnvironment", label: "Work Environment" },
  { id: "workLifeBalance", label: "Work-Life Balance" },
  { id: "compensationBenefits", label: "Compensation & Benefits" },
  { id: "careerDevelopment", label: "Career Development" },
  { id: "trainingLearning", label: "Training & Learning" },
  { id: "teamCollaboration", label: "Team Collaboration" },
  { id: "recognition", label: "Recognition" }
];

// Helper to safely read JSON
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

// Helper to write JSON and dispatch event
const writeStorage = (key, data) => {
  if (typeof localStorage === "undefined") return data;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("exitDataChanged", { detail: { key } }));
    return data;
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
    return data;
  }
};

export const notifyExitCasesChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("exitCasesChanged"));
  }
};

// Initial Seed Data to wow the user with a realistic enterprise offboarding state
export const SEED_EXIT_CASES = [
  {
    id: "EXIT-2026-001",
    employeeId: "EMP-1005",
    employeeName: "Elena Rostova",
    employeePhoto: "",
    designation: "Head Pastry & Dough Specialist",
    department: "Kitchen Staff",
    manager: "Rami Haddad",
    joiningDate: "2023-03-15",
    exitType: "Resignation",
    resignationDate: "2026-09-28",
    lastWorkingDay: "2026-10-31",
    noticePeriod: "30 Days",
    exitReason: "Career Growth",
    hrNotes: "Elena has secured a senior executive culinary specialist role at a European boutique hotel group. Outstanding 3-year record, thoroughly cooperative.",
    currentStage: "Knowledge Handover",
    status: "Handover In Progress",
    createdAt: "2026-09-28T10:00:00.000Z",
    updatedAt: "2026-10-18T14:20:00.000Z",

    // Knowledge Handover Items
    handoverItems: [
      {
        id: "HO-101",
        title: "Greek Souvlaki Website & Online Ordering Recipe Specifications",
        category: "Active Project",
        description: "Standardized ingredient proportion matrix, cold fermentation timetables, and vendor specifications for Mediterranean flatbreads.",
        status: "Handover In Progress", // "Pending", "Ready for Handover", "Handover Received", "Verified"
        verificationStatus: "Ready for Handover",
        priority: "High",
        deadline: "2026-10-25",
        handedOverTo: "Ahmed Al Mansoori",
        handedOverToId: "EMP-1001",
        importantNotes: "Client and head office requested final tasting testing before rollout next month.",
        // Project specific extra details
        projectName: "Greek Souvlaki Website & Kitchen Standard Recipe Portal",
        projectDescription: "Digital catalog of dough recipes and allergen tracking for branches.",
        currentProgress: 80,
        remainingWork: "Payment integration recipe synchronization and final QA inspection.",
        clientStakeholder: "Operations Director & Branch Lead",
        importantDependencies: "Central kitchen flour supplier delivery batch certificates.",
        knownIssues: "High humidity proofing times need 10 min adjustment in summer.",
        recommendedNextSteps: "Complete batch consistency run with Ahmed on Monday.",
        links: [
          { label: "SharePoint Recipe Portal", url: "https://sharepoint.internal/recipes/pastry-v4" },
          { label: "Google Drive Master Sheets", url: "https://drive.google.com/drive/folders/internal-dough" }
        ],
        attachments: [
          { name: "SOP_Dough_Fermentation_2026.pdf", size: "2.4 MB", date: "2026-10-12" }
        ]
      },
      {
        id: "HO-102",
        title: "Organic Olive Oil & Flour Supplier Contracts & Contact Directory",
        category: "Vendor",
        description: "Direct importer supplier agreements, monthly order minimums, credit terms (45 days), and primary broker contacts.",
        status: "Handover Received",
        verificationStatus: "Handover Received",
        priority: "High",
        deadline: "2026-10-22",
        handedOverTo: "Chef Maria Santos",
        handedOverToId: "EMP-1003",
        importantNotes: "Volume discount locked until end of Q4. Minimum batch order is 500kg.",
        links: [
          { label: "Vendor Agreement Folder", url: "https://onedrive.internal/procurement/suppliers" }
        ],
        attachments: []
      },
      {
        id: "HO-103",
        title: "Weekly Kitchen Deep-Cleaning Sanitation Checklist",
        category: "Operational Process",
        description: "HACCP hygiene schedule and municipal food inspection readiness protocols.",
        status: "Verified",
        verificationStatus: "Verified",
        priority: "Medium",
        deadline: "2026-10-15",
        handedOverTo: "Tariq Mahmoud",
        handedOverToId: "EMP-1004",
        importantNotes: "Verified by Manager Rami Haddad on Oct 16.",
        links: [],
        attachments: []
      }
    ],

    // Responsibility Transfers
    responsibilities: [
      {
        id: "RESP-1",
        title: "Morning Dough Batch Preparation & Proofing Supervision",
        category: "Operational",
        previousOwner: "Elena Rostova",
        previousOwnerId: "EMP-1005",
        newOwner: "Chef Maria Santos",
        newOwnerId: "EMP-1003",
        transferDate: "2026-10-24",
        status: "Acknowledged", // "Unassigned", "Assigned", "Acknowledged", "Completed"
        notes: "Maria shadowed the process for 3 shifts successfully."
      },
      {
        id: "RESP-2",
        title: "Kitchen Inventory & Dry Ingredient Stock Audits",
        category: "Inventory",
        previousOwner: "Elena Rostova",
        previousOwnerId: "EMP-1005",
        newOwner: "Ahmed Al Mansoori",
        newOwnerId: "EMP-1001",
        transferDate: "2026-10-26",
        status: "Assigned",
        notes: "Pending final review meeting scheduled for Thursday."
      },
      {
        id: "RESP-3",
        title: "Specialty Dessert Menu Development",
        category: "Culinary R&D",
        previousOwner: "Elena Rostova",
        previousOwnerId: "EMP-1005",
        newOwner: "Tariq Mahmoud",
        newOwnerId: "EMP-1004",
        transferDate: "2026-10-28",
        status: "Assigned",
        notes: "Transferring Baklava recipe formulations."
      },
      {
        id: "RESP-4",
        title: "Municipal Food Safety Compliance Reporting",
        category: "Compliance",
        previousOwner: "Elena Rostova",
        previousOwnerId: "EMP-1005",
        newOwner: "",
        newOwnerId: "",
        transferDate: "",
        status: "Unassigned",
        notes: "Awaiting assignment from Branch Manager."
      }
    ],

    // Manager Handover Approval
    managerApproval: {
      status: "Pending", // "Pending", "Approved", "Changes Requested"
      managerName: "Rami Haddad",
      managerId: "EMP-1008",
      decisionDate: "",
      managerComment: "",
      requestChangeHistory: []
    },

    // Department Clearances
    clearance: {
      it: [
        { id: "it-1", item: "Company Email", status: "Scheduled", remarks: "Scheduled to disable on 2026-10-31 18:00", clearedBy: "Sara Jenkins", clearedAt: "" },
        { id: "it-2", item: "HR System", status: "Scheduled", remarks: "Access converted to offboarding portal only", clearedBy: "Sara Jenkins", clearedAt: "" },
        { id: "it-3", item: "CRM", status: "Completed", remarks: "Revoked access to customer list", clearedBy: "Sara Jenkins", clearedAt: "2026-10-18T11:00:00Z" },
        { id: "it-4", item: "ERP", status: "Not Applicable", remarks: "Employee did not have ERP login", clearedBy: "System", clearedAt: "2026-10-18T10:00:00Z" },
        { id: "it-5", item: "VPN", status: "Completed", remarks: "Token disabled", clearedBy: "Sara Jenkins", clearedAt: "2026-10-18T11:05:00Z" },
        { id: "it-6", item: "Cloud Storage", status: "Scheduled", remarks: "Files backed up to corporate archive", clearedBy: "Sara Jenkins", clearedAt: "" },
        { id: "it-7", item: "Internal Applications", status: "Completed", remarks: "Kitchen order display login disabled", clearedBy: "Sara Jenkins", clearedAt: "2026-10-18T11:10:00Z" },
        { id: "it-8", item: "Shared Accounts", status: "Completed", remarks: "Removed from branch shift chat", clearedBy: "Sara Jenkins", clearedAt: "2026-10-18T11:15:00Z" },
        { id: "it-9", item: "Other Access", status: "Not Applicable", remarks: "", clearedBy: "", clearedAt: "" }
      ],
      asset: [
        { id: "asset-1", asset: "Laptop", assetId: "AST-LTP-089", assignedDate: "2023-04-01", returnStatus: "Pending Return", condition: "Good", verifiedBy: "", returnDate: "", notes: "MacBook Air 13 M2" },
        { id: "asset-2", asset: "Access Card", assetId: "AC-DXB-441", assignedDate: "2023-03-15", returnStatus: "Returned", condition: "Good", verifiedBy: "Rami Haddad", returnDate: "2026-10-17", notes: "Main office and central kitchen entry card" },
        { id: "asset-3", asset: "Keys", assetId: "KEY-STR-012", assignedDate: "2023-03-15", returnStatus: "Returned", condition: "Good", verifiedBy: "Rami Haddad", returnDate: "2026-10-17", notes: "Dry pantry & spice locker keys" },
        { id: "asset-4", asset: "Uniform", assetId: "UNI-KIT-05", assignedDate: "2023-03-15", returnStatus: "Returned", condition: "Good", verifiedBy: "Rami Haddad", returnDate: "2026-10-16", notes: "3 Chef coats & aprons returned cleaned" },
        { id: "asset-5", asset: "Tools", assetId: "TLS-PST-01", assignedDate: "2023-04-10", returnStatus: "Returned", condition: "Good", verifiedBy: "Chef Maria Santos", returnDate: "2026-10-16", notes: "Specialized dough kneading cutters" },
        { id: "asset-6", asset: "Mobile Phone", assetId: "N/A", assignedDate: "", returnStatus: "Not Applicable", condition: "N/A", verifiedBy: "", returnDate: "", notes: "Not issued" },
        { id: "asset-7", asset: "Company Vehicle", assetId: "N/A", assignedDate: "", returnStatus: "Not Applicable", condition: "N/A", verifiedBy: "", returnDate: "", notes: "Not issued" }
      ],
      finance: [
        { id: "fin-1", item: "Final Salary", status: "Processing", remarks: "Prorated salary calculated for Oct 1 to Oct 31 (31 days)", clearedBy: "Omar Qasim", clearedAt: "" },
        { id: "fin-2", item: "Pending Expense Claims", status: "Cleared", remarks: "All monthly ingredient transport receipts reimbursed", clearedBy: "Omar Qasim", clearedAt: "2026-10-17T09:00:00Z" },
        { id: "fin-3", item: "Company Advances", status: "Cleared", remarks: "Zero outstanding salary advances", clearedBy: "Omar Qasim", clearedAt: "2026-10-17T09:00:00Z" },
        { id: "fin-4", item: "Loans", status: "Cleared", remarks: "No company personal loans recorded", clearedBy: "Omar Qasim", clearedAt: "2026-10-17T09:00:00Z" },
        { id: "fin-5", item: "Leave Settlement", status: "Processing", remarks: "4.5 accrued unused annual leave days to be encashed", clearedBy: "Omar Qasim", clearedAt: "" },
        { id: "fin-6", item: "End-of-Service / Gratuity Processing", status: "Processing", remarks: "Gratuity calculation in progress (3 years 7 months tenure)", clearedBy: "Omar Qasim", clearedAt: "" },
        { id: "fin-7", item: "Other Outstanding Amounts", status: "Cleared", remarks: "None", clearedBy: "Omar Qasim", clearedAt: "2026-10-17T09:00:00Z" }
      ],
      hr: [
        { id: "hr-1", item: "Notice period completed", status: "Pending", remarks: "Full 30 days active service until Oct 31", clearedBy: "Sara Jenkins", clearedAt: "" },
        { id: "hr-2", item: "Company documents returned", status: "Cleared", remarks: "ID badges & company parking pass returned", clearedBy: "Sara Jenkins", clearedAt: "2026-10-17T15:00:00Z" },
        { id: "hr-3", item: "Required exit documents prepared", status: "Cleared", remarks: "Exit checklist and certificate draft generated", clearedBy: "Sara Jenkins", clearedAt: "2026-10-18T10:00:00Z" },
        { id: "hr-4", item: "Experience/service documentation", status: "Cleared", remarks: "Experience letter drafted and signed by MD", clearedBy: "Sara Jenkins", clearedAt: "2026-10-18T10:30:00Z" },
        { id: "hr-5", item: "Final settlement documentation", status: "Pending", remarks: "Awaiting Finance final gratuity payout signoff", clearedBy: "Sara Jenkins", clearedAt: "" },
        { id: "hr-6", item: "Exit interview completed", status: "Pending", remarks: "Questionnaire sent to employee", clearedBy: "Sara Jenkins", clearedAt: "" }
      ]
    },

    // Exit Interview Form
    exitInterview: {
      status: "Draft", // "Not Started", "Draft", "Submitted"
      submittedAt: "",
      submittedBy: "",
      primaryReason: "Career Growth",
      reasonExplanation: "I accepted an offer to lead regional menu development for European culinary operations.",
      ratings: {
        overallSatisfaction: 5,
        managementSupport: 5,
        workEnvironment: 4,
        workLifeBalance: 4,
        compensationBenefits: 4,
        careerDevelopment: 4,
        trainingLearning: 5,
        teamCollaboration: 5,
        recognition: 4
      },
      feedback: {
        enjoyedMost: "The close-knit team culture, culinary autonomy in crafting recipes, and respectful kitchen leadership under Rami.",
        couldImprove: "Upgrading the air conditioning in the central dough prep room during peak summer afternoons.",
        toolsAndResources: "Yes, all specialized knives, mixers, and flour batch certifications were always supplied promptly.",
        relationshipWithManager: "Exceptional. Rami was supportive, fair, and continuously encouraged culinary innovation.",
        decisionFactors: "International relocation opportunity and advancing into continental pastry culinary director roles.",
        encouragedToStay: "A broader corporate culinary director role covering international branches.",
        recommendCompany: "Yes, definitely",
        considerWorkingAgain: "Yes",
        rehireInterest: "Yes",
        confidentialComments: "Very grateful for 3 rewarding years. I am happy to mentor the new hire on call whenever needed."
      }
    },

    // Documents
    documents: [
      {
        id: "doc-1",
        name: "Elena_Rostova_Resignation_Letter.pdf",
        type: "Resignation Letter",
        uploadedBy: "Elena Rostova",
        uploadedAt: "2026-09-28T09:30:00.000Z",
        size: "340 KB",
        status: "Verified"
      },
      {
        id: "doc-2",
        name: "Handover_Recipe_Protocols_Matrix.pdf",
        type: "Handover Document",
        uploadedBy: "Elena Rostova",
        uploadedAt: "2026-10-12T11:15:00.000Z",
        size: "1.8 MB",
        status: "Under Review"
      },
      {
        id: "doc-3",
        name: "Service_Experience_Certificate_Draft.pdf",
        type: "Experience / Service Certificate",
        uploadedBy: "Sara Jenkins (HR)",
        uploadedAt: "2026-10-18T10:35:00.000Z",
        size: "420 KB",
        status: "Draft"
      }
    ],

    // Activity / Audit Timeline
    activity: [
      {
        id: "act-1",
        action: "Exit process created",
        performedBy: "Sara Jenkins (HR)",
        date: "2026-09-28",
        time: "10:00 AM",
        details: "Resignation notice accepted; offboarding schedule initiated."
      },
      {
        id: "act-2",
        action: "Handover item added: Greek Souvlaki Website & Online Ordering Recipe Specifications",
        performedBy: "Elena Rostova",
        date: "2026-10-12",
        time: "11:20 AM",
        details: "Added comprehensive pastry SOP and SharePoint links."
      },
      {
        id: "act-3",
        action: "Responsibility assigned: Morning Dough Batch Preparation to Chef Maria Santos",
        performedBy: "Rami Haddad (Manager)",
        date: "2026-10-14",
        time: "02:15 PM",
        details: "Assigned primary operational dough prep duties."
      },
      {
        id: "act-4",
        action: "Responsibility acknowledged by Chef Maria Santos",
        performedBy: "Chef Maria Santos",
        date: "2026-10-15",
        time: "09:40 AM",
        details: "Acknowledged transfer and scheduled shadow shifts."
      },
      {
        id: "act-5",
        action: "Handover verified: Weekly Kitchen Deep-Cleaning Sanitation Checklist",
        performedBy: "Rami Haddad (Manager)",
        date: "2026-10-16",
        time: "04:30 PM",
        details: "Inspected compliance checklist with Tariq Mahmoud."
      },
      {
        id: "act-6",
        action: "Assets returned: Access Card & Store Keys",
        performedBy: "Rami Haddad (Manager)",
        date: "2026-10-17",
        time: "11:00 AM",
        details: "Checked in physical keys and office keycard in good condition."
      },
      {
        id: "act-7",
        action: "Finance Clearance: Expense Claims and Advances cleared",
        performedBy: "Omar Qasim (Finance)",
        date: "2026-10-17",
        time: "09:00 AM",
        details: "Reimbursements verified with zero outstanding advances."
      },
      {
        id: "act-8",
        action: "Exit Interview questionnaire saved as draft",
        performedBy: "Elena Rostova",
        date: "2026-10-18",
        time: "02:00 PM",
        details: "Completed experience ratings and draft responses."
      }
    ],

    // Final HR Review
    finalReview: {
      isCompleted: false,
      completedAt: "",
      completedBy: "",
      finalComments: "",
      blockers: [
        "Laptop return pending (AST-LTP-089)",
        "Finance clearance pending (Final Salary, Leave Settlement, Gratuity)",
        "Knowledge Handover manager verification pending (1 item pending verification)",
        "Exit Interview submission pending"
      ]
    }
  },
  {
    id: "EXIT-2026-002",
    employeeId: "EMP-1002",
    employeeName: "Fatima Noor",
    employeePhoto: "",
    designation: "Front of House Cashier Lead",
    department: "Kitchen Staff",
    manager: "Rami Haddad",
    joiningDate: "2023-08-10",
    exitType: "Resignation",
    resignationDate: "2026-09-10",
    lastWorkingDay: "2026-10-10",
    noticePeriod: "30 Days",
    exitReason: "Relocation",
    hrNotes: "Family relocation to Canada. All clearances, asset returns, and gratuity payout successfully completed.",
    currentStage: "Completed",
    status: "Completed",
    createdAt: "2026-09-10T08:30:00.000Z",
    updatedAt: "2026-10-10T16:00:00.000Z",
    handoverItems: [
      {
        id: "HO-201",
        title: "Cash Drawer Reconciliation & Safe Deposit Float",
        category: "Operational Process",
        description: "Daily cash register balancing, credit card batch closing, and safe combination transfer.",
        status: "Verified",
        verificationStatus: "Verified",
        priority: "High",
        deadline: "2026-10-08",
        handedOverTo: "Ahmed Al Mansoori",
        handedOverToId: "EMP-1001",
        importantNotes: "Safe keys and shift log fully reconciled.",
        links: [],
        attachments: []
      }
    ],
    responsibilities: [
      {
        id: "RESP-201",
        title: "Daily Register Float Opening & Closing",
        category: "POS",
        previousOwner: "Fatima Noor",
        previousOwnerId: "EMP-1002",
        newOwner: "Ahmed Al Mansoori",
        newOwnerId: "EMP-1001",
        transferDate: "2026-10-05",
        status: "Completed",
        notes: "Transferred and fully active."
      }
    ],
    managerApproval: {
      status: "Approved",
      managerName: "Rami Haddad",
      managerId: "EMP-1008",
      decisionDate: "2026-10-08T14:00:00Z",
      managerComment: "All cashier processes and floats successfully handed over to Ahmed with flawless verification.",
      requestChangeHistory: []
    },
    clearance: {
      it: DEFAULT_IT_ITEMS.map((item, idx) => ({
        id: `it-${idx}`,
        item,
        status: "Completed",
        remarks: "Access closed",
        clearedBy: "Sara Jenkins",
        clearedAt: "2026-10-09T10:00:00Z"
      })),
      asset: [
        { id: "ast-1", asset: "Access Card", assetId: "AC-102", assignedDate: "2023-08-10", returnStatus: "Returned", condition: "Good", verifiedBy: "Rami Haddad", returnDate: "2026-10-09", notes: "" },
        { id: "ast-2", asset: "Uniform", assetId: "UNI-CSH-02", assignedDate: "2023-08-10", returnStatus: "Returned", condition: "Good", verifiedBy: "Rami Haddad", returnDate: "2026-10-09", notes: "" }
      ],
      finance: DEFAULT_FINANCE_ITEMS.map((item, idx) => ({
        id: `fin-${idx}`,
        item,
        status: "Cleared",
        remarks: "Final settlement and gratuity wire transferred",
        clearedBy: "Omar Qasim",
        clearedAt: "2026-10-10T12:00:00Z"
      })),
      hr: DEFAULT_HR_ITEMS.map((item, idx) => ({
        id: `hr-${idx}`,
        item,
        status: "Cleared",
        remarks: "Completed",
        clearedBy: "Sara Jenkins",
        clearedAt: "2026-10-10T15:00:00Z"
      }))
    },
    exitInterview: {
      status: "Submitted",
      submittedAt: "2026-10-08T16:30:00Z",
      submittedBy: "Fatima Noor",
      primaryReason: "Relocation",
      reasonExplanation: "Relocating abroad permanently with family.",
      ratings: {
        overallSatisfaction: 5,
        managementSupport: 5,
        workEnvironment: 5,
        workLifeBalance: 4,
        compensationBenefits: 4,
        careerDevelopment: 4,
        trainingLearning: 4,
        teamCollaboration: 5,
        recognition: 5
      },
      feedback: {
        enjoyedMost: "Warm management, respectful work colleagues, and prompt salary payments.",
        couldImprove: "Online digital tipping system for cashiers.",
        toolsAndResources: "Yes, POS hardware and printers worked reliably.",
        relationshipWithManager: "Very cordial and encouraging.",
        decisionFactors: "Family overseas immigration.",
        encouragedToStay: "Nothing, solely international moving.",
        recommendCompany: "Yes, definitely",
        considerWorkingAgain: "Yes",
        rehireInterest: "Yes",
        confidentialComments: "Loved working with the Greek Souvlaki team."
      }
    },
    documents: [
      {
        id: "doc-201",
        name: "Fatima_Noor_Resignation_Letter.pdf",
        type: "Resignation Letter",
        uploadedBy: "Fatima Noor",
        uploadedAt: "2026-09-10T09:00:00.000Z",
        size: "280 KB",
        status: "Verified"
      },
      {
        id: "doc-202",
        name: "Final_Settlement_Signoff_Fatima_Noor.pdf",
        type: "Final Settlement Document",
        uploadedBy: "Omar Qasim (Finance)",
        uploadedAt: "2026-10-10T15:00:00.000Z",
        size: "510 KB",
        status: "Verified"
      },
      {
        id: "doc-203",
        name: "Experience_Letter_Fatima_Noor.pdf",
        type: "Experience / Service Certificate",
        uploadedBy: "Sara Jenkins (HR)",
        uploadedAt: "2026-10-10T15:30:00.000Z",
        size: "390 KB",
        status: "Verified"
      }
    ],
    activity: [
      {
        id: "act-201",
        action: "Exit process created",
        performedBy: "Sara Jenkins (HR)",
        date: "2026-09-10",
        time: "08:30 AM",
        details: "Resignation notice accepted."
      },
      {
        id: "act-202",
        action: "Manager approved handover",
        performedBy: "Rami Haddad",
        date: "2026-10-08",
        time: "02:00 PM",
        details: "All cash desk operations verified."
      },
      {
        id: "act-203",
        action: "Offboarding completed",
        performedBy: "Sara Jenkins (HR)",
        date: "2026-10-10",
        time: "04:00 PM",
        details: "All department clearances verified. Employee status updated to Former Employee / Inactive."
      }
    ],
    finalReview: {
      isCompleted: true,
      completedAt: "2026-10-10T16:00:00Z",
      completedBy: "Sara Jenkins (HR)",
      finalComments: "All handover protocols, asset returns, and finance gratuity settlements executed flawlessly. Good standing for rehire.",
      blockers: []
    }
  }
];

// Initialize and get all exit cases
export const getExitCases = () => {
  const existing = readStorage(EXIT_CASES_KEY, null);
  if (existing && Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  // Initialize with seed data
  writeStorage(EXIT_CASES_KEY, SEED_EXIT_CASES);
  return SEED_EXIT_CASES;
};

export const getExitCaseById = (id) => {
  const cases = getExitCases();
  return cases.find((c) => c.id === id) || null;
};

export const saveExitCase = (exitCase) => {
  const cases = getExitCases();
  const index = cases.findIndex((c) => c.id === exitCase.id);
  const now = new Date().toISOString();
  const caseToSave = {
    ...exitCase,
    updatedAt: now
  };

  let updated;
  if (index !== -1) {
    updated = cases.map((c) => (c.id === exitCase.id ? caseToSave : c));
  } else {
    updated = [caseToSave, ...cases];
  }

  writeStorage(EXIT_CASES_KEY, updated);
  notifyExitCasesChanged();
  return caseToSave;
};

export const createExitCase = (formData, user) => {
  const cases = getExitCases();
  const year = new Date().getFullYear();
  const nextNum = (cases.length + 1).toString().padStart(3, "0");
  const caseId = `EXIT-${year}-${nextNum}`;
  const now = new Date().toISOString();
  const todayStr = now.slice(0, 10);
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || "HR Staff";

  // Check if employee already has an active exit case
  const activeExisting = cases.find(
    (c) => c.employeeId === formData.employeeId && c.status !== "Completed" && c.currentStage !== "Completed"
  );
  if (activeExisting) {
    throw new Error(`An active exit process (${activeExisting.id}) already exists for this employee.`);
  }

  const newCase = {
    id: caseId,
    employeeId: formData.employeeId,
    employeeName: formData.employeeName,
    employeePhoto: formData.employeePhoto || "",
    designation: formData.designation || "Staff",
    department: formData.department || "General",
    manager: formData.manager || "Branch Manager",
    joiningDate: formData.joiningDate || "",
    exitType: formData.exitType || "Resignation",
    resignationDate: formData.resignationDate || todayStr,
    lastWorkingDay: formData.lastWorkingDay || "",
    noticePeriod: formData.noticePeriod || "30 Days",
    exitReason: formData.exitReason || "Career Growth",
    hrNotes: formData.hrNotes || "",
    currentStage: "Exit Initiated",
    status: "Exit Initiated",
    createdAt: now,
    updatedAt: now,

    handoverItems: [],
    responsibilities: [],
    managerApproval: {
      status: "Pending",
      managerName: formData.manager || "Branch Manager",
      managerId: "",
      decisionDate: "",
      managerComment: "",
      requestChangeHistory: []
    },
    clearance: {
      it: DEFAULT_IT_ITEMS.map((item, idx) => ({
        id: `it-${idx + 1}`,
        item,
        status: "Pending",
        remarks: "",
        clearedBy: "",
        clearedAt: ""
      })),
      asset: DEFAULT_ASSET_ITEMS.map((asset, idx) => ({
        id: `ast-${idx + 1}`,
        asset,
        assetId: "",
        assignedDate: "",
        returnStatus: "Pending Return",
        condition: "Good",
        verifiedBy: "",
        returnDate: "",
        notes: ""
      })),
      finance: DEFAULT_FINANCE_ITEMS.map((item, idx) => ({
        id: `fin-${idx + 1}`,
        item,
        status: "Pending",
        remarks: "",
        clearedBy: "",
        clearedAt: ""
      })),
      hr: DEFAULT_HR_ITEMS.map((item, idx) => ({
        id: `hr-${idx + 1}`,
        item,
        status: "Pending",
        remarks: "",
        clearedBy: "",
        clearedAt: ""
      }))
    },
    exitInterview: {
      status: "Not Started",
      submittedAt: "",
      submittedBy: "",
      primaryReason: formData.exitReason || "Career Growth",
      reasonExplanation: "",
      ratings: {
        overallSatisfaction: 0,
        managementSupport: 0,
        workEnvironment: 0,
        workLifeBalance: 0,
        compensationBenefits: 0,
        careerDevelopment: 0,
        trainingLearning: 0,
        teamCollaboration: 0,
        recognition: 0
      },
      feedback: {
        enjoyedMost: "",
        couldImprove: "",
        toolsAndResources: "",
        relationshipWithManager: "",
        decisionFactors: "",
        encouragedToStay: "",
        recommendCompany: "",
        considerWorkingAgain: "",
        rehireInterest: "Maybe",
        confidentialComments: ""
      }
    },
    documents: [],
    activity: [
      {
        id: `act-${Date.now()}`,
        action: "Exit process created",
        performedBy: userName,
        date: todayStr,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        details: `Exit process started for ${formData.employeeName} (${formData.employeeId}). Notice date: ${formData.resignationDate || todayStr}, Last working day: ${formData.lastWorkingDay || "TBD"}.`
      }
    ],
    finalReview: {
      isCompleted: false,
      completedAt: "",
      completedBy: "",
      finalComments: "",
      blockers: []
    }
  };

  saveExitCase(newCase);
  addNotification({
    title: "Exit Process Initiated",
    message: `Offboarding initiated for ${formData.employeeName} (${formData.employeeId}).`,
    type: "info",
    caseId: caseId
  });

  return newCase;
};

// Calculate Progress and Outstanding blockers for a case
export const calculateExitProgress = (exitCase) => {
  if (!exitCase) return { percentage: 0, blockers: [], outstandingActions: [], stageStatuses: {} };

  if (exitCase.status === "Completed" || exitCase.currentStage === "Completed") {
    return {
      percentage: 100,
      blockers: [],
      outstandingActions: [],
      stageStatuses: {
        "Exit Initiated": "Completed",
        "Knowledge Handover": "Completed",
        "Manager Approval": "Completed",
        "Department Clearances": "Completed",
        "Exit Interview": "Completed",
        "HR Final Review": "Completed",
        "Completed": "Completed"
      }
    };
  }

  const blockers = [];
  const outstandingActions = [];

  // Stage 1: Handover
  const handoverItems = exitCase.handoverItems || [];
  const totalHandover = handoverItems.length;
  const verifiedHandover = handoverItems.filter((i) => i.verificationStatus === "Verified").length;
  const pendingHandover = totalHandover - verifiedHandover;

  if (totalHandover === 0) {
    outstandingActions.push("No knowledge handover items added yet");
  } else if (pendingHandover > 0) {
    outstandingActions.push(`${pendingHandover} knowledge handover item${pendingHandover > 1 ? "s" : ""} awaiting verification`);
    blockers.push(`${pendingHandover} handover item(s) unverified`);
  }

  // Responsibilities
  const responsibilities = exitCase.responsibilities || [];
  const unassignedResp = responsibilities.filter((r) => r.status === "Unassigned").length;
  if (unassignedResp > 0) {
    outstandingActions.push(`${unassignedResp} responsibility item${unassignedResp > 1 ? "s" : ""} awaiting assignment`);
  }

  // Stage 2: Manager Approval
  const managerStatus = exitCase.managerApproval?.status || "Pending";
  if (managerStatus !== "Approved") {
    blockers.push("Manager handover approval pending");
    outstandingActions.push("Manager handover sign-off pending");
  }

  // Stage 3: Clearances
  const itPending = (exitCase.clearance?.it || []).filter(
    (c) => c.status !== "Completed" && c.status !== "Not Applicable"
  ).length;
  if (itPending > 0) {
    blockers.push(`${itPending} IT clearance item(s) pending`);
    outstandingActions.push(`${itPending} IT account closures pending`);
  }

  const assetPending = (exitCase.clearance?.asset || []).filter(
    (c) => c.returnStatus !== "Returned" && c.returnStatus !== "Not Applicable"
  ).length;
  if (assetPending > 0) {
    blockers.push(`${assetPending} company asset(s) not yet returned`);
    outstandingActions.push(`${assetPending} asset return(s) pending`);
  }

  const financePending = (exitCase.clearance?.finance || []).filter(
    (c) => c.status !== "Cleared" && c.status !== "Not Applicable"
  ).length;
  if (financePending > 0) {
    blockers.push(`${financePending} Finance clearance item(s) pending`);
    outstandingActions.push("Finance settlement processing pending");
  }

  const hrPending = (exitCase.clearance?.hr || []).filter(
    (c) => c.status !== "Cleared" && c.status !== "Not Applicable"
  ).length;
  if (hrPending > 0) {
    blockers.push(`${hrPending} HR clearance item(s) pending`);
  }

  // Stage 4: Exit Interview
  const interviewStatus = exitCase.exitInterview?.status || "Not Started";
  if (interviewStatus !== "Submitted") {
    blockers.push("Exit interview not submitted");
    outstandingActions.push("Exit interview questionnaire pending completion");
  }

  // Scoring weights for progress
  // Handover: 25%
  // Manager Approval: 15%
  // Clearances: 35% (IT 10%, Asset 10%, Finance 10%, HR 5%)
  // Exit Interview: 15%
  // Exit Process Initiation: 10%
  let score = 10; // Initiated

  // Handover score
  if (totalHandover > 0) {
    score += Math.round((verifiedHandover / totalHandover) * 25);
  }

  // Manager Approval
  if (managerStatus === "Approved") {
    score += 15;
  }

  // Clearances score
  const totalIT = (exitCase.clearance?.it || []).length;
  const clearedIT = (exitCase.clearance?.it || []).filter(
    (c) => c.status === "Completed" || c.status === "Not Applicable"
  ).length;
  if (totalIT > 0) score += Math.round((clearedIT / totalIT) * 10);

  const totalAsset = (exitCase.clearance?.asset || []).length;
  const returnedAsset = (exitCase.clearance?.asset || []).filter(
    (c) => c.returnStatus === "Returned" || c.returnStatus === "Not Applicable"
  ).length;
  if (totalAsset > 0) score += Math.round((returnedAsset / totalAsset) * 10);

  const totalFin = (exitCase.clearance?.finance || []).length;
  const clearedFin = (exitCase.clearance?.finance || []).filter(
    (c) => c.status === "Cleared" || c.status === "Not Applicable"
  ).length;
  if (totalFin > 0) score += Math.round((clearedFin / totalFin) * 10);

  const totalHr = (exitCase.clearance?.hr || []).length;
  const clearedHr = (exitCase.clearance?.hr || []).filter(
    (c) => c.status === "Cleared" || c.status === "Not Applicable"
  ).length;
  if (totalHr > 0) score += Math.round((clearedHr / totalHr) * 5);

  // Exit Interview
  if (interviewStatus === "Submitted") {
    score += 15;
  } else if (interviewStatus === "Draft") {
    score += 5;
  }

  score = Math.min(score, 95); // Can only reach 100% when Final HR review Completes Offboarding

  // Determine stage status
  const stageStatuses = {
    "Exit Initiated": "Completed",
    "Knowledge Handover": verifiedHandover > 0 && pendingHandover === 0 && totalHandover > 0 ? "Completed" : totalHandover > 0 ? "Current" : "Current",
    "Manager Approval": managerStatus === "Approved" ? "Completed" : totalHandover > 0 ? "Current" : "Pending",
    "Department Clearances": itPending === 0 && assetPending === 0 && financePending === 0 && hrPending === 0 ? "Completed" : "Current",
    "Exit Interview": interviewStatus === "Submitted" ? "Completed" : interviewStatus === "Draft" ? "Current" : "Pending",
    "HR Final Review": blockers.length === 0 ? "Current" : "Blocked",
    "Completed": "Pending"
  };

  return {
    percentage: score,
    blockers,
    outstandingActions,
    stageStatuses,
    summaryCounts: {
      totalHandover,
      verifiedHandover,
      pendingHandover,
      unassignedResp,
      itPending,
      assetPending,
      financePending,
      hrPending,
      interviewStatus
    }
  };
};

// Append an audit activity entry
export const logExitActivity = (caseId, action, performedBy, details = "") => {
  const exitCase = getExitCaseById(caseId);
  if (!exitCase) return;

  const now = new Date();
  const newActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    performedBy: performedBy || "HR Staff",
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    details
  };

  const updatedCase = {
    ...exitCase,
    activity: [newActivity, ...(exitCase.activity || [])]
  };

  saveExitCase(updatedCase);
};

// Complete offboarding: updates exit case AND updates employee record in storage
export const completeOffboarding = (caseId, hrNotes, user) => {
  const exitCase = getExitCaseById(caseId);
  if (!exitCase) throw new Error("Exit case not found.");

  const { blockers } = calculateExitProgress(exitCase);
  if (blockers.length > 0) {
    throw new Error(`Cannot complete offboarding. Outstanding blockers: ${blockers.join(", ")}`);
  }

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || "HR Staff";
  const now = new Date().toISOString();

  // 1. Update Exit Case status
  const updatedCase = {
    ...exitCase,
    currentStage: "Completed",
    status: "Completed",
    updatedAt: now,
    finalReview: {
      isCompleted: true,
      completedAt: now,
      completedBy: userName,
      finalComments: hrNotes || "All exit requirements, handovers, and clearances successfully completed.",
      blockers: []
    }
  };

  saveExitCase(updatedCase);
  logExitActivity(caseId, "Offboarding completed", userName, `Offboarding formally closed. Employee status updated to Former Employee / Inactive.`);

  // 2. Update Employee status in staff profiles (Requirement 12)
  if (exitCase.employeeId) {
    try {
      updateStaffProfile(exitCase.employeeId, {
        employmentStatus: "Inactive", // "Inactive" / Former Employee
        exitDate: exitCase.lastWorkingDay || now.slice(0, 10),
        exitType: exitCase.exitType,
        exitCaseId: caseId,
        isFormerEmployee: true
      });
    } catch (e) {
      console.warn("Could not update staff profile employment status:", e);
    }
  }

  addNotification({
    title: "Offboarding Finalized",
    message: `Offboarding for ${exitCase.employeeName} (${exitCase.employeeId}) has been successfully completed.`,
    type: "success",
    caseId: caseId
  });

  return updatedCase;
};

// Notification helper
export const getNotifications = () => {
  return readStorage(EXIT_NOTIFICATIONS_KEY, [
    {
      id: "notif-1",
      title: "Exit Process Active",
      message: "Elena Rostova's last working day is approaching (31 Oct 2026). Handover verification pending.",
      type: "warning",
      date: "2026-10-18",
      read: false,
      caseId: "EXIT-2026-001"
    }
  ]);
};

export const addNotification = ({ title, message, type = "info", caseId = "" }) => {
  const notifs = getNotifications();
  const newNotif = {
    id: `notif-${Date.now()}`,
    title,
    message,
    type,
    caseId,
    date: new Date().toISOString().slice(0, 10),
    read: false
  };
  writeStorage(EXIT_NOTIFICATIONS_KEY, [newNotif, ...notifs.slice(0, 25)]);
};

export const markNotificationRead = (id) => {
  const notifs = getNotifications();
  const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
  writeStorage(EXIT_NOTIFICATIONS_KEY, updated);
};
