type CvProfileLike = {
  basics?: {
    name?: string;
    headline?: string;
    email?: string;
  };
  summary?: string;
  experience?: unknown[];
  education?: unknown[];
  projects?: unknown[];
  skills?: unknown[];
  languages?: unknown[];
};

const ENABLE_CV_DEBUG =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_WORKZO_CV_DEBUG === "true";

function safePreview(value: unknown, max = 1200) {
  try {
    const text =
      typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2);

    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}...` : text;
  } catch {
    return "[unserializable]";
  }
}

export function debugCvPipeline(label: string, data?: unknown) {
  if (!ENABLE_CV_DEBUG) return;

  const tag = `%c[WorkZo CV Pipeline] ${label}`;
  const style = "color:#38bdf8;font-weight:700";

  if (typeof window === "undefined") {
    console.log(`[WorkZo CV Pipeline] ${label}`, data);
    return;
  }

  console.groupCollapsed(tag, style);
  console.log(data);
  console.groupEnd();
}

export function debugCvText(
  label: string,
  text?: string,
  extra?: Record<string, unknown>,
) {
  if (!ENABLE_CV_DEBUG) return;

  const value = text || "";
  debugCvPipeline(label, {
    ...(extra || {}),
    chars: value.length,
    lines: value.split(/\n+/).filter(Boolean).length,
    preview: safePreview(value),
  });
}

export function debugCvProfile(
  label: string,
  profile?: unknown,
  extra?: Record<string, unknown>,
) {
  if (!ENABLE_CV_DEBUG) return;

  const safeProfile = profile as CvProfileLike | null | undefined;

  if (!safeProfile || typeof safeProfile !== "object") {
    debugCvPipeline(label, {
      ...(extra || {}),
      profile: safeProfile || null,
    });
    return;
  }

  debugCvPipeline(label, {
    ...(extra || {}),
    basics: safeProfile.basics || null,
    summaryPreview: safePreview(safeProfile.summary || "", 400),
    counts: {
      experience: Array.isArray(safeProfile.experience) ? safeProfile.experience.length : 0,
      education: Array.isArray(safeProfile.education) ? safeProfile.education.length : 0,
      projects: Array.isArray(safeProfile.projects) ? safeProfile.projects.length : 0,
      skills: Array.isArray(safeProfile.skills) ? safeProfile.skills.length : 0,
      languages: Array.isArray(safeProfile.languages) ? safeProfile.languages.length : 0,
    },
    experience: safeProfile.experience || [],
    education: safeProfile.education || [],
    projects: safeProfile.projects || [],
    skills: safeProfile.skills || [],
    languages: safeProfile.languages || [],
  });
}