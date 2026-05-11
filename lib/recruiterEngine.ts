export type RecruiterPersonality =
  | "friendly_hr"
  | "analytical_hiring_manager"
  | "startup_recruiter"
  | "corporate_recruiter"
  | "pressure_interviewer"
  | string;

export type RecruiterProfile = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  tone: string;
  questionStyle: string;
  pressureBias: number;
  interruptionBias: number;
  feedbackStyle: string;
};

export function getRecruiterProfile(
  personality?: RecruiterPersonality,
  companyStyle?: string
): RecruiterProfile {
  const key = (personality || "").toLowerCase();
  const style = (companyStyle || "").toLowerCase();

  if (key.includes("friendly") || key.includes("hr")) {
    return {
      id: "friendly_hr",
      name: "Sarah",
      title: "Friendly HR Recruiter",
      avatar: "😊",
      tone: "warm, encouraging, but still realistic",
      questionStyle: "behavioral and communication-focused",
      pressureBias: 20,
      interruptionBias: 10,
      feedbackStyle: "supportive but honest",
    };
  }

  if (key.includes("analytical") || key.includes("hiring")) {
    return {
      id: "analytical_hiring_manager",
      name: "Daniel",
      title: "Analytical Hiring Manager",
      avatar: "🧠",
      tone: "precise, evidence-driven, practical",
      questionStyle: "asks for ownership, decisions, tradeoffs, and measurable impact",
      pressureBias: 45,
      interruptionBias: 25,
      feedbackStyle: "direct and analytical",
    };
  }

  if (key.includes("startup") || style.includes("startup")) {
    return {
      id: "startup_recruiter",
      name: "Priya",
      title: "Startup Recruiter",
      avatar: "👩‍💻",
      tone: "fast-paced, direct, impact-focused",
      questionStyle: "asks about speed, ownership, adaptability, and outcomes",
      pressureBias: 55,
      interruptionBias: 35,
      feedbackStyle: "brief, sharp, and outcome-focused",
    };
  }

  if (key.includes("corporate") || style.includes("corporate")) {
    return {
      id: "corporate_recruiter",
      name: "Markus",
      title: "Corporate Recruiter",
      avatar: "👨🏻‍💼",
      tone: "structured, formal, process-oriented",
      questionStyle: "asks for clarity, responsibility, process, and consistency",
      pressureBias: 40,
      interruptionBias: 20,
      feedbackStyle: "structured and professional",
    };
  }

  if (key.includes("pressure") || key.includes("brutal")) {
    return {
      id: "pressure_interviewer",
      name: "Alex",
      title: "Pressure Interviewer",
      avatar: "🧐",
      tone: "challenging, skeptical, realistic",
      questionStyle: "pushes weak answers, missing proof, and vague claims",
      pressureBias: 75,
      interruptionBias: 55,
      feedbackStyle: "blunt but useful",
    };
  }

  return {
    id: "realistic_recruiter",
    name: "Maya",
    title: "Realistic AI Recruiter",
    avatar: "👩🏻‍💼",
    tone: "realistic, professional, observant",
    questionStyle: "balanced behavioral and role-specific follow-ups",
    pressureBias: 35,
    interruptionBias: 20,
    feedbackStyle: "honest and practical",
  };
}