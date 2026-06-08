import { apiService } from "./api";

export interface StudentUser {
  _id: string;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  purchasesCount?: number;
}

export interface StudentFilters {
  search?: string;
  status?: "all" | "active" | "inactive";
}

export interface CreateStudentRequest {
  email: string;
  name?: string;
  password: string;
}

export interface UpdateStudentRequest {
  email?: string;
  name?: string;
  password?: string;
  isActive?: boolean;
}

interface StudentsResponse {
  students?: StudentUser[];
}

interface StudentResponse {
  student?: StudentUser;
}

class UserService {
  async getStudents(filters?: StudentFilters): Promise<StudentUser[]> {
    const response = await apiService.get<StudentsResponse>(
      "/users/students",
      filters as Record<string, unknown> | undefined,
    );
    return response.data?.students || [];
  }

  async createStudent(data: CreateStudentRequest): Promise<StudentUser> {
    const response = await apiService.post<StudentResponse>(
      "/users/students",
      data,
    );

    if (!response.data?.student) {
      throw new Error(response.message || "No se pudo crear el estudiante");
    }

    return response.data.student;
  }

  async updateStudent(
    studentId: string,
    data: UpdateStudentRequest,
  ): Promise<StudentUser> {
    const response = await apiService.put<StudentResponse>(
      `/users/students/${studentId}`,
      data,
    );

    if (!response.data?.student) {
      throw new Error(response.message || "No se pudo actualizar el estudiante");
    }

    return response.data.student;
  }

  async deactivateStudent(studentId: string): Promise<void> {
    await apiService.delete(`/users/students/${studentId}`);
  }

  async reactivateStudent(studentId: string): Promise<StudentUser> {
    return this.updateStudent(studentId, { isActive: true });
  }
}

export const userService = new UserService();
