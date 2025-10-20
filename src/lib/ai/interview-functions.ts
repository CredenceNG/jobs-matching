import { cachedAIService } from "./cached-service";
import { logger } from "@/lib/utils/logger";
import type { ParsedResume, JobAnalysis } from "./job-functions";

export interface InterviewQuestion {
  id: string;
  type: "behavioral" | "technical" | "situational" | "company-specific";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  category: string;
  suggestedAnswer?: string;
  keyPoints: string[];
  followUpQuestions: string[];
}

export interface InterviewPrep {
  commonQuestions: InterviewQuestion[];
  technicalQuestions: InterviewQuestion[];
  behavioralQuestions: InterviewQuestion[];
  companyQuestions: InterviewQuestion[];
  preparationTips: {
    category: string;
    tips: string[];
  }[];
  questionsToAsk: string[];
}

export interface MockInterviewSession {
  sessionId: string;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string;
    answer: string;
    feedback?: InterviewFeedback;
  }>;
  startTime: Date;
  endTime?: Date;
}

export interface InterviewFeedback {
  score: number; // 1-10
  strengths: string[];
  improvements: string[];
  specificFeedback: string;
  suggestions: string[];
}

/**
 * AI-powered interview preparation service
 */
export class InterviewAIService {
  /**
   * Generate comprehensive interview preparation materials
   */
  async generateInterviewPrep(
    resume: ParsedResume,
    job: JobAnalysis,
    options: {
      userId?: string;
      sessionId?: string;
      includeAnswers?: boolean;
    } = {}
  ): Promise<InterviewPrep> {
    const prompt = `
Generate comprehensive interview preparation for this candidate and role:

CANDIDATE PROFILE:
Skills: ${resume.skills.technical.join(", ")}
Experience: ${resume.experience
      .map((exp) => `${exp.title} at ${exp.company}`)
      .slice(0, 3)
      .join("; ")}

TARGET ROLE:
Position: ${job.title}
Company: ${job.company}
Required Skills: ${job.requiredSkills.join(", ")}
Key Responsibilities: ${job.keyResponsibilities.join("; ")}

Generate interview questions and preparation materials in JSON format:
{
  "commonQuestions": [
    {
      "type": "behavioral|technical|situational|company-specific",
      "difficulty": "easy|medium|hard",
      "question": "interview question",
      "category": "question category",
      "keyPoints": ["key points to address"],
      "followUpQuestions": ["possible follow-up questions"]
    }
  ],
  "technicalQuestions": [
    // Same structure, focus on technical skills
  ],
  "behavioralQuestions": [
    // Same structure, focus on STAR method scenarios
  ],
  "companyQuestions": [
    // Same structure, company/role specific
  ],
  "preparationTips": [
    {
      "category": "Research",
      "tips": ["specific preparation advice"]
    }
  ],
  "questionsToAsk": ["thoughtful questions for the interviewer"]
}

Include 5-7 questions per category. Focus on questions most relevant to the specific role and candidate background.`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 3000,
        temperature: 0.4,
        userId: options.userId,
        sessionId: options.sessionId,
        useCache: true,
      });

      let jsonText = response.content.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
      }

      const prep = JSON.parse(jsonText) as Omit<InterviewPrep, "id">;

      // Add IDs to questions
      const addIds = (questions: any[]) =>
        questions.map((q, i) => ({ ...q, id: `q_${Date.now()}_${i}` }));

      const interviewPrep: InterviewPrep = {
        commonQuestions: addIds(prep.commonQuestions),
        technicalQuestions: addIds(prep.technicalQuestions),
        behavioralQuestions: addIds(prep.behavioralQuestions),
        companyQuestions: addIds(prep.companyQuestions),
        preparationTips: prep.preparationTips,
        questionsToAsk: prep.questionsToAsk,
      };

      // Generate suggested answers if requested
      if (options.includeAnswers) {
        await this.addSuggestedAnswers(interviewPrep, resume, job, options);
      }

      logger.info("Interview prep generated", {
        totalQuestions:
          interviewPrep.commonQuestions.length +
          interviewPrep.technicalQuestions.length +
          interviewPrep.behavioralQuestions.length +
          interviewPrep.companyQuestions.length,
        includeAnswers: options.includeAnswers,
      });

      return interviewPrep;
    } catch (error) {
      logger.error("Interview prep generation failed", { error });
      throw new Error("Failed to generate interview preparation materials.");
    }
  }

  /**
   * Start a mock interview session
   */
  async startMockInterview(
    questions: InterviewQuestion[],
    options: {
      userId?: string;
      sessionId?: string;
      randomizeOrder?: boolean;
    } = {}
  ): Promise<MockInterviewSession> {
    let sessionQuestions = [...questions];

    if (options.randomizeOrder) {
      sessionQuestions = sessionQuestions.sort(() => Math.random() - 0.5);
    }

    const session: MockInterviewSession = {
      sessionId: options.sessionId || `mock_${Date.now()}`,
      questions: sessionQuestions,
      currentQuestionIndex: 0,
      answers: [],
      startTime: new Date(),
    };

    logger.info("Mock interview session started", {
      sessionId: session.sessionId,
      questionCount: questions.length,
      userId: options.userId,
    });

    return session;
  }

  /**
   * Provide feedback on interview answer
   */
  async provideFeedback(
    question: InterviewQuestion,
    answer: string,
    resume: ParsedResume,
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<InterviewFeedback> {
    const prompt = `
Evaluate this interview answer and provide constructive feedback:

QUESTION (${question.type}):
${question.question}

CANDIDATE'S ANSWER:
${answer}

CANDIDATE BACKGROUND:
Skills: ${resume.skills.technical.slice(0, 10).join(", ")}
Experience: ${resume.experience
      .slice(0, 2)
      .map((exp) => `${exp.title} at ${exp.company}`)
      .join("; ")}

Provide feedback in JSON format:
{
  "score": number (1-10),
  "strengths": ["what the candidate did well"],
  "improvements": ["areas for improvement"],
  "specificFeedback": "detailed analysis of the answer",
  "suggestions": ["specific suggestions to improve the answer"]
}

Consider:
- Completeness and relevance of the answer
- Use of specific examples and metrics
- Communication clarity
- Alignment with question type (behavioral, technical, etc.)
- Professional presentation`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 1500,
        temperature: 0.3,
        userId: options.userId,
        sessionId: options.sessionId,
        useCache: false, // Don't cache feedback as it's personalized
      });

      let jsonText = response.content.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
      }

      const feedback = JSON.parse(jsonText) as InterviewFeedback;

      logger.info("Interview feedback provided", {
        questionType: question.type,
        score: feedback.score,
        answerLength: answer.length,
      });

      return feedback;
    } catch (error) {
      logger.error("Interview feedback generation failed", { error });
      throw new Error("Failed to generate interview feedback.");
    }
  }

  /**
   * Generate suggested answer for interview question
   */
  async generateSuggestedAnswer(
    question: InterviewQuestion,
    resume: ParsedResume,
    job?: JobAnalysis,
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<string> {
    const jobContext = job
      ? `
TARGET ROLE:
Position: ${job.title}
Key Requirements: ${job.requiredSkills.slice(0, 5).join(", ")}
`
      : "";

    const prompt = `
Generate a strong suggested answer for this interview question:

QUESTION (${question.type}):
${question.question}

CANDIDATE BACKGROUND:
Skills: ${resume.skills.technical.slice(0, 8).join(", ")}
Recent Experience: ${
      resume.experience[0]
        ? `${resume.experience[0].title} at ${resume.experience[0].company} - ${resume.experience[0].description}`
        : "N/A"
    }
Key Achievements: ${
      resume.experience[0]?.achievements?.slice(0, 2).join("; ") || "N/A"
    }

${jobContext}

Guidelines for ${question.type} questions:
${
  question.type === "behavioral"
    ? "- Use STAR method (Situation, Task, Action, Result)\n- Include specific examples and metrics\n- Show leadership and problem-solving skills"
    : question.type === "technical"
    ? "- Demonstrate deep understanding\n- Explain thought process\n- Mention best practices and trade-offs"
    : "- Be specific and relevant\n- Connect to role requirements\n- Show enthusiasm and knowledge"
}

Generate a comprehensive, professional answer that showcases the candidate's strengths and alignment with the role. Make it natural and conversational, not robotic.`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 1000,
        temperature: 0.5,
        userId: options.userId,
        sessionId: options.sessionId,
        useCache: true,
      });

      logger.info("Suggested answer generated", {
        questionType: question.type,
        answerLength: response.content.length,
      });

      return response.content;
    } catch (error) {
      logger.error("Suggested answer generation failed", { error });
      throw new Error("Failed to generate suggested answer.");
    }
  }

  /**
   * Add suggested answers to interview questions
   */
  private async addSuggestedAnswers(
    prep: InterviewPrep,
    resume: ParsedResume,
    job: JobAnalysis,
    options: {
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<void> {
    const allQuestions = [
      ...prep.commonQuestions,
      ...prep.technicalQuestions,
      ...prep.behavioralQuestions,
      ...prep.companyQuestions,
    ];

    // Generate answers for first few questions of each type to avoid excessive API calls
    const questionsToAnswer = allQuestions.slice(0, 8);

    for (const question of questionsToAnswer) {
      try {
        question.suggestedAnswer = await this.generateSuggestedAnswer(
          question,
          resume,
          job,
          options
        );
      } catch (error) {
        logger.warn("Failed to generate suggested answer", {
          questionId: question.id,
          error,
        });
      }
    }
  }

  /**
   * Complete mock interview session and provide overall feedback
   */
  async completeMockInterview(
    session: MockInterviewSession,
    options: {
      userId?: string;
    } = {}
  ): Promise<{
    overallScore: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  }> {
    session.endTime = new Date();

    const answeredQuestions = session.answers.length;
    const averageScore =
      session.answers.reduce(
        (sum, answer) => sum + (answer.feedback?.score || 0),
        0
      ) / Math.max(answeredQuestions, 1);

    const allStrengths: string[] = [];
    const allImprovements: string[] = [];

    session.answers.forEach((answer) => {
      if (answer.feedback?.strengths) {
        allStrengths.push(...answer.feedback.strengths);
      }
      if (answer.feedback?.improvements) {
        allImprovements.push(...answer.feedback.improvements);
      }
    });

    const prompt = `
Provide overall mock interview feedback based on this session:

SESSION STATS:
- Questions Answered: ${answeredQuestions} / ${session.questions.length}
- Average Score: ${averageScore.toFixed(1)} / 10
- Duration: ${Math.round(
      (session.endTime.getTime() - session.startTime.getTime()) / 60000
    )} minutes

COMMON STRENGTHS: ${allStrengths.slice(0, 10).join("; ")}
COMMON IMPROVEMENTS: ${allImprovements.slice(0, 10).join("; ")}

Provide comprehensive feedback in JSON format:
{
  "overallScore": number (1-10),
  "summary": "overall performance summary",
  "strengths": ["top 3-5 strengths across all answers"],
  "improvements": ["top 3-5 areas for improvement"],
  "recommendations": ["specific action items for interview preparation"]
}

Focus on actionable insights and encouragement.`;

    try {
      const response = await cachedAIService.generateText(prompt, {
        maxTokens: 1200,
        temperature: 0.4,
        userId: options.userId,
        sessionId: session.sessionId,
        useCache: false,
      });

      let jsonText = response.content.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
      }

      const feedback = JSON.parse(jsonText);

      logger.info("Mock interview completed", {
        sessionId: session.sessionId,
        questionsAnswered: answeredQuestions,
        overallScore: feedback.overallScore,
        duration: Math.round(
          (session.endTime.getTime() - session.startTime.getTime()) / 60000
        ),
      });

      return feedback;
    } catch (error) {
      logger.error("Mock interview completion failed", { error });
      throw new Error("Failed to generate overall interview feedback.");
    }
  }
}

// Singleton instance
export const interviewAIService = new InterviewAIService();
