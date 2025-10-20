/**
 * OpenWeb Ninja JSearch API Integration
 * Alternative to RapidAPI JSearch with different endpoint
 */

export interface OpenWebNinjaJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  url?: string;
  posted_date?: string;
  source: string;
}

export class OpenWebNinjaAPI {
  private apiKey =
    process.env.OPENWEB_NINJA_API_KEY ||
    "ak_5huffd92tgvbrfecpyy7ctwo4e85c8a2oeotz2kcy7q4li8r";
  private baseUrl = "https://api.openwebninja.com/jsearch";

  async searchJobs(
    keywords: string,
    location?: string,
    page = 1
  ): Promise<OpenWebNinjaJob[]> {
    try {
      const params = new URLSearchParams({
        query: keywords || "developer jobs in chicago",
        page: page.toString(),
        num_pages: "1",
        country: "us",
        language: "en",
        date_posted: "today",
        work_from_home: "false",
        employment_types: "FULLTIME",
        job_requirements: "no_experience",
      });

      const url = `${this.baseUrl}/search?${params}`;
      console.log("🥷 OpenWeb Ninja API Request:", { url, keywords, location });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
          Accept: "*/*",
        },
      });

      console.log(
        "📡 OpenWeb Ninja Response Status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ OpenWeb Ninja Error:", errorText);
        throw new Error(
          `OpenWeb Ninja API failed: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ OpenWeb Ninja Data received:", data);

      return this.transformResponse(data, keywords, location);
    } catch (error) {
      console.error("OpenWeb Ninja API error:", error);
      throw error;
    }
  }

  private transformResponse(
    data: any,
    keywords: string,
    location?: string
  ): OpenWebNinjaJob[] {
    const jobs = (data.data || data.jobs || []).map(
      (job: any, index: number) => ({
        id: job.id || job.job_id || `openweb-${index}`,
        title: job.title || job.job_title || `${keywords} Position`,
        company:
          job.company || job.employer_name || job.company_name || "Company",
        location:
          job.location ||
          (job.job_city && job.job_state
            ? `${job.job_city}, ${job.job_state}`
            : "") ||
          location ||
          "Remote",
        type:
          job.type ||
          job.employment_type ||
          job.job_employment_type ||
          "Full-time",
        salary: job.salary || job.job_salary || undefined,
        description:
          job.description ||
          job.job_description ||
          `Exciting ${keywords} opportunity with excellent career prospects.`,
        url: job.url || job.apply_url || job.job_apply_link || undefined,
        posted_date:
          job.posted_date ||
          job.job_posted_at_datetime_utc ||
          new Date().toISOString(),
        source: "OpenWeb Ninja JSearch",
      })
    );

    console.log(`✅ OpenWeb Ninja: Transformed ${jobs.length} jobs`);
    return jobs;
  }
}
