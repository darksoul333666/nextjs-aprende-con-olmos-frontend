import { apiService } from "./api";

export interface CourseProgress {
  _id: string;
  userId: string;
  courseId: string;
  completedVideos: string[];
  progress: number;
  lastAccessedAt: string;
  currentVideoId?: string;
  lastVideoId?: string;
  videoProgress?: VideoProgress[];
  completedEvaluations?: string[];
  evaluationAttempts?: EvaluationAttempt[];
}

export interface VideoProgress {
  videoId: string;
  completed: boolean;
  progress: number;
  lastWatchedAt?: string;
}

export interface EvaluationAttempt {
  evaluationId: string;
  score: number;
  passed: boolean;
  completedAt: string;
}

class ProgressService {
  async getCourseProgress(courseId: string): Promise<CourseProgress> {
    const response = await apiService.get<CourseProgress>(
      `/progress/${courseId}`,
    );
    return response.data!;
  }

  async markVideoCompleted(
    courseId: string,
    videoId: string,
  ): Promise<CourseProgress> {
    const response = await apiService.post<CourseProgress>(
      `/progress/${courseId}/video/${videoId}`,
    );
    return response.data!;
  }

  async updateVideoProgress(
    courseId: string,
    videoId: string,
    progress: number,
  ): Promise<CourseProgress> {
    const response = await apiService.patch<CourseProgress>(
      `/progress/${courseId}/video/${videoId}`,
      { progress },
    );
    return response.data!;
  }
}

export const progressService = new ProgressService();
