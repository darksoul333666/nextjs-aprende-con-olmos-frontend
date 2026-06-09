"use client";

import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  AttachFile,
  ConfirmationNumber,
  Send,
  SupportAgent,
} from "@mui/icons-material";
import { Navbar } from "../components/Navigation/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { Course, courseService } from "../services/courseService";
import {
  CreateTicketRequest,
  Ticket,
  TicketPriority,
  TicketStatus,
  ticketService,
} from "../services/ticketService";

const GENERAL_TICKET_OPTION = "general";
const GENERAL_TICKET_LABEL = "Problema técnico con la plataforma / Pago";
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

interface TicketFormState {
  courseId: string;
  subject: string;
  description: string;
  attachments: File[];
}

const defaultForm: TicketFormState = {
  courseId: "",
  subject: "",
  description: "",
  attachments: [],
};

const getStatusLabel = (status: TicketStatus) => {
  const labels: Record<TicketStatus, string> = {
    open: "Abierto",
    in_progress: "En revisión",
    resolved: "Resuelto",
    closed: "Cerrado",
  };
  return labels[status];
};

const getStatusColor = (
  status: TicketStatus,
): "default" | "primary" | "success" | "warning" => {
  const colors: Record<
    TicketStatus,
    "default" | "primary" | "success" | "warning"
  > = {
    open: "warning",
    in_progress: "primary",
    resolved: "success",
    closed: "default",
  };
  return colors[status];
};

const getPriorityLabel = (priority: TicketPriority) => {
  const labels: Record<TicketPriority, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
  };
  return labels[priority];
};

const getPriorityColor = (
  priority: TicketPriority,
): "default" | "warning" | "error" => {
  const colors: Record<TicketPriority, "default" | "warning" | "error"> = {
    low: "default",
    medium: "warning",
    high: "error",
  };
  return colors[priority];
};

export default function StudentTicketsPage() {
  const { isAuthenticated, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TicketFormState>(defaultForm);
  const [formError, setFormError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState("");

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await ticketService.getMyTickets();
      setTickets(data);
    } catch {
      setError("No se pudieron cargar tus tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveCourses = async () => {
    try {
      setIsCoursesLoading(true);
      const courses = await courseService.getPurchasedCourses();
      setActiveCourses(courses);
    } finally {
      setIsCoursesLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    loadTickets();
    loadActiveCourses();
  }, [isAuthenticated]);

  const closeDialog = () => {
    if (isSaving) {
      return;
    }

    setDialogOpen(false);
    setForm(defaultForm);
    setFormError("");
  };

  const validateForm = () => {
    if (!form.courseId) {
      return "Selecciona un curso o el problema general";
    }

    if (!form.subject.trim()) {
      return "El asunto es requerido";
    }

    if (form.subject.trim().length < 5) {
      return "El asunto debe tener al menos 5 caracteres";
    }

    if (form.description.trim().length < 10) {
      return "La descripción debe tener al menos 10 caracteres";
    }

    const oversizedFile = form.attachments.find(
      (file) => file.size > MAX_ATTACHMENT_SIZE,
    );

    if (oversizedFile) {
      return `El archivo ${oversizedFile.name} supera el límite de 10 MB`;
    }

    return "";
  };

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    setForm((prev) => ({ ...prev, attachments: files }));
    event.target.value = "";
  };

  const handleCreateTicket = async () => {
    const validation = validateForm();
    if (validation) {
      setFormError(validation);
      return;
    }

    const selectedCourse = activeCourses.find(
      (course) => course._id === form.courseId,
    );
    const isGeneralTicket = form.courseId === GENERAL_TICKET_OPTION;
    const payload: CreateTicketRequest = {
      subject: form.subject.trim(),
      description: form.description.trim(),
      priority: "medium",
      category: isGeneralTicket ? GENERAL_TICKET_LABEL : "Curso",
      courseId: isGeneralTicket ? undefined : form.courseId,
      courseTitle: isGeneralTicket
        ? GENERAL_TICKET_LABEL
        : selectedCourse?.title,
      attachments: form.attachments.length ? form.attachments : undefined,
    };

    try {
      setIsSaving(true);
      setFormError("");
      setError("");
      setSuccess("");
      await ticketService.createTicket(payload);
      setSuccess("Ticket creado correctamente");
      closeDialog();
      await loadTickets();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No se pudo crear el ticket",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !message.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const updatedTicket = await ticketService.addMessage(selectedTicket._id, {
        message: message.trim(),
      });
      setSelectedTicket(updatedTicket);
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === updatedTicket._id ? updatedTicket : ticket,
        ),
      );
      setMessage("");
    } catch {
      setError("No se pudo enviar el mensaje");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar currentPage="tickets" />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="warning">
            Necesitas iniciar sesión para ver tus tickets.
          </Alert>
        </Container>
      </Box>
    );
  }

  if (user?.role !== "estudiante") {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar currentPage="tickets" />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">
            Esta sección está disponible para estudiantes.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar currentPage="tickets" />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <ConfirmationNumber color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
                Mis Tickets
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Solicita ayuda y da seguimiento a tus reportes.
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={60} />
          </Box>
        ) : tickets.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <SupportAgent
              sx={{ fontSize: 72, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No tienes tickets abiertos
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Crea un ticket para recibir apoyo del maestro.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
            >
              Crear Ticket
            </Button>
          </Paper>
        ) : (
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
            gap={3}
          >
            <Box display="flex" flexDirection="column" gap={2}>
              {tickets.map((ticket) => (
                <Card
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  sx={{
                    cursor: "pointer",
                    border:
                      selectedTicket?._id === ticket._id
                        ? "2px solid"
                        : "1px solid transparent",
                    borderColor:
                      selectedTicket?._id === ticket._id
                        ? "primary.main"
                        : "transparent",
                  }}
                >
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      gap={2}
                      flexWrap="wrap"
                    >
                      <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {ticket.subject}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {ticket.description}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip
                          label={getStatusLabel(ticket.status)}
                          color={getStatusColor(ticket.status)}
                          size="small"
                        />
                        <Chip
                          label={getPriorityLabel(ticket.priority)}
                          color={getPriorityColor(ticket.priority)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                      {ticket.courseTitle && (
                        <Chip
                          label={ticket.courseTitle}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {ticket.category && (
                        <Chip
                          label={ticket.category}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      <Chip
                        label={new Date(ticket.createdAt).toLocaleDateString()}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Paper sx={{ p: 3, alignSelf: "start" }}>
              {selectedTicket ? (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {selectedTicket.subject}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={1} mb={2}>
                    <Chip
                      label={getStatusLabel(selectedTicket.status)}
                      color={getStatusColor(selectedTicket.status)}
                      size="small"
                    />
                    <Chip
                      label={getPriorityLabel(selectedTicket.priority)}
                      color={getPriorityColor(selectedTicket.priority)}
                      size="small"
                      variant="outlined"
                    />
                    {selectedTicket.courseTitle && (
                      <Chip
                        label={selectedTicket.courseTitle}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedTicket.description}
                  </Typography>
                  {selectedTicket.attachments?.length ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Archivos adjuntos
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {selectedTicket.attachments.map((attachment) => (
                          <Button
                            key={attachment._id || attachment.url}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            variant="outlined"
                            startIcon={<AttachFile />}
                          >
                            {attachment.fileName}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  ) : null}
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Conversación
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2} mb={2}>
                    {(selectedTicket.messages || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Aún no hay mensajes adicionales.
                      </Typography>
                    ) : (
                      selectedTicket.messages?.map((ticketMessage) => (
                        <Box
                          key={ticketMessage._id}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor:
                              ticketMessage.authorRole === "maestro"
                                ? "rgba(25, 118, 210, 0.08)"
                                : "grey.100",
                          }}
                        >
                          <Typography variant="body2">
                            {ticketMessage.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 1 }}
                          >
                            {ticketMessage.authorRole === "maestro"
                              ? "Maestro"
                              : "Tú"}{" "}
                            ·{" "}
                            {new Date(ticketMessage.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Agregar mensaje"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      disabled={isSaving}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={isSaving || !message.trim()}
                      sx={{ alignSelf: "stretch" }}
                    >
                      <Send />
                    </Button>
                  </Box>
                </>
              ) : (
                <Box textAlign="center" py={6}>
                  <ConfirmationNumber
                    sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    Selecciona un ticket para ver los detalles
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Container>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Ticket</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              select
              fullWidth
              label="Curso"
              value={form.courseId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, courseId: event.target.value }))
              }
              helperText="Elige un curso activo o reporta un problema general."
              disabled={isCoursesLoading}
              required
            >
              <MenuItem value="" disabled>
                {isCoursesLoading
                  ? "Cargando cursos..."
                  : "Selecciona una opción"}
              </MenuItem>
              <MenuItem value={GENERAL_TICKET_OPTION}>
                {GENERAL_TICKET_LABEL}
              </MenuItem>
              {activeCourses.map((course) => (
                <MenuItem key={course._id} value={course._id}>
                  {course.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Asunto"
              value={form.subject}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subject: event.target.value }))
              }
              required
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Descripción"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              required
            />
            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFile />}
                disabled={isSaving}
              >
                Adjuntar archivos
                <input
                  hidden
                  multiple
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleAttachmentChange}
                />
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1 }}
              >
                Opcional. Puedes subir capturas de pantalla o PDF de hasta 10
                MB por archivo.
              </Typography>
              {form.attachments.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {form.attachments.map((file) => (
                    <Typography
                      key={`${file.name}-${file.size}`}
                      variant="body2"
                      color="text.secondary"
                    >
                      {file.name}
                    </Typography>
                  ))}
                  <Button
                    size="small"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, attachments: [] }))
                    }
                    sx={{ mt: 0.5 }}
                  >
                    Quitar archivos
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateTicket}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : <Add />}
          >
            {isSaving ? "Creando..." : "Crear Ticket"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
