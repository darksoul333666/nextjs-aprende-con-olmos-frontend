import { apiService } from './api';

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number;
  thumbnail?: string;
  order: number;
  isCompleted?: boolean;
  isLocked?: boolean;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  videos: Video[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId?: string;
  instructor?: {
    id: string;
    name: string;
    title: string;
  };
  thumbnail?: string;
  rating: number;
  totalStudents: number;
  totalDuration: number;
  sections: Section[];
  price: number;
  isVisible: boolean;
  isPurchased?: boolean;
}

export interface CourseFilters {
  title?: string;
  instructor?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  sections: Omit<Section, 'id'>[];
}

class CourseService {
  private ensureArray<T>(data: any): T[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && Array.isArray(data.data)) {
      return data.data;
    }
    if (data && typeof data === 'object' && Array.isArray(data.courses)) {
      return data.courses;
    }
    return [];
  }

  // Obtener lista de cursos (público) - GET /api/courses
  async getCourses(filters?: CourseFilters): Promise<Course[]> {
    try {
      const response = await apiService.get<Course[]>('/courses', filters);
      // La API puede devolver { success: true, data: Course[] } o directamente Course[]
      const courses = this.ensureArray<Course>(response.data || response);
      return courses;
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  // Obtener detalles de un curso - GET /api/courses/{id}
  async getCourse(id: string): Promise<Course | null> {
    try {
      const response = await apiService.get<Course>(`/courses/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching course:', error);
      return null;
    }
  }

  // Crear un curso (solo maestros) - POST /api/courses
  async createCourse(courseData: CreateCourseRequest): Promise<Course | null> {
    try {
      const response = await apiService.post<Course>('/courses', courseData);
      return response.data || null;
    } catch (error) {
      console.error('Error creating course:', error);
      return null;
    }
  }

  // Actualizar un curso - PUT /api/courses/{id}
  async updateCourse(id: string, courseData: Partial<CreateCourseRequest>): Promise<Course | null> {
    try {
      const response = await apiService.put<Course>(`/courses/${id}`, courseData);
      return response.data || null;
    } catch (error) {
      console.error('Error updating course:', error);
      return null;
    }
  }

  // Cambiar visibilidad de un curso - PATCH /api/courses/{id}/visibility
  async toggleCourseVisibility(id: string): Promise<Course | null> {
    try {
      const response = await apiService.patch<Course>(`/courses/${id}/visibility`);
      return response.data || null;
    } catch (error) {
      console.error('Error toggling course visibility:', error);
      return null;
    }
  }

  // Obtener cursos del usuario (si existe el endpoint)
  async getUserCourses(): Promise<Course[]> {
    try {
      const response = await apiService.get<Course[]>('/courses', { purchased: true });
      const courses = this.ensureArray<Course>(response.data || response);
      return courses;
    } catch (error) {
      console.error('Error fetching user courses:', error);
      return [];
    }
  }
}

export const courseService = new CourseService();
