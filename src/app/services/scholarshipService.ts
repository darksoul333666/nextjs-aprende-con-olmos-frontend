import { apiService } from "./api";

export interface StudentScholarshipSummary {
  _id: string;
  discountPercentage: number;
  isActive: boolean;
}

export interface ScholarshipStudent {
  _id: string;
  email: string;
  name?: string;
  scholarship: StudentScholarshipSummary | null;
}

export interface ScholarshipStudentRef {
  _id: string;
  email: string;
  name?: string;
}

export interface Scholarship {
  _id: string;
  studentId: ScholarshipStudentRef;
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertScholarshipRequest {
  studentId: string;
  discountPercentage: number;
}

class ScholarshipService {
  private normalizeScholarshipSummary(
    data: Record<string, unknown>,
  ): StudentScholarshipSummary {
    return {
      _id: (data._id || data.id) as string,
      discountPercentage: (data.discountPercentage as number) || 0,
      isActive: data.isActive !== false,
    };
  }

  private normalizeStudent(data: Record<string, unknown>): ScholarshipStudent {
    const scholarship = data.scholarship as
      | Record<string, unknown>
      | null
      | undefined;

    return {
      _id: (data._id || data.id) as string,
      email: data.email as string,
      name: data.name as string | undefined,
      scholarship: scholarship
        ? this.normalizeScholarshipSummary(scholarship)
        : null,
    };
  }

  private normalizeScholarship(data: Record<string, unknown>): Scholarship {
    const student = data.studentId as Record<string, unknown>;

    return {
      _id: (data._id || data.id) as string,
      studentId: {
        _id: (student?._id || student?.id) as string,
        email: student?.email as string,
        name: student?.name as string | undefined,
      },
      discountPercentage: (data.discountPercentage as number) || 0,
      isActive: data.isActive !== false,
      createdAt: (data.createdAt as string) || "",
      updatedAt: (data.updatedAt as string) || "",
    };
  }

  async searchStudents(search: string): Promise<ScholarshipStudent[]> {
    const response = await apiService.get<{
      students?: Record<string, unknown>[];
    }>("/promotions/scholarships/students", { search });

    const students = response.data?.students || [];
    return students.map((student) => this.normalizeStudent(student));
  }

  async getScholarships(): Promise<Scholarship[]> {
    const response = await apiService.get<{
      scholarships?: Record<string, unknown>[];
    }>("/promotions/scholarships");

    const scholarships = response.data?.scholarships || [];
    return scholarships.map((scholarship) =>
      this.normalizeScholarship(scholarship),
    );
  }

  async getMyScholarship(): Promise<StudentScholarshipSummary | null> {
    const response = await apiService.get<{
      scholarship?: Record<string, unknown> | null;
    }>("/promotions/scholarships/me");

    return response.data?.scholarship
      ? this.normalizeScholarshipSummary(response.data.scholarship)
      : null;
  }

  async upsertScholarship(
    data: UpsertScholarshipRequest,
  ): Promise<Scholarship> {
    const response = await apiService.post<{
      scholarship?: Record<string, unknown>;
    }>("/promotions/scholarships", data);

    const scholarship = response.data?.scholarship;
    if (!scholarship) {
      throw new Error(response.message || "No se pudo guardar la beca");
    }

    return this.normalizeScholarship(scholarship);
  }

  async removeScholarship(studentId: string): Promise<void> {
    await apiService.delete(`/promotions/scholarships/${studentId}`);
  }
}

export const scholarshipService = new ScholarshipService();
