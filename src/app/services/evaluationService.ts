import { apiService } from "./api";

export type EvaluationKind = "acompanamiento" | "certificacion";
export type EvaluationTrigger = "before_video" | "during_video" | "after_video" | "after_course";
export type EvaluationQuestionType = "multiple_choice" | "input" | "true_false";

export interface EvaluationOption {
  _id?: string;
  text: string;
  isCorrect?: boolean;
}

export interface EvaluationQuestion {
  _id?: string;
  prompt: string;
  type: EvaluationQuestionType;
  options?: EvaluationOption[];
  correctAnswer?: string | boolean;
  explanation?: string;
  order: number;
}

export interface CourseEvaluation {
  _id: string;
  courseId: string;
  sectionId?: string;
  videoId?: string;
  title: string;
  description?: string;
  kind: EvaluationKind;
  trigger: EvaluationTrigger;
  triggerTimeSeconds?: number;
  isRequired: boolean;
  passingScore?: number;
  questions: EvaluationQuestion[];
  isCompleted?: boolean;
  isLocked?: boolean;
  order: number;
}

export interface EvaluationAnswerInput {
  questionId: string;
  answer: string | boolean;
}

export interface EvaluationSubmissionResult {
  evaluationId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
}

export type SaveEvaluationRequest = Omit<
  CourseEvaluation,
  "_id" | "courseId" | "isCompleted" | "isLocked"
>;

interface EvaluationsResponse {
  evaluations?: CourseEvaluation[];
}

interface EvaluationResponse {
  evaluation?: CourseEvaluation;
}

interface SubmissionResponse {
  result?: EvaluationSubmissionResult;
}

class EvaluationService {
  async getCourseEvaluations(courseId: string): Promise<CourseEvaluation[]> {
    const response = await apiService.get<EvaluationsResponse>(
      `/courses/${courseId}/evaluations`,
    );
    return response.data?.evaluations || [];
  }

  async createEvaluation(
    courseId: string,
    evaluation: SaveEvaluationRequest,
  ): Promise<CourseEvaluation> {
    const response = await apiService.post<EvaluationResponse>(
      `/courses/${courseId}/evaluations`,
      evaluation,
    );

    if (!response.data?.evaluation) {
      throw new Error(response.message || "No se pudo crear la evaluación");
    }

    return response.data.evaluation;
  }

  async updateEvaluation(
    courseId: string,
    evaluationId: string,
    evaluation: SaveEvaluationRequest,
  ): Promise<CourseEvaluation> {
    const response = await apiService.put<EvaluationResponse>(
      `/courses/${courseId}/evaluations/${evaluationId}`,
      evaluation,
    );

    if (!response.data?.evaluation) {
      throw new Error(response.message || "No se pudo actualizar la evaluación");
    }

    return response.data.evaluation;
  }

  async deleteEvaluation(courseId: string, evaluationId: string): Promise<void> {
    await apiService.delete(`/courses/${courseId}/evaluations/${evaluationId}`);
  }

  async submitEvaluation(
    courseId: string,
    evaluationId: string,
    answers: EvaluationAnswerInput[],
  ): Promise<EvaluationSubmissionResult> {
    const response = await apiService.post<SubmissionResponse>(
      `/courses/${courseId}/evaluations/${evaluationId}/submit`,
      { answers },
    );

    if (!response.data?.result) {
      throw new Error(response.message || "No se pudo enviar la evaluación");
    }

    return response.data.result;
  }
}

export const evaluationService = new EvaluationService();
