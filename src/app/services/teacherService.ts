import { apiService } from './api';

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  experience: string;
  education: string[];
  photo?: string;
  contact: {
    whatsapp: string;
    email: string;
    instagram: string;
    facebook: string;
  };
  achievements: string[];
}

export interface TeacherStats {
  totalStudents: number;
  totalCourses: number;
  averageRating: number;
  totalRevenue: number;
  completedCourses: number;
}

export interface UpdateTeacherRequest {
  name?: string;
  title?: string;
  bio?: string;
  expertise?: string[];
  experience?: string;
  education?: string[];
  photo?: string;
  contact?: {
    whatsapp?: string;
    email?: string;
    instagram?: string;
    facebook?: string;
  };
  achievements?: string[];
}

class TeacherService {
  // Obtener información del maestro (público) - GET /api/teachers
  async getTeacher(): Promise<Teacher> {
    const response = await apiService.get<Teacher>('/teachers');
    return response.data!;
  }

  // Obtener perfil del maestro (solo maestros) - GET /api/teachers/me
  async getTeacherProfile(): Promise<Teacher> {
    const response = await apiService.get<Teacher>('/teachers/me');
    return response.data!;
  }

  // Actualizar perfil del maestro (solo maestros) - PUT /api/teachers/me
  async updateTeacher(data: UpdateTeacherRequest): Promise<Teacher> {
    const response = await apiService.put<Teacher>('/teachers/me', data);
    return response.data!;
  }

  // Obtener estadísticas del maestro (solo maestros) - GET /api/teachers/{id}/stats
  async getTeacherStats(id: string): Promise<TeacherStats> {
    const response = await apiService.get<TeacherStats>(`/teachers/${id}/stats`);
    return response.data!;
  }
}

export const teacherService = new TeacherService();
