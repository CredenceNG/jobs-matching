/**
 * Job Deduplication and Normalization
 *
 * Handles deduplication of jobs from multiple sources and
 * normalizes job data into a consistent format.
 *
 * @description Ensures no duplicate jobs and consistent data format
 */

import { Job } from '../services/job-search';

// =============================================================================
// TYPES
// =============================================================================

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  url: string;
  posted_date: string;
  source: string;
  remote?: boolean;
  tags?: string[];
  companyRating?: number;
  // Deduplication metadata
  duplicateIds?: string[]; // IDs of duplicate jobs from other sources
  primarySource?: string; // Which source is considered primary
  confidence?: number; // How confident we are in the match (0-1)
}

export interface DeduplicationStats {
  totalJobs: number;
  uniqueJobs: number;
  duplicatesRemoved: number;
  duplicateRate: number;
  sourceBreakdown: Record<string, number>;
}

// =============================================================================
// JOB DEDUPLICATOR CLASS
// =============================================================================

export class JobDeduplicator {
  private similarityThreshold = 0.85; // 85% similarity = duplicate

  /**
   * Deduplicate jobs from multiple sources
   *
   * Strategy:
   * 1. Normalize all job data
   * 2. Group similar jobs together
   * 3. Select best version of each job
   * 4. Return unique jobs with metadata
   *
   * @param jobs Array of jobs from various sources
   * @returns Deduplicated and normalized jobs
   */
  deduplicateJobs(jobs: any[]): { jobs: NormalizedJob[]; stats: DeduplicationStats } {
    console.log(`🔄 Deduplicating ${jobs.length} jobs...`);

    // Step 1: Normalize all jobs
    const normalizedJobs = jobs.map(job => this.normalizeJob(job));

    // Step 2: Group similar jobs
    const groups = this.groupSimilarJobs(normalizedJobs);

    // Step 3: Select best job from each group
    const uniqueJobs = groups.map(group => this.selectBestJob(group));

    // Step 4: Calculate statistics
    const stats = this.calculateStats(jobs, uniqueJobs);

    console.log(`✅ Deduplication complete: ${uniqueJobs.length} unique jobs`);
    console.log(`   Removed ${stats.duplicatesRemoved} duplicates (${stats.duplicateRate.toFixed(1)}%)`);

    return { jobs: uniqueJobs, stats };
  }

  /**
   * Normalize job data into consistent format
   */
  private normalizeJob(job: any): NormalizedJob {
    return {
      id: job.id || this.generateJobId(job),
      title: this.normalizeTitle(job.title || ''),
      company: this.normalizeCompany(job.company || ''),
      location: this.normalizeLocation(job.location || ''),
      type: this.normalizeJobType(job.type || job.jobType || 'Full-time'),
      salary: job.salary,
      description: this.cleanDescription(job.description || ''),
      url: job.url || '',
      posted_date: job.posted_date || new Date().toISOString(),
      source: job.source || 'Unknown',
      remote: job.remote || job.location?.toLowerCase().includes('remote') || false,
      tags: job.tags || [],
      companyRating: job.companyRating,
    };
  }

  /**
   * Group similar jobs together
   *
   * Jobs are considered similar if:
   * - Same company (exact match)
   * - Similar title (>85% similarity)
   * - Same or similar location
   */
  private groupSimilarJobs(jobs: NormalizedJob[]): NormalizedJob[][] {
    const groups: NormalizedJob[][] = [];
    const processed = new Set<string>();

    for (const job of jobs) {
      if (processed.has(job.id)) continue;

      const group: NormalizedJob[] = [job];
      processed.add(job.id);

      // Find all similar jobs
      for (const otherJob of jobs) {
        if (processed.has(otherJob.id)) continue;

        if (this.areJobsSimilar(job, otherJob)) {
          group.push(otherJob);
          processed.add(otherJob.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Check if two jobs are similar (likely duplicates)
   */
  private areJobsSimilar(job1: NormalizedJob, job2: NormalizedJob): boolean {
    // Must be same company (case-insensitive)
    if (job1.company.toLowerCase() !== job2.company.toLowerCase()) {
      return false;
    }

    // Calculate title similarity
    const titleSimilarity = this.calculateStringSimilarity(job1.title, job2.title);

    if (titleSimilarity < this.similarityThreshold) {
      return false;
    }

    // Check location similarity (exact match or both remote)
    const loc1 = job1.location.toLowerCase();
    const loc2 = job2.location.toLowerCase();

    const sameLocation = loc1 === loc2 ||
                        (job1.remote && job2.remote) ||
                        (loc1.includes('remote') && loc2.includes('remote'));

    return sameLocation;
  }

  /**
   * Select the best job from a group of duplicates
   *
   * Priority:
   * 1. Most complete data (has salary, description, etc.)
   * 2. Most recent posting date
   * 3. Preferred source (Indeed > Glassdoor > RemoteOK > Others)
   */
  private selectBestJob(group: NormalizedJob[]): NormalizedJob {
    if (group.length === 1) {
      return group[0];
    }

    // Score each job
    const scored = group.map(job => ({
      job,
      score: this.scoreJobCompleteness(job),
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Take the best job and add duplicate metadata
    const bestJob = scored[0].job;
    bestJob.duplicateIds = group.filter(j => j.id !== bestJob.id).map(j => j.id);
    bestJob.primarySource = bestJob.source;

    return bestJob;
  }

  /**
   * Score job completeness (higher = more complete data)
   */
  private scoreJobCompleteness(job: NormalizedJob): number {
    let score = 0;

    // Data completeness (50 points max)
    if (job.salary) score += 15;
    if (job.description && job.description.length > 100) score += 15;
    if (job.url) score += 10;
    if (job.companyRating) score += 5;
    if (job.tags && job.tags.length > 0) score += 5;

    // Source priority (30 points max)
    const sourcePriority: Record<string, number> = {
      'Indeed': 30,
      'Glassdoor': 25,
      'RemoteOK': 20,
      'Adzuna': 15,
      'JSearch': 10,
    };
    score += sourcePriority[job.source] || 5;

    // Recency (20 points max)
    const daysOld = this.getDaysOld(job.posted_date);
    if (daysOld < 1) score += 20;
    else if (daysOld < 7) score += 15;
    else if (daysOld < 30) score += 10;
    else score += 5;

    return score;
  }

  /**
   * Calculate statistics about deduplication
   */
  private calculateStats(
    originalJobs: any[],
    uniqueJobs: NormalizedJob[]
  ): DeduplicationStats {
    const duplicatesRemoved = originalJobs.length - uniqueJobs.length;

    // Count jobs by source
    const sourceBreakdown: Record<string, number> = {};
    originalJobs.forEach(job => {
      const source = job.source || 'Unknown';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    });

    return {
      totalJobs: originalJobs.length,
      uniqueJobs: uniqueJobs.length,
      duplicatesRemoved,
      duplicateRate: originalJobs.length > 0
        ? (duplicatesRemoved / originalJobs.length) * 100
        : 0,
      sourceBreakdown,
    };
  }

  // =============================================================================
  // NORMALIZATION HELPERS
  // =============================================================================

  private normalizeTitle(title: string): string {
    return title
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-\/\+\#\.]/g, ''); // Keep common job title characters
  }

  private normalizeCompany(company: string): string {
    return company
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Corporation)$/i, ''); // Remove company suffixes
  }

  private normalizeLocation(location: string): string {
    const cleaned = location.trim();

    if (/remote|work from home|wfh|anywhere/i.test(cleaned)) {
      return 'Remote';
    }

    // Standardize US state abbreviations
    return cleaned.replace(/,\s*([A-Z]{2})$/, ', $1'); // e.g., "San Francisco CA" -> "San Francisco, CA"
  }

  private normalizeJobType(type: string): string {
    const lower = type.toLowerCase();

    if (lower.includes('full') || lower.includes('fulltime')) return 'Full-time';
    if (lower.includes('part') || lower.includes('parttime')) return 'Part-time';
    if (lower.includes('contract')) return 'Contract';
    if (lower.includes('temp')) return 'Temporary';
    if (lower.includes('intern')) return 'Internship';

    return 'Full-time'; // Default
  }

  private cleanDescription(description: string): string {
    return description
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 1000); // Limit to 1000 chars for consistency
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Calculate string similarity using Levenshtein distance
   * Returns value between 0 (completely different) and 1 (identical)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = [];

    for (let i = 0; i <= m; i++) {
      dp[i] = [i];
    }

    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1,     // insertion
            dp[i - 1][j - 1] + 1  // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Generate a unique job ID
   */
  private generateJobId(job: any): string {
    const str = `${job.title}-${job.company}-${job.location}`.toLowerCase();
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString();
  }

  /**
   * Calculate how many days old a job posting is
   */
  private getDaysOld(dateString: string): number {
    const posted = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - posted.getTime();
    return diffMs / (1000 * 60 * 60 * 24);
  }
}

// Export singleton instance
export const jobDeduplicator = new JobDeduplicator();
