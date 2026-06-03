"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from "@mui/material";
import {
  ArrowBack,
  Add,
  Edit,
  Delete,
  Publish,
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  courseService,
  DraftCourse,
  Section as CourseSection,
  Video,
  CompleteCourseRequest,
} from "../../../../services/courseService";
import { Navbar } from "../../../../components/Navigation/Navbar";

interface SectionFormData {
  title: string;
  description: string;
}

interface VideoFormData {
  title: string;
  description: string;
  url: string;
  duration: number;
  thumbnail: string;
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [draftCourse, setDraftCourse] = useState<DraftCourse | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Estados para modales
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(
    null,
  );
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  // Estados para formularios
  const [sectionForm, setSectionForm] = useState<SectionFormData>({
    title: "",
    description: "",
  });
  const [videoForm, setVideoForm] = useState<VideoFormData>({
    title: "",
    description: "",
    url: "",
    duration: 0,
    thumbnail: "",
  });

  useEffect(() => {
    loadDraftCourse();
  }, [courseId]);

  const loadDraftCourse = async () => {
    try {
      setIsLoading(true);
      const drafts = await courseService.getDraftCourses();
      const draft = drafts.find((d) => d.id === courseId);

      if (draft) {
        setDraftCourse(draft);
      } else {
        setError("Borrador del curso no encontrado");
      }
    } catch {
      setError("Error al cargar el borrador del curso");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSection = () => {
    setEditingSection(null);
    setSectionForm({ title: "", description: "" });
    setSectionDialogOpen(true);
  };

  const handleEditSection = (section: CourseSection) => {
    setEditingSection(section);
    setSectionForm({
      title: section.title,
      description: section.description || "",
    });
    setSectionDialogOpen(true);
  };

  const handleSaveSection = () => {
    if (!sectionForm.title.trim()) {
      setError("El título de la sección es requerido");
      return;
    }

    const newSection: CourseSection = {
      _id: editingSection?._id || `temp_${Date.now()}`,
      title: sectionForm.title,
      description: sectionForm.description,
      order: sections.length + 1,
      videos: editingSection?.videos || [],
    };

    if (editingSection) {
      setSections((prev) =>
        prev.map((s) => (s._id === editingSection._id ? newSection : s)),
      );
    } else {
      setSections((prev) => [...prev, newSection]);
    }

    setSectionDialogOpen(false);
    setSectionForm({ title: "", description: "" });
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s._id !== sectionId));
  };

  const handleAddVideo = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setEditingVideo(null);
    setVideoForm({
      title: "",
      description: "",
      url: "",
      duration: 0,
      thumbnail: "",
    });
    setVideoDialogOpen(true);
  };

  const handleEditVideo = (video: Video, sectionId: string) => {
    setSelectedSectionId(sectionId);
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      description: video.description,
      url: video.url,
      duration: video.duration,
      thumbnail: video.thumbnail || "",
    });
    setVideoDialogOpen(true);
  };

  const handleSaveVideo = () => {
    if (!videoForm.title.trim() || !videoForm.url.trim()) {
      setError("El título y URL del video son requeridos");
      return;
    }

    const newVideo: Video = {
      _id: editingVideo?._id || `temp_${Date.now()}`,
      title: videoForm.title,
      description: videoForm.description,
      url: videoForm.url,
      duration: videoForm.duration,
      thumbnail: videoForm.thumbnail,
      order:
        sections.find((s) => s._id === selectedSectionId)?.videos.length ||
        0 + 1,
    };

    setSections((prev) =>
      prev.map((section) => {
        if (section._id === selectedSectionId) {
          if (editingVideo) {
            return {
              ...section,
              videos: section.videos.map((v) =>
                v._id === editingVideo._id ? newVideo : v,
              ),
            };
          } else {
            return {
              ...section,
              videos: [...section.videos, newVideo],
            };
          }
        }
        return section;
      }),
    );

    setVideoDialogOpen(false);
    setVideoForm({
      title: "",
      description: "",
      url: "",
      duration: 0,
      thumbnail: "",
    });
  };

  const handleDeleteVideo = (videoId: string, sectionId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section._id === sectionId) {
          return {
            ...section,
            videos: section.videos.filter((v) => v._id !== videoId),
          };
        }
        return section;
      }),
    );
  };

  const handleCompleteCourse = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (sections.length === 0) {
        setError("Debes agregar al menos una sección con videos");
        return;
      }

      const completeData: CompleteCourseRequest = {
        sections: sections.map((section) => ({
          title: section.title,
          description: section.description,
          order: section.order,
          videos: section.videos.map((video) => ({
            title: video.title,
            description: video.description,
            url: video.url,
            duration: video.duration,
            thumbnail: video.thumbnail,
            order: video.order,
          })),
        })),
      };

      const completedCourse = await courseService.completeCourse(
        courseId,
        completeData,
      );
      if (completedCourse) {
        setSuccess("Curso completado y publicado exitosamente!");
        setTimeout(() => {
          router.push("/teacher/courses");
        }, 2000);
      } else {
        setError("Error al completar el curso");
      }
    } catch {
      setError("Error al completar el curso");
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== "maestro") {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar currentPage="teacher" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            Solo los maestros pueden editar cursos.
          </Alert>
        </Container>
      </Box>
    );
  }

  if (isLoading) {
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

  if (!draftCourse) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar currentPage="teacher" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">Borrador del curso no encontrado.</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar currentPage="teacher" />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push("/teacher/courses")}
          >
            Volver
          </Button>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Editar Curso: {draftCourse.title}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Información del Curso */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Información del Curso
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography>
              <strong>Título:</strong> {draftCourse.title}
            </Typography>
            <Typography>
              <strong>Descripción:</strong> {draftCourse.description}
            </Typography>
            <Typography>
              <strong>Precio:</strong> ${draftCourse.price}
            </Typography>
            <Chip label="Borrador" color="warning" size="small" />
          </Box>
        </Paper>

        {/* Secciones */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Secciones del Curso
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddSection}
            >
              Agregar Sección
            </Button>
          </Box>

          {sections.length === 0 ? (
            <Alert severity="info">
              No hay secciones agregadas. Agrega al menos una sección con videos
              para completar el curso.
            </Alert>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sections.map((section, index) => (
                <Card key={section._id}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {index + 1}. {section.title}
                        </Typography>
                        {section.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            paragraph
                          >
                            {section.description}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {section.videos.length} video(s)
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditSection(section)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSection(section._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Videos de la sección */}
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle2">Videos</Typography>
                        <Button
                          size="small"
                          startIcon={<Add />}
                          onClick={() => handleAddVideo(section._id)}
                        >
                          Agregar Video
                        </Button>
                      </Box>

                      {section.videos.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No hay videos en esta sección
                        </Typography>
                      ) : (
                        <List dense>
                          {section.videos.map((video, videoIndex) => (
                            <ListItem key={video._id}>
                              <ListItemText
                                primary={`${videoIndex + 1}. ${video.title}`}
                                secondary={`${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, "0")}`}
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleEditVideo(video, section._id)
                                  }
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDeleteVideo(video._id, section._id)
                                  }
                                >
                                  <Delete />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>

        {/* Botón de completar curso */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Publish />}
            onClick={handleCompleteCourse}
            disabled={isLoading || sections.length === 0}
          >
            {isLoading ? "Completando..." : "Completar y Publicar Curso"}
          </Button>
        </Box>
      </Container>

      {/* Modal para agregar/editar sección */}
      <Dialog
        open={sectionDialogOpen}
        onClose={() => setSectionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSection ? "Editar Sección" : "Agregar Sección"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título de la Sección"
            value={sectionForm.title}
            onChange={(e) =>
              setSectionForm((prev) => ({ ...prev, title: e.target.value }))
            }
            sx={{ mb: 2, mt: 1 }}
            required
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción"
            value={sectionForm.description}
            onChange={(e) =>
              setSectionForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveSection} variant="contained">
            {editingSection ? "Actualizar" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para agregar/editar video */}
      <Dialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingVideo ? "Editar Video" : "Agregar Video"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título del Video"
            value={videoForm.title}
            onChange={(e) =>
              setVideoForm((prev) => ({ ...prev, title: e.target.value }))
            }
            sx={{ mb: 2, mt: 1 }}
            required
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Descripción"
            value={videoForm.description}
            onChange={(e) =>
              setVideoForm((prev) => ({ ...prev, description: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="URL del Video"
            value={videoForm.url}
            onChange={(e) =>
              setVideoForm((prev) => ({ ...prev, url: e.target.value }))
            }
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            type="number"
            label="Duración (segundos)"
            value={videoForm.duration}
            onChange={(e) =>
              setVideoForm((prev) => ({
                ...prev,
                duration: parseInt(e.target.value) || 0,
              }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="URL de la Miniatura (opcional)"
            value={videoForm.thumbnail}
            onChange={(e) =>
              setVideoForm((prev) => ({ ...prev, thumbnail: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVideoDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveVideo} variant="contained">
            {editingVideo ? "Actualizar" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
