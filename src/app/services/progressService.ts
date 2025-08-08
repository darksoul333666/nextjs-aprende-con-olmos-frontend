import { apiService } from './api';

export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  completedVideos: string[];
  progress: number;
  lastAccessedAt: string;
}

export interface VideoProgress {
  videoId: string;
  completed: boolean;
  progress: number;
  lastWatchedAt?: string;
}

class ProgressService {
  async getCourseProgress(courseId: string): Promise<CourseProgress> {
    const response = await apiService.get<CourseProgress>(`/progress/${courseId}`);
    return response.data!;
  }

  async markVideoCompleted(courseId: string, videoId: string): Promise<CourseProgress> {
    const response = await apiService.post<CourseProgress>(`/progress/${courseId}/video/${videoId}`);
    return response.data!;
  }

  async updateVideoProgress(courseId: string, videoId: string, progress: number): Promise<CourseProgress> {
    const response = await apiService.patch<CourseProgress>(`/progress/${courseId}/video/${videoId}`, { progress });
    return response.data!;
  }
}

export const progressService = new ProgressService();
