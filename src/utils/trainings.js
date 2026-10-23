import { getStaffProfiles } from "./storage";

export const TRAININGS_STORAGE_KEY = "hrTrainingsV1";

export const DEFAULT_TRAINING_MODULES = [
  {
    id: "TRN-101",
    title: "Food Safety, Hygiene & HACCP Standards",
    category: "Food Safety",
    department: "Kitchen Staff",
    duration: "4 Hours",
    validityMonths: 12,
    description: "Crucial hygiene, sanitation, cross-contamination prevention, and personal protective wear guidelines required by UAE / GCC food authorities.",
    enrolledEmployees: ["EMP-1001", "EMP-1003", "EMP-1005", "EMP-1006"],
    completions: [
      { employeeId: "EMP-1001", completedDate: "2026-09-15", score: 95, status: "Passed" },
      { employeeId: "EMP-1003", completedDate: "2026-09-18", score: 98, status: "Passed" },
      { employeeId: "EMP-1005", completedDate: "", score: null, status: "In Progress" },
    ],
  },
  {
    id: "TRN-102",
    title: "POS Terminal & Cash Handling Mastery",
    category: "Operations",
    department: "Kitchen Staff",
    duration: "2.5 Hours",
    validityMonths: 24,
    description: "Cash drawer reconciliation, credit card terminal settlement, discount codes, refund authorizations, and end-of-shift reporting.",
    enrolledEmployees: ["EMP-1001", "EMP-1002", "EMP-1011"],
    completions: [
      { employeeId: "EMP-1001", completedDate: "2026-08-20", score: 92, status: "Passed" },
      { employeeId: "EMP-1002", completedDate: "2026-08-22", score: 96, status: "Passed" },
    ],
  },
  {
    id: "TRN-103",
    title: "Kitchen Fire Safety & Emergency Evacuation",
    category: "Health & Safety",
    department: "All Departments",
    duration: "3 Hours",
    validityMonths: 12,
    description: "Gas shutoff valves, deep fryer fire suppression (Class K / F extinguishers), emergency evacuation routes, and first aid basics.",
    enrolledEmployees: ["EMP-1003", "EMP-1004", "EMP-1008"],
    completions: [
      { employeeId: "EMP-1008", completedDate: "2026-07-10", score: 100, status: "Passed" },
    ],
  },
  {
    id: "TRN-104",
    title: "Customer Service Excellence & Conflict Resolution",
    category: "Guest Experience",
    department: "Kitchen Staff",
    duration: "2 Hours",
    validityMonths: 24,
    description: "Front-of-house greeting etiquette, handling delayed orders, allergy notice inquiries, and de-escalation protocols.",
    enrolledEmployees: ["EMP-1001", "EMP-1002"],
    completions: [
      { employeeId: "EMP-1001", completedDate: "2026-10-01", score: 90, status: "Passed" },
    ],
  },
  {
    id: "TRN-105",
    title: "Labor Law, Overtime Rules & Rest Periods",
    category: "Compliance",
    department: "Management Staff",
    duration: "3 Hours",
    validityMonths: 12,
    description: "Statutory rest days, overtime cap governance, attendance records maintenance, and leave calculation guidelines.",
    enrolledEmployees: ["EMP-1008", "EMP-1009", "EMP-1010"],
    completions: [
      { employeeId: "EMP-1008", completedDate: "2026-09-01", score: 94, status: "Passed" },
      { employeeId: "EMP-1009", completedDate: "2026-09-02", score: 98, status: "Passed" },
    ],
  },
];

export const getTrainings = () => {
  if (typeof localStorage === "undefined") return DEFAULT_TRAINING_MODULES;
  try {
    const saved = localStorage.getItem(TRAININGS_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(TRAININGS_STORAGE_KEY, JSON.stringify(DEFAULT_TRAINING_MODULES));
      return DEFAULT_TRAINING_MODULES;
    }
    return JSON.parse(saved);
  } catch (err) {
    console.error("Failed to read trainings:", err);
    return DEFAULT_TRAINING_MODULES;
  }
};

export const saveTrainings = (trainings) => {
  localStorage.setItem(TRAININGS_STORAGE_KEY, JSON.stringify(trainings));
  window.dispatchEvent(new Event("trainingsChanged"));
  return trainings;
};

export const enrollEmployeeInTraining = (trainingId, employeeId) => {
  const list = getTrainings();
  const updated = list.map((t) => {
    if (t.id === trainingId) {
      const enrolled = t.enrolledEmployees || [];
      if (!enrolled.includes(employeeId)) {
        return {
          ...t,
          enrolledEmployees: [...enrolled, employeeId],
        };
      }
    }
    return t;
  });
  return saveTrainings(updated);
};

export const recordTrainingCompletion = (trainingId, employeeId, score = 100) => {
  const list = getTrainings();
  const today = new Date().toISOString().slice(0, 10);
  const updated = list.map((t) => {
    if (t.id === trainingId) {
      const existing = (t.completions || []).filter((c) => c.employeeId !== employeeId);
      return {
        ...t,
        completions: [
          ...existing,
          {
            employeeId,
            completedDate: today,
            score: Number(score) || 100,
            status: Number(score) >= 70 ? "Passed" : "Failed",
          },
        ],
      };
    }
    return t;
  });
  return saveTrainings(updated);
};
