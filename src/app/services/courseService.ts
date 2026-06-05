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
  activePromotion?: CourseActivePromotion;
}

export interface CourseActivePromotion {
  _id: string;
  discountPercentage: number;
  startsAt?: string;
  endsAt?: string;
  startDate?: string;
  endDate?: string;
  discountedPrice?: number;
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

export interface CourseSectionInput {
  title: string;
  description?: string;
  order: number;
  videos: Omit<Video, "_id">[];
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  sections: CourseSectionInput[];
}

export interface CreateDraftRequest {
  title: string;
  description: string;
  price: number;
}

export interface CompleteCourseRequest {
  thumbnail?: string;
  sections: CourseSectionInput[];
}

export interface UploadCourseVideoRequest {
  courseId: string;
  sectionId: string;
  file: File;
  title: string;
  description: string;
  duration: number;
  order?: number;
  thumbnail?: string;
}

export interface ReplaceCourseVideoRequest {
  courseId: string;
  sectionId: string;
  videoId: string;
  file: File;
}

export interface CreateCourseSectionRequest {
  courseId: string;
  title: string;
  description?: string;
  order?: number;
}

interface VideoUploadResponse {
  video: Video;
  storagePath?: string;
  url?: string;
}

interface SectionResponse {
  section?: Section;
  course?: Course;
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

export type TeacherCoursesSummary = Record<string, unknown>;

class CourseService {
  private mapVideo(video: Record<string, unknown>): Video {
    return {
      _id: (video.id || video._id) as string,
      title: video.title as string,
      description: (video.description as string) || "",
      url: (video.url as string) || "",
      duration: (video.duration as number) || 0,
      thumbnail: video.thumbnail as string,
      order: (video.order as number) || 0,
      isCompleted: (video.isCompleted as boolean) || false,
      isLocked: (video.isLocked as boolean) || false,
    };
  }

  private mapSection(section: Record<string, unknown>): Section {
    return {
      _id: (section.id || section._id) as string,
      title: section.title as string,
      description: section.description as string,
      order: (section.order as number) || 0,
      videos: ((section.videos as Record<string, unknown>[]) || []).map(
        (video) => this.mapVideo(video),
      ),
    };
  }

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
          ).map((section) => {
            const mappedSection = this.mapSection(section);
            return {
              ...mappedSection,
              videos: mappedSection.videos.map((video) => ({
                ...video,
                isLocked: video.isLocked || !responseData.canViewVideos,
              })),
            };
          }),
          price: courseData.price as number,
          isVisible: courseData.isVisible as boolean,
          isPurchased: responseData.canViewVideos || false,
          activePromotion: courseData.activePromotion as
            | CourseActivePromotion
            | undefined,
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

  // Crear sección dentro de un curso - POST /api/courses/:courseId/sections
  async createCourseSection({
    courseId,
    title,
    description = "",
    order,
  }: CreateCourseSectionRequest): Promise<Section | null> {
    const response = await apiService.post<SectionResponse>(
      `/courses/${courseId}/sections`,
      {
        title,
        description,
        ...(order !== undefined && { order }),
      },
    );

    if (response.data?.section) {
      return this.mapSection(
        response.data.section as unknown as Record<string, unknown>,
      );
    }

    return null;
  }

  // Eliminar sección de un curso - DELETE /api/courses/:courseId/sections/:sectionId
  async deleteCourseSection(
    courseId: string,
    sectionId: string,
  ): Promise<boolean> {
    await apiService.delete(`/courses/${courseId}/sections/${sectionId}`);
    return true;
  }

  // Eliminar video de una sección - DELETE /api/courses/:courseId/sections/:sectionId/videos/:videoId
  async deleteCourseVideo(
    courseId: string,
    sectionId: string,
    videoId: string,
  ): Promise<boolean> {
    await apiService.delete(
      `/courses/${courseId}/sections/${sectionId}/videos/${videoId}`,
    );
    return true;
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

  // Subir video a una sección - POST /api/courses/:courseId/sections/:sectionId/videos/upload
  async uploadCourseVideo({
    courseId,
    sectionId,
    file,
    title,
    description,
    duration,
    order,
    thumbnail,
  }: UploadCourseVideoRequest): Promise<Video> {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("duration", String(duration));

    if (order !== undefined) {
      formData.append("order", String(order));
    }

    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    const response = await apiService.post<VideoUploadResponse>(
      `/courses/${courseId}/sections/${sectionId}/videos/upload`,
      formData,
    );

    if (!response.data?.video) {
      throw new Error(response.message || "Error al subir video");
    }

    return response.data.video;
  }

  // Reemplazar archivo de video - PATCH /api/courses/:courseId/sections/:sectionId/videos/:videoId/upload
  async replaceCourseVideo({
    courseId,
    sectionId,
    videoId,
    file,
  }: ReplaceCourseVideoRequest): Promise<Video> {
    const formData = new FormData();
    formData.append("video", file);

    const response = await apiService.patch<VideoUploadResponse>(
      `/courses/${courseId}/sections/${sectionId}/videos/${videoId}/upload`,
      formData,
    );

    if (!response.data?.video) {
      throw new Error(response.message || "Error al reemplazar video");
    }

    return response.data.video;
  }

  // Obtener cursos del maestro con estadísticas - GET /api/courses/teacher
  async getTeacherCoursesWithStats(): Promise<{
    courses: TeacherCourse[];
    summary: TeacherCoursesSummary;
  }> {
    const response = await apiService.get<{
      courses: TeacherCourse[];
      summary: TeacherCoursesSummary;
    }>("/courses/teacher");
    return {
      courses: response.data?.courses || [],
      summary: response.data?.summary || {},
    };
  }
}

export const courseService = new CourseService();
