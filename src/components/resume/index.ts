// Resume Management Components
export { ResumeUpload } from "./ResumeUpload";
export { ResumeViewer } from "./ResumeViewer";
export { ResumeAnalysis } from "./ResumeAnalysis";
export { ResumeOptimization } from "./ResumeOptimization";
export { default as ResumeManagement } from "./ResumeManagement";

// Types (re-export for convenience)
export type {
  ParsedResume,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
} from "@/types/resume";
