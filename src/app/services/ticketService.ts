import { apiService } from "./api";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high";

export interface TicketUser {
  _id: string;
  email: string;
  name?: string;
}

export interface TicketMessage {
  _id: string;
  message: string;
  authorRole: "estudiante" | "maestro";
  author?: TicketUser;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  courseId?: string;
  courseTitle?: string;
  attachments?: TicketAttachment[];
  student?: TicketUser;
  assignedTeacher?: TicketUser;
  messages?: TicketMessage[];
  createdAt: string;
  updatedAt?: string;
}

export interface TicketAttachment {
  _id?: string;
  url: string;
  fileName: string;
  mimeType?: string;
  size?: number;
}

export interface TicketFilters {
  search?: string;
  status?: "all" | TicketStatus;
  priority?: "all" | TicketPriority;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  priority: TicketPriority;
  category?: string;
  courseId?: string;
  courseTitle?: string;
  attachments?: File[];
}

export interface UpdateTicketStatusRequest {
  status: TicketStatus;
}

export interface AddTicketMessageRequest {
  message: string;
}

interface TicketsResponse {
  tickets?: Ticket[];
}

interface TicketResponse {
  ticket?: Ticket;
}

class TicketService {
  async getMyTickets(): Promise<Ticket[]> {
    const response = await apiService.get<TicketsResponse>("/tickets/my");
    return response.data?.tickets || [];
  }

  async getTickets(filters?: TicketFilters): Promise<Ticket[]> {
    const response = await apiService.get<TicketsResponse>(
      "/tickets",
      filters as Record<string, unknown> | undefined,
    );
    return response.data?.tickets || [];
  }

  async createTicket(data: CreateTicketRequest): Promise<Ticket> {
    const hasAttachments = Boolean(data.attachments?.length);
    const body = hasAttachments ? this.buildCreateTicketFormData(data) : data;
    const response = await apiService.post<TicketResponse>("/tickets", body);

    if (!response.data?.ticket) {
      throw new Error(response.message || "No se pudo crear el ticket");
    }

    return response.data.ticket;
  }

  private buildCreateTicketFormData(data: CreateTicketRequest): FormData {
    const formData = new FormData();
    formData.append("subject", data.subject);
    formData.append("description", data.description);
    formData.append("priority", data.priority);

    if (data.category) {
      formData.append("category", data.category);
    }

    if (data.courseId) {
      formData.append("courseId", data.courseId);
    }

    if (data.courseTitle) {
      formData.append("courseTitle", data.courseTitle);
    }

    data.attachments?.forEach((file) => {
      formData.append("attachments", file);
    });

    return formData;
  }

  async updateTicketStatus(
    ticketId: string,
    data: UpdateTicketStatusRequest,
  ): Promise<Ticket> {
    const response = await apiService.patch<TicketResponse>(
      `/tickets/${ticketId}/status`,
      data,
    );

    if (!response.data?.ticket) {
      throw new Error(response.message || "No se pudo actualizar el ticket");
    }

    return response.data.ticket;
  }

  async addMessage(
    ticketId: string,
    data: AddTicketMessageRequest,
  ): Promise<Ticket> {
    const response = await apiService.post<TicketResponse>(
      `/tickets/${ticketId}/messages`,
      data,
    );

    if (!response.data?.ticket) {
      throw new Error(response.message || "No se pudo enviar el mensaje");
    }

    return response.data.ticket;
  }
}

export const ticketService = new TicketService();
