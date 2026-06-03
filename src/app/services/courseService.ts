import { apiService } from "./api";

export interface Video {
  _id: string;
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
  _id: string;
  title: string;
  description?: string;
  order: number;
  videos: Video[];
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructorId?: string;
  instructor?: {
    _id: string;
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
  [key: string]: unknown;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  sections: Omit<Section, "_id">[];
}

export interface CreateDraftRequest {
  title: string;
  description: string;
  price: number;
}

export interface CompleteCourseRequest {
  thumbnail?: string;
  sections: Omit<Section, "_id">[];
}

export interface DraftCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  status: "draft";
  createdAt: string;
  updatedAt: string;
}

export interface TeacherCourse {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  isVisible: boolean;
  createdAt: string;
  stats: {
    totalStudents: number;
    avgProgress: number;
    completedStudents: number;
    sectionsCount: number;
    videosCount: number;
    totalDuration: number;
  };
}

class CourseService {
  private ensureArray<T>(data: unknown): T[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (
      data &&
      typeof data === "object" &&
      "data" in data &&
      Array.isArray((data as Record<string, unknown>).data)
    ) {
      return (data as Record<string, unknown>).data as T[];
    }
    if (
      data &&
      typeof data === "object" &&
      "courses" in data &&
      Array.isArray((data as Record<string, unknown>).courses)
    ) {
      return (data as Record<string, unknown>).courses as T[];
    }
    return [];
  }

  // Obtener lista de cursos (público) - GET /api/courses
  async getCourses(filters?: CourseFilters): Promise<Course[]> {
    try {
      const response = await apiService.get<Course[]>("/courses", filters);
      const courses = this.ensureArray<Course>(response.data || response);
      return courses;
    } catch {
      return [];
    }
  }

  // Obtener detalles de un curso - GET /api/courses/{id}
  async getCourse(id: string): Promise<Course | null> {
    try {
      const response = await apiService.get<unknown>(`/courses/${id}`);

      const responseData = response.data as {
        course: Record<string, unknown>;
        canViewVideos: boolean;
      };
      if (responseData?.course) {
        const courseData = responseData.course;

        const mappedCourse: Course = {
          _id: courseData._id as string,
          title: courseData.title as string,
          description: courseData.description as string,
          instructorId:
            typeof courseData.instructorId === "object"
              ? ((courseData.instructorId as Record<string, unknown>)
                  ._id as string)
              : (courseData.instructorId as string),
          instructor:
            typeof courseData.instructorId === "object"
              ? {
                  _id: (courseData.instructorId as Record<string, unknown>)
                    ._id as string,
                  name: (courseData.instructorId as Record<string, unknown>)
                    .name as string,
                  title: (courseData.instructorId as Record<string, unknown>)
                    .title as string,
                }
              : undefined,
          thumbnail: courseData.thumbnail as string,
          rating: (courseData.rating as number) || 0,
          totalStudents: (courseData.totalStudents as number) || 0,
          totalDuration: (courseData.totalDuration as number) || 0,
          sections: (
            (courseData.sections as Record<string, unknown>[]) || []
          ).map((section) => ({
            _id: (section.id || section._id) as string, // Backend usa 'id' para sections
            title: section.title as string,
            description: section.description as string,
            order: section.order as number,
            videos: ((section.videos as Record<string, unknown>[]) || []).map(
              (video) => ({
                _id: (video.id || video._id) as string, // Backend usa 'id' para videos
                title: video.title as string,
                description: video.description as string,
                url: video.url as string,
                duration: video.duration as number,
                thumbnail: video.thumbnail as string,
                order: video.order as number,
                isCompleted: (video.isCompleted as boolean) || false,
                isLocked:
                  (video.isLocked as boolean) || !responseData.canViewVideos,
              }),
            ),
          })),
          price: courseData.price as number,
          isVisible: courseData.isVisible as boolean,
          isPurchased: responseData.canViewVideos || false,
        };

        return mappedCourse;
      }

      return null;
    } catch {
      return null;
    }
  }

  // Crear un curso (solo maestros) - POST /api/courses
  async createCourse(courseData: CreateCourseRequest): Promise<Course | null> {
    try {
      const response = await apiService.post<Course>("/courses", courseData);
      return response.data || null;
    } catch {
      return null;
    }
  }

  // Actualizar un curso - PUT /api/courses/{id}
  async updateCourse(
    id: string,
    courseData: Partial<CreateCourseRequest>,
  ): Promise<Course | null> {
    try {
      const response = await apiService.put<Course>(
        `/courses/${id}`,
        courseData,
      );
      return response.data || null;
    } catch {
      return null;
    }
  }

  // Cambiar visibilidad de un curso - PATCH /api/courses/{id}/visibility
  async toggleCourseVisibility(id: string): Promise<Course | null> {
    try {
      const response = await apiService.patch<Course>(
        `/courses/${id}/visibility`,
      );
      return response.data || null;
    } catch {
      return null;
    }
  }

  // Obtener cursos comprados por el usuario autenticado
  async getPurchasedCourses(): Promise<Course[]> {
    try {
      const response = await apiService.get<Course[]>("/courses/purchased");
      const courses = this.ensureArray<Course>(response.data || response);
      return courses;
    } catch {
      return [];
    }
  }

  // Obtener cursos del maestro autenticado
  async getTeacherCourses(): Promise<Course[]> {
    try {
      const response = await apiService.get<Course[]>("/courses/teacher");
      const courses = this.ensureArray<Course>(response.data || response);
      return courses;
    } catch {
      return [];
    }
  }

  // Comprar un curso
  async purchaseCourse(courseId: string): Promise<boolean> {
    try {
      await apiService.post(`/purchases/${courseId}`);
      return true;
    } catch {
      return false;
    }
  }

  // Crear un curso borrador - POST /api/courses/draft
  async createDraftCourse(
    draftData: CreateDraftRequest,
  ): Promise<DraftCourse | null> {
    try {
      const response = await apiService.post<{ course: DraftCourse }>(
        "/courses/draft",
        draftData,
      );
      return response.data?.course || null;
    } catch {
      return null;
    }
  }

  // Obtener cursos borrador del maestro - GET /api/courses/drafts
  async getDraftCourses(): Promise<DraftCourse[]> {
    const response = await apiService.get<{ drafts: DraftCourse[] }>(
      "/courses/drafts",
    );
    return response.data?.drafts || [];
  }

  // Completar un curso borrador - PUT /api/courses/:id/complete
  async completeCourse(
    id: string,
    completeData: CompleteCourseRequest,
  ): Promise<Course | null> {
    try {
      const response = await apiService.put<{ course: Course }>(
        `/courses/${id}/complete`,
        completeData,
      );
      return response.data?.course || null;
    } catch {
      return null;
    }
  }

  // Obtener cursos del maestro con estadísticas - GET /api/courses/teacher
  async getTeacherCoursesWithStats(): Promise<{
    courses: TeacherCourse[];
    summary: any;
  }> {
    const response = await apiService.get<{
      courses: TeacherCourse[];
      summary: any;
    }>("/courses/teacher");
    return {
      courses: response.data?.courses || [],
      summary: response.data?.summary || {},
    };
  }
}

export const courseService = new CourseService();
