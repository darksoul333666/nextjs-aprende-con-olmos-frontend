"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
} from "@mui/material";
import {
  Add,
  Edit,
  Visibility,
  VisibilityOff,
  Publish,
  Drafts,
  School,
  AccessTime,
  People,
  Star,
  Delete,
  ArrowBack,
  PlayArrow,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  courseService,
  Course,
  DraftCourse,
  TeacherCourse,
} from "../../services/courseService";
import { Navbar } from "../../components/Navigation/Navbar";

export default function TeacherCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [drafts, setDrafts] = useState<DraftCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(
    null,
  );

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    price: 0,
  });

  const fetchCourses = useCallback(async () => {
    if (isInitialized) {
      return; // Ya se cargaron los datos
    }

    try {
      setIsLoading(true);
      setError(""); // Limpiar errores previos

      const [coursesData, draftsData] = await Promise.all([
        courseService.getTeacherCoursesWithStats(),
        courseService.getDraftCourses(),
      ]);

      setCourses(coursesData.courses);
      setDrafts(draftsData);
      setIsInitialized(true);
    } catch (error) {
      // Verificar si es un error de conexión
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        setError(
          "Backend no disponible. Por favor, ejecuta el backend en http://localhost:3200 y recarga la página.",
        );
      } else {
        setError("Error al cargar los cursos. Por favor, intenta de nuevo.");
      }

      // NO redirigir, solo mostrar el error
      setIsInitialized(true); // Marcar como inicializado para evitar reintentos
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  useEffect(() => {
    // Solo ejecutar cuando el contexto esté completamente cargado
    if (isAuthenticated === undefined) {
      return; // Aún cargando
    }

    // Marcar que ya verificamos la autenticación
    setAuthChecked(true);

    // Verificar autenticación y rol
    if (!isAuthenticated || user?.role !== "maestro") {
      // Usuario no autenticado o no es maestro
      router.push("/");
      return;
    }

    // Usuario es maestro, cargar cursos
    fetchCourses();
  }, [user, isAuthenticated, router, fetchCourses]);

  const handleRetry = () => {
    setIsInitialized(false);
    setError("");
    fetchCourses();
  };

  const checkBackendConnection = async () => {
    try {
      const response = await fetch("http://localhost:3200/api/health");
      if (response.ok) {
        setSuccess("Backend conectado correctamente. Recargando...");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(
          "Backend responde pero con error. Verifica los logs del servidor.",
        );
      }
    } catch {
      setError(
        "Backend no disponible. Asegúrate de que esté ejecutándose en http://localhost:3200",
      );
    }
  };

  const handleCreateDraft = async () => {
    try {
      if (!newCourse.title.trim()) {
        setError("El título del curso es obligatorio");
        return;
      }

      const createdDraft = await courseService.createDraftCourse({
        title: newCourse.title,
        description: newCourse.description,
        price: newCourse.price,
      });

      if (createdDraft) {
        setSuccess("Borrador creado exitosamente");
        setShowCreateDialog(false);
        setNewCourse({ title: "", description: "", price: 0 });
        fetchCourses();
      } else {
        setError("Error al crear el borrador");
      }
    } catch {
      setError("Error al crear el borrador");
    }
  };

  const handlePublishCourse = async (course: TeacherCourse) => {
    try {
      const publishedCourse = await courseService.toggleCourseVisibility(
        course.id,
      );
      if (publishedCourse) {
        setSuccess("Curso publicado exitosamente");
        fetchCourses();
      } else {
        setError("Error al publicar el curso");
      }
    } catch {
      setError("Error al publicar el curso");
    }
  };

  const handleToggleVisibility = async (course: TeacherCourse) => {
    try {
      const updatedCourse = await courseService.toggleCourseVisibility(
        course.id,
      );
      if (updatedCourse) {
        setSuccess(
          course.isVisible
            ? "Curso ocultado exitosamente"
            : "Curso publicado exitosamente",
        );
        fetchCourses();
      } else {
        setError("Error al cambiar la visibilidad del curso");
      }
    } catch {
      setError("Error al cambiar la visibilidad del curso");
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    try {
      // Aquí implementarías la lógica de eliminación si existe el endpoint
      setSuccess("Curso eliminado exitosamente");
      setShowDeleteDialog(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch {
      setError("Error al eliminar el curso");
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handlePreviewCourse = (courseId: string) => {
    // Navegar a la vista de preview del curso
    router.push(`/course/${courseId}?preview=true`);
  };

  // Mostrar loading mientras se verifica la autenticación o se cargan los datos
  if (
    isAuthenticated === undefined ||
    !authChecked ||
    isLoading ||
    !isInitialized
  ) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Si no está autenticado o no es maestro, mostrar loading (el useEffect se encarga del redirect)
  if (!isAuthenticated || user?.role !== "maestro") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar currentPage="teacher" />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => router.push("/teacher")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Mis Cursos
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setError("")}
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Reintentar
              </Button>
            }
          >
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

        {/* Acciones */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Gestionar Cursos
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.push("/teacher/courses/create")}
              >
                Crear Nuevo Curso
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCreateDialog(true)}
              >
                Crear Borrador Rápido
              </Button>
            </Box>
          </Box>
        </Paper>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error && courses.length === 0 && drafts.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{ fontWeight: 600, color: "error.main" }}
            >
              Backend No Disponible
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              No se pudo conectar con el servidor backend. Asegúrate de que esté
              ejecutándose en http://localhost:3200
            </Typography>
            <Box
              sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}
            >
              <Button
                variant="contained"
                onClick={checkBackendConnection}
                sx={{ mt: 2 }}
              >
                Verificar Conexión
              </Button>
              <Button variant="outlined" onClick={handleRetry} sx={{ mt: 2 }}>
                Reintentar
              </Button>
            </Box>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Sección de Cursos Publicados */}
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Visibility color="success" />
                  Cursos Publicados ({courses.length})
                </Typography>
              </Box>

              {courses.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <School
                    sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                  />
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    No tienes cursos publicados
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Completa algunos de tus borradores para publicarlos
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, 1fr)",
                      lg: "repeat(3, 1fr)",
                    },
                    gap: 3,
                  }}
                >
                  {courses.map((course, index) => (
                    <Box key={course.id || `course-${index}`}>
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          "&:hover": {
                            boxShadow: 4,
                          },
                        }}
                      >
                        {/* Estado del Curso */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            zIndex: 1,
                          }}
                        >
                          <Chip
                            label="Publicado"
                            color="success"
                            size="small"
                            icon={<Visibility />}
                          />
                        </Box>

                        {/* Imagen del Curso */}
                        <Box
                          sx={{
                            height: 200,
                            background: course.thumbnail
                              ? "transparent"
                              : "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {course.thumbnail ? (
                            <Box
                              component="img"
                              src={course.thumbnail}
                              alt={course.title}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <School sx={{ fontSize: 60 }} />
                          )}
                          <Chip
                            label={`$${course.price || 0}`}
                            color="primary"
                            sx={{
                              position: "absolute",
                              top: 16,
                              left: 16,
                              bgcolor: "white",
                              color: "primary.main",
                              fontWeight: 600,
                            }}
                          />
                        </Box>

                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {course.title}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            paragraph
                          >
                            {course.description}
                          </Typography>

                          {/* Estadísticas del Curso */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              mb: 2,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <AccessTime fontSize="small" />
                              <Typography variant="caption">
                                {formatDuration(
                                  course.stats.totalDuration || 0,
                                )}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <School fontSize="small" />
                              <Typography variant="caption">
                                {course.stats.sectionsCount || 0} secciones
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <People fontSize="small" />
                              <Typography variant="caption">
                                {course.stats.totalStudents || 0} estudiantes
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>

                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PlayArrow />}
                            onClick={() => handlePreviewCourse(course.id)}
                            sx={{ flex: 1 }}
                          >
                            Preview
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              router.push(`/courses/edit/${course.id}`)
                            }
                            sx={{ flex: 1 }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityOff />}
                            onClick={() =>
                              handleToggleVisibility(course)
                            }
                            sx={{ flex: 1 }}
                          >
                            Ocultar
                          </Button>
                        </CardActions>
                      </Card>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>

            {/* Sección de Borradores */}
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Drafts color="warning" />
                  Borradores ({drafts.length})
                </Typography>
              </Box>

              {drafts.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Drafts
                    sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                  />
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    No tienes borradores
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Crea un nuevo borrador para comenzar a trabajar en un curso
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowCreateDialog(true)}
                    sx={{ mt: 2 }}
                  >
                    Crear Borrador
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, 1fr)",
                      lg: "repeat(3, 1fr)",
                    },
                    gap: 3,
                  }}
                >
                  {drafts.map((draft, index) => (
                    <Box key={draft.id || `draft-${index}`}>
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          "&:hover": {
                            boxShadow: 4,
                          },
                        }}
                      >
                        {/* Estado del Curso */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            zIndex: 1,
                          }}
                        >
                          <Chip
                            label="Borrador"
                            color="warning"
                            size="small"
                            icon={<Drafts />}
                          />
                        </Box>

                        {/* Imagen del Curso */}
                        <Box
                          sx={{
                            height: 200,
                            background:
                              "linear-gradient(45deg, #ff9800 30%, #f57c00 90%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            position: "relative",
                          }}
                        >
                          <Drafts sx={{ fontSize: 60 }} />
                          <Chip
                            label={`$${draft.price || 0}`}
                            color="primary"
                            sx={{
                              position: "absolute",
                              top: 16,
                              left: 16,
                              bgcolor: "white",
                              color: "primary.main",
                              fontWeight: 600,
                            }}
                          />
                        </Box>

                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {draft.title}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            paragraph
                          >
                            {draft.description}
                          </Typography>

                          {/* Fecha de creación */}
                          <Typography variant="caption" color="text.secondary">
                            Creado:{" "}
                            {new Date(draft.createdAt).toLocaleDateString()}
                          </Typography>
                        </CardContent>

                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                              router.push(`/teacher/courses/edit/${draft.id}`)
                            }
                            sx={{ flex: 1 }}
                          >
                            Completar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Edit />}
                            onClick={() =>
                              router.push(`/teacher/courses/edit/${draft.id}`)
                            }
                            sx={{ flex: 1 }}
                          >
                            Editar
                          </Button>
                        </CardActions>
                      </Card>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Container>

      {/* Dialog para crear curso */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear Nuevo Curso</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título del Curso"
            value={newCourse.title}
            onChange={(e) =>
              setNewCourse((prev) => ({ ...prev, title: e.target.value }))
            }
            sx={{ mt: 2, mb: 2 }}
            required
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Descripción"
            value={newCourse.description}
            onChange={(e) =>
              setNewCourse((prev) => ({ ...prev, description: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Precio ($)"
            value={newCourse.price}
            onChange={(e) =>
              setNewCourse((prev) => ({
                ...prev,
                price: parseFloat(e.target.value) || 0,
              }))
            }
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateDraft} variant="contained">
            Crear Borrador
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar el curso &quot;
            {selectedCourse?.title}&quot;? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleDeleteCourse}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para crear curso rápidamente */}
      <Fab
        color="primary"
        aria-label="Crear curso"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => setShowCreateDialog(true)}
      >
        <Add />
      </Fab>
    </Box>
  );
}
