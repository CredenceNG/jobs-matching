/**
 * Profile Storage Service
 * Handles profile storage for both anonymous users (session storage) and premium users (database)
 */

export interface UserProfile {
  // Personal Information
  name: string;
  email?: string;
  phone?: string;
  location: string;

  // Current Status
  currentRole: string;
  currentCompany?: string;
  employmentStatus: "employed" | "unemployed" | "freelance" | "student";

  // Experience
  totalYearsExperience: number;
  experienceLevel: "entry" | "mid" | "senior" | "lead" | "executive";
  workHistory: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;

  // Skills & Technologies
  skills: Array<{
    name: string;
    proficiency: "beginner" | "intermediate" | "advanced" | "expert";
    yearsUsed: number;
  }>;
  certifications: string[];

  // Career Goals
  targetRole: string;
  alternativeRoles: string[];
  careerTimeline: "immediate" | "3-months" | "6-months" | "1-year";
  growthAreas: string[];

  // Preferences
  preferences: {
    jobTypes: ("full-time" | "part-time" | "contract" | "freelance")[];
    workModes: ("remote" | "hybrid" | "onsite")[];
    salaryRange: { min: number; max: number; currency: string };
    industries: string[];
    companySizes: ("startup" | "small" | "mid-size" | "large" | "enterprise")[];
    benefits: string[];
    culturePriorities: string[];
  };

  // Metadata
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProfileStorageService {
  private static ANONYMOUS_PROFILE_KEY = "anonymous_profile";

  /**
   * Save profile for anonymous users (session storage) or premium users (database)
   */
  static async saveProfile(
    profile: UserProfile
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (profile.isAnonymous) {
        return this.saveAnonymousProfile(profile);
      } else {
        return this.savePremiumProfile(profile);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      return { success: false, message: "Failed to save profile" };
    }
  }

  /**
   * Load profile for current user (checks both session storage and database)
   */
  static async loadProfile(): Promise<UserProfile | null> {
    try {
      // First try to load anonymous profile from session storage
      const anonymousProfile = this.loadAnonymousProfile();
      if (anonymousProfile) {
        return anonymousProfile;
      }

      // Then try to load premium profile from database
      // TODO: Implement when auth system is added

      return null;
    } catch (error) {
      console.error("Error loading profile:", error);
      return null;
    }
  }

  /**
   * Save anonymous profile to session storage
   */
  private static saveAnonymousProfile(profile: UserProfile): {
    success: boolean;
    message: string;
  } {
    try {
      const profileWithMetadata = {
        ...profile,
        isAnonymous: true,
        updatedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        this.ANONYMOUS_PROFILE_KEY,
        JSON.stringify(profileWithMetadata)
      );
      return {
        success: true,
        message: "Profile saved locally (anonymous mode)",
      };
    } catch (error) {
      console.error("Error saving anonymous profile:", error);
      return { success: false, message: "Failed to save profile locally" };
    }
  }

  /**
   * Load anonymous profile from session storage
   */
  private static loadAnonymousProfile(): UserProfile | null {
    try {
      if (typeof window === "undefined") return null;

      const stored = sessionStorage.getItem(this.ANONYMOUS_PROFILE_KEY);
      if (!stored) return null;

      return JSON.parse(stored) as UserProfile;
    } catch (error) {
      console.error("Error loading anonymous profile:", error);
      return null;
    }
  }

  /**
   * Save premium profile to database (Supabase)
   */
  private static async savePremiumProfile(
    profile: UserProfile
  ): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: Implement Supabase database save when auth system is added
      // This would save to the user's profile in the database

      // For now, also save to session storage as backup
      const result = this.saveAnonymousProfile(profile);
      return {
        success: result.success,
        message: result.success
          ? "Profile saved (premium mode)"
          : result.message,
      };
    } catch (error) {
      console.error("Error saving premium profile:", error);
      return { success: false, message: "Failed to save premium profile" };
    }
  }

  /**
   * Clear anonymous profile from session storage
   */
  static clearAnonymousProfile(): void {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(this.ANONYMOUS_PROFILE_KEY);
      }
    } catch (error) {
      console.error("Error clearing anonymous profile:", error);
    }
  }

  /**
   * Convert anonymous profile to premium (upgrade flow)
   */
  static async upgradeToPremuim(
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const anonymousProfile = this.loadAnonymousProfile();
      if (!anonymousProfile) {
        return { success: false, message: "No anonymous profile found" };
      }

      // TODO: Implement when auth system is added
      // 1. Create user account
      // 2. Save profile to database
      // 3. Clear session storage

      const premiumProfile = {
        ...anonymousProfile,
        email,
        isAnonymous: false,
        updatedAt: new Date().toISOString(),
      };

      const result = await this.savePremiumProfile(premiumProfile);
      if (result.success) {
        this.clearAnonymousProfile();
      }

      return result;
    } catch (error) {
      console.error("Error upgrading to premium:", error);
      return { success: false, message: "Failed to upgrade profile" };
    }
  }

  /**
   * Get profile completion percentage
   */
  static getProfileCompletion(profile: UserProfile): number {
    const requiredFields = [
      profile.name,
      profile.location,
      profile.currentRole,
      profile.targetRole,
      profile.experienceLevel,
      profile.skills.length > 0,
      profile.preferences.jobTypes.length > 0,
      profile.preferences.workModes.length > 0,
    ];

    const completedFields = requiredFields.filter((field) => !!field).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  }

  /**
   * Get missing required fields
   */
  static getMissingFields(profile: UserProfile): string[] {
    const missing = [];

    if (!profile.name) missing.push("Name");
    if (!profile.location) missing.push("Location");
    if (!profile.currentRole) missing.push("Current Role");
    if (!profile.targetRole) missing.push("Target Role");
    if (!profile.experienceLevel) missing.push("Experience Level");
    if (profile.skills.length === 0) missing.push("Skills");
    if (profile.preferences.jobTypes.length === 0) missing.push("Job Types");
    if (profile.preferences.workModes.length === 0) missing.push("Work Modes");

    return missing;
  }
}
