import { apiService } from './api';

export interface TeacherKPIs {
  totalUsers: number;
  totalSubscribers: number;
  totalIncome: number;
}

export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
}

export interface GrowthStats {
  recentUsers: number;
  recentPurchases: number;
  recentIncome: number;
}

export interface VideoStat {
  videoId: string;
  title: string;
  courseTitle: string;
  sectionTitle: string;
  subscribers: number;
  views: number;
  income: number;
  conversion: number;
  duration?: number;
  createdAt?: string;
}

export interface TeacherDashboardData {
  kpis: TeacherKPIs;
  courseStats: CourseStats;
  growth: GrowthStats;
  videoStats: VideoStat[];
}

export interface VideoStatsResponse {
  videoStats: VideoStat[];
  totalVideos: number;
  totalIncome: number;
  totalViews: number;
  avgConversion: number;
}

export const teacherStatsService = {
  async getDashboardStats(): Promise<TeacherDashboardData> {
    try {
      const response = await apiService.get('/teachers/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher dashboard stats:', error);
      throw error;
    }
  },

  async getVideoStats(): Promise<VideoStatsResponse> {
    try {
      const response = await apiService.get('/teachers/video-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher video stats:', error);
      throw error;
    }
  }
};
