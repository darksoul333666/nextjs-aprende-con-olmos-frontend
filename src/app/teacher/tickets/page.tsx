"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  AttachFile,
  ConfirmationNumber,
  Refresh,
  Search,
  Send,
  SupportAgent,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navigation/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import {
  Ticket,
  TicketFilters,
  TicketPriority,
  TicketStatus,
  ticketService,
} from "../../services/ticketService";

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

export default function TeacherTicketsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketFilters["status"]>("all");
  const [priority, setPriority] = useState<TicketFilters["priority"]>("all");
  const [message, setMessage] = useState("");

  const loadTickets = useCallback(
    async (filters: TicketFilters = { search, status, priority }) => {
      try {
        setIsLoading(true);
        setError("");
        const data = await ticketService.getTickets(filters);
        setTickets(data);
        setSelectedTicket((current) => {
          if (!current) {
            return data[0] || null;
          }

          return data.find((ticket) => ticket._id === current._id) || null;
        });
      } catch {
        setError("No se pudieron cargar los tickets");
      } finally {
        setIsLoading(false);
      }
    },
    [priority, search, status],
  );

  useEffect(() => {
    if (user?.role !== "maestro") {
      setIsLoading(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      loadTickets({ search: search.trim(), status, priority });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [user, search, status, priority, loadTickets]);

  const updateTicketInState = (updatedTicket: Ticket) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket._id === updatedTicket._id ? updatedTicket : ticket,
      ),
    );
    setSelectedTicket(updatedTicket);
  };

  const handleStatusChange = async (nextStatus: TicketStatus) => {
    if (!selectedTicket) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      const updatedTicket = await ticketService.updateTicketStatus(
        selectedTicket._id,
        { status: nextStatus },
      );
      updateTicketInState(updatedTicket);
      setSuccess("Estado del ticket actualizado");
    } catch {
      setError("No se pudo actualizar el estado del ticket");
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
      setSuccess("");
      const updatedTicket = await ticketService.addMessage(selectedTicket._id, {
        message: message.trim(),
      });
      updateTicketInState(updatedTicket);
      setMessage("");
      setSuccess("Respuesta enviada correctamente");
    } catch {
      setError("No se pudo enviar la respuesta");
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== "maestro") {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar currentPage="teacher-tickets" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            Solo los maestros pueden gestionar tickets.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar currentPage="teacher-tickets" />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => router.push("/teacher")}>
            <ArrowBack />
          </IconButton>
          <SupportAgent color="primary" sx={{ fontSize: 40 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              Tickets de Soporte
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Revisa solicitudes de estudiantes y responde desde un solo lugar.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() =>
              loadTickets({ search: search.trim(), status, priority })
            }
            disabled={isLoading}
          >
            Actualizar
          </Button>
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

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Buscar"
              placeholder="Asunto, descripción o estudiante"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ flex: 2, minWidth: 260 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Estado"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as TicketFilters["status"])
              }
              sx={{ flex: 1, minWidth: 180 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="open">Abiertos</MenuItem>
              <MenuItem value="in_progress">En revisión</MenuItem>
              <MenuItem value="resolved">Resueltos</MenuItem>
              <MenuItem value="closed">Cerrados</MenuItem>
            </TextField>
            <TextField
              select
              label="Prioridad"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as TicketFilters["priority"])
              }
              sx={{ flex: 1, minWidth: 180 }}
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="low">Baja</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
            </TextField>
          </Box>
        </Paper>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={60} />
          </Box>
        ) : tickets.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <ConfirmationNumber
              sx={{ fontSize: 72, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No hay tickets con estos filtros
            </Typography>
          </Paper>
        ) : (
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: "1fr",
              md: "minmax(0, 1fr) minmax(360px, 0.9fr)",
            }}
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
                      <Box sx={{ flex: 1, minWidth: 240 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {ticket.subject}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ticket.student?.name ||
                            ticket.student?.email ||
                            "Estudiante"}
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
                      <Chip
                        label={`${ticket.messages?.length || 0} mensaje(s)`}
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
                  <Typography variant="body2" color="text.secondary">
                    {selectedTicket.student?.name ||
                      selectedTicket.student?.email ||
                      "Estudiante"}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={2} mb={2}>
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
                    {selectedTicket.category && (
                      <Chip
                        label={selectedTicket.category}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {selectedTicket.courseTitle && (
                      <Chip
                        label={selectedTicket.courseTitle}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <TextField
                    select
                    fullWidth
                    label="Estado del ticket"
                    value={selectedTicket.status}
                    onChange={(event) =>
                      handleStatusChange(event.target.value as TicketStatus)
                    }
                    disabled={isSaving}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="open">Abierto</MenuItem>
                    <MenuItem value="in_progress">En revisión</MenuItem>
                    <MenuItem value="resolved">Resuelto</MenuItem>
                    <MenuItem value="closed">Cerrado</MenuItem>
                  </TextField>
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
                              : "Estudiante"}{" "}
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
                      label="Responder"
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
    </Box>
  );
}
