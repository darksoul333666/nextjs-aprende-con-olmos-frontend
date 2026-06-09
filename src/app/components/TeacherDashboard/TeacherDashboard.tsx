"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import {
  Dashboard,
  PersonAdd,
  People,
  VideoLibrary,
  MonetizationOn,
  Refresh,
  TrendingUp,
  School,
  Forum,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import {
  teacherStatsService,
  TeacherDashboardData,
} from "../../services/teacherStatsService";
import {
  Ticket,
  TicketStatus,
  ticketService,
} from "../../services/ticketService";

const getTicketStatusLabel = (status: TicketStatus) => {
  const labels: Record<TicketStatus, string> = {
    open: "Abierto",
    in_progress: "En revisión",
    resolved: "Resuelto",
    closed: "Cerrado",
  };
  return labels[status];
};

const getFeedbackPreview = (ticket: Ticket) => {
  const studentMessages = [...(ticket.messages || [])]
    .reverse()
    .find((message) => message.authorRole === "estudiante");

  return studentMessages?.message || ticket.description;
};

export const TeacherDashboard: React.FC = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] =
    useState<TeacherDashboardData | null>(null);
  const [feedbackTickets, setFeedbackTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await teacherStatsService.getDashboardStats();
      setDashboardData(data);
    } catch {
      setError("No se pudieron cargar las estadísticas del dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFeedbackTickets = useCallback(async () => {
    try {
      setIsFeedbackLoading(true);
      setFeedbackError(null);
      const tickets = await ticketService.getTickets({
        status: "all",
        priority: "all",
      });
      setFeedbackTickets(tickets.slice(0, 5));
    } catch {
      setFeedbackError("No se pudo cargar la retroalimentación de alumnos");
    } finally {
      setIsFeedbackLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchFeedbackTickets();
  }, [fetchDashboardData, fetchFeedbackTickets]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 6 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchDashboardData}
              startIcon={<Refresh />}
            >
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Dashboard color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          Área del instructor
        </Typography>
      </Box>

      {/* Estadísticas Generales */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={3}
        sx={{ mb: 4 }}
      >
        <Card sx={{ flex: 1, bgcolor: "primary.main", color: "white" }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 60, height: 60 }}
              >
                <PersonAdd sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {dashboardData.kpis.totalUsers.toLocaleString()}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Usuarios Registrados
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: "success.main", color: "white" }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 60, height: 60 }}
              >
                <People sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {dashboardData.kpis.totalSubscribers.toLocaleString()}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Estudiantes Inscritos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: "warning.main", color: "white" }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 60, height: 60 }}
              >
                <MonetizationOn sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  ${dashboardData.kpis.totalIncome.toLocaleString()}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Ventas Totales
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Estadísticas de Cursos y Crecimiento */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={3}
        sx={{ mb: 4 }}
      >
        <Card sx={{ flex: 1, bgcolor: "info.main", color: "white" }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 60, height: 60 }}
              >
                <School sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {dashboardData.courseStats.totalCourses}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Cursos Totales
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {dashboardData.courseStats.publishedCourses} publicados,{" "}
                  {dashboardData.courseStats.draftCourses} borradores
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: "secondary.main", color: "white" }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 60, height: 60 }}
              >
                <TrendingUp sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  +{dashboardData.growth.recentUsers}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Usuarios Recientes
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {dashboardData.growth.recentPurchases} compras, $
                  {dashboardData.growth.recentIncome} ingresos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Retroalimentación de alumnos */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Forum color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
                Retroalimentación de alumnos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Últimos comentarios, dudas o reportes recibidos desde soporte.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={() => router.push("/teacher/tickets")}
          >
            Ver todos
          </Button>
        </Box>

        {isFeedbackLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : feedbackError ? (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={fetchFeedbackTickets}
              >
                Reintentar
              </Button>
            }
          >
            {feedbackError}
          </Alert>
        ) : feedbackTickets.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aún no hay retroalimentación
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cuando un alumno abra un ticket o deje un mensaje, aparecerá aquí.
            </Typography>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column">
            {feedbackTickets.map((ticket, index) => (
              <Box key={ticket._id}>
                <Box
                  sx={{
                    py: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
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
                      sx={{
                        mt: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {getFeedbackPreview(ticket)}
                    </Typography>
                  </Box>
                  <Box
                    display="flex"
                    gap={1}
                    alignItems="flex-start"
                    flexWrap="wrap"
                  >
                    <Chip
                      label={getTicketStatusLabel(ticket.status)}
                      size="small"
                      color={ticket.status === "open" ? "warning" : "default"}
                    />
                    {ticket.courseTitle && (
                      <Chip
                        label={ticket.courseTitle}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
                {index < feedbackTickets.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Estadísticas por Video */}
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <VideoLibrary color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
            Estadísticas por Video
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={2}>
          {dashboardData.videoStats.map((video) => (
            <Card
              key={video.videoId}
              sx={{
                border: "1px solid",
                borderColor: "grey.200",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: 2,
                },
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={2}
                >
                  <Box flex={1} minWidth={200}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {video.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {video.courseTitle} - {video.sectionTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {video.videoId}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={4} flexWrap="wrap">
                    <Box textAlign="center">
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        {video.subscribers}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Suscriptores
                      </Typography>
                    </Box>

                    <Box textAlign="center">
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "success.main" }}
                      >
                        {video.views.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Visualizaciones
                      </Typography>
                    </Box>

                    <Box textAlign="center">
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "warning.main" }}
                      >
                        ${video.income.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ingresos
                      </Typography>
                    </Box>

                    <Box textAlign="center">
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "info.main" }}
                      >
                        {video.conversion.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Conversión
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};
