import { apiService } from './api';

export interface Teacher {
  _id: string;
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
    const response = await apiService.get<{teacher: Teacher}>('/teachers');
    if (!response.data?.teacher) {
      throw new Error('No se pudo obtener la información del maestro');
    }
    return response.data.teacher;
  }

  // Obtener perfil del maestro (solo maestros) - GET /api/teachers/me
  async getTeacherProfile(): Promise<Teacher> {
    const response = await apiService.get<Teacher>('/teachers/me');
    if (!response.data) {
      throw new Error('No se pudo obtener el perfil del maestro');
    }
    return response.data;
  }

  // Actualizar perfil del maestro (solo maestros) - PUT /api/teachers/me
  async updateTeacher(data: UpdateTeacherRequest): Promise<Teacher> {
    const response = await apiService.put<Teacher>('/teachers/me', data);
    if (!response.data) {
      throw new Error('No se pudo actualizar el perfil del maestro');
    }
    return response.data;
  }

  // Obtener estadísticas del maestro autenticado - GET /api/teachers/stats
  async getTeacherStats(): Promise<TeacherStats> {
    const response = await apiService.get<TeacherStats>('/teachers/stats');
    if (!response.data) {
      throw new Error('No se pudieron obtener las estadísticas del maestro');
    }
    return response.data;
  }
}

export const teacherService = new TeacherService();
