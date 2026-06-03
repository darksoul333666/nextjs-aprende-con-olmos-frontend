"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Save,
  Edit,
  Delete,
  Add,
  ArrowBack,
  Visibility,
  VisibilityOff,
  Publish,
  Drafts,
  ExpandMore,
  DragIndicator,
  VideoLibrary,
  Description,
  Settings,
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import {
  courseService,
  Course,
  Section,
  Video,
  CreateCourseRequest,
} from "../../../services/courseService";
import { Navbar } from "../../../components/Navigation/Navbar";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{
    title: string;
    videos?: Omit<Video, "_id">[];
  } | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoDescription, setNewVideoDescription] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoMinutes, setNewVideoMinutes] = useState("");
  const [newVideoSeconds, setNewVideoSeconds] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState<Partial<CreateCourseRequest>>({
    title: "",
    description: "",
    price: 0,
    sections: [],
  });

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        const courseData = await courseService.getCourse(courseId);
        if (courseData) {
          setCourse(courseData);
          setFormData({
            title: courseData.title,
            description: courseData.description,
            price: courseData.price,
            sections: courseData.sections,
          });
        } else {
          setError("Curso no encontrado");
        }
      } catch {
        setError("No se pudo cargar la información del curso");
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]:
          field === "price" ? parseFloat(e.target.value) || 0 : e.target.value,
      }));
    };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (!course) return;

      const updatedCourse = await courseService.updateCourse(
        courseId,
        formData,
      );
      if (updatedCourse) {
        setCourse(updatedCourse);
        setEditMode(false);
        setSuccess("Curso actualizado correctamente");
      } else {
        setError("Error al actualizar el curso");
      }
    } catch {
      setError("Error al actualizar el curso");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishCourse = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (!course) return;

      const publishedCourse =
        await courseService.toggleCourseVisibility(courseId);
      if (publishedCourse) {
        setCourse(publishedCourse);
        setSuccess("Curso publicado exitosamente");
      } else {
        setError("Error al publicar el curso");
      }
    } catch {
      setError("Error al publicar el curso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (!course) return;

      const updatedCourse =
        await courseService.toggleCourseVisibility(courseId);
      if (updatedCourse) {
        setCourse(updatedCourse);
        setSuccess(
          course.isVisible
            ? "Curso ocultado exitosamente"
            : "Curso publicado exitosamente",
        );
      } else {
        setError("Error al cambiar la visibilidad del curso");
      }
    } catch {
      setError("Error al cambiar la visibilidad del curso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection: Omit<Section, "_id"> = {
      title: newSectionTitle.trim(),
      description: "",
      order: (formData.sections?.length || 0) + 1,
      videos: [],
    };

    setFormData((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));

    setNewSectionTitle("");
    setShowAddSectionDialog(false);
  };

  const handleAddVideo = async () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim() || !selectedSection)
      return;

    const minutes = parseInt(newVideoMinutes) || 0;
    const seconds = parseInt(newVideoSeconds) || 0;

    if (minutes < 0 || seconds < 0) {
      setError("Los minutos y segundos no pueden ser negativos");
      return;
    }

    if (seconds > 59) {
      setError("Los segundos no pueden ser mayores a 59");
      return;
    }

    const totalSeconds = minutes * 60 + seconds;

    if (!minutes && !seconds) {
      setError("Debes ingresar al menos minutos o segundos");
      return;
    }

    if (totalSeconds <= 0) {
      setError("La duración debe ser mayor a 0");
      return;
    }

    if (!Number.isInteger(totalSeconds) || totalSeconds <= 0) {
      setError("La duración debe ser un número entero positivo");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const newVideo: Omit<Video, "_id"> = {
        title: newVideoTitle.trim(),
        description: newVideoDescription.trim(),
        url: newVideoUrl.trim(),
        duration: totalSeconds,
        order: (selectedSection.videos?.length || 0) + 1,
      };

      const updatedFormData = {
        ...formData,
        sections: formData.sections?.map((section) => {
          if (section.title === selectedSection.title) {
            return {
              ...section,
              videos: [...(section.videos || []), newVideo],
            };
          }
          return section;
        }),
      };
      const updatedCourse = await courseService.updateCourse(
        courseId,
        updatedFormData,
      );
      if (updatedCourse) {
        setCourse(updatedCourse);
        setFormData(updatedFormData);
        setSuccess("Video agregado y guardado correctamente");
      } else {
        setError("Error al guardar el video en el backend");
      }
      setNewVideoTitle("");
      setNewVideoDescription("");
      setNewVideoUrl("");
      setNewVideoMinutes("");
      setNewVideoSeconds("");
      setSelectedSection(null);
      setShowAddVideoDialog(false);
    } catch {
      setError("Error al agregar el video");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSection = (sectionTitle: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections?.filter(
        (section) => section.title !== sectionTitle,
      ),
    }));
  };

  const handleRemoveVideo = (sectionTitle: string, videoTitle: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections?.map((section) =>
        section.title === sectionTitle
          ? {
              ...section,
              videos:
                section.videos?.filter((video) => video.title !== videoTitle) ||
                [],
            }
          : section,
      ),
    }));
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const steps = [
    {
      label: "Información Básica",
      description: "Título, descripción y precio del curso",
      icon: <Description />,
    },
    {
      label: "Secciones y Videos",
      description: "Organiza el contenido del curso",
      icon: <VideoLibrary />,
    },
    {
      label: "Configuración",
      description: "Visibilidad y estado del curso",
      icon: <Settings />,
    },
  ];

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

  if (!course) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar currentPage="courses" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h5" color="text.secondary">
              Curso no encontrado.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar currentPage="courses" />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => router.push("/teacher/courses")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            {courseId === "new"
              ? "Crear Nuevo Curso"
              : `Editar: ${course.title}`}
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

        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} orientation="horizontal">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  icon={step.icon}
                  onClick={() => setActiveStep(index)}
                  sx={{ cursor: "pointer" }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Box sx={{ mb: 4 }}>
          {activeStep === 0 && (
            <Paper sx={{ p: 4 }}>
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
                  sx={{ fontWeight: 600 }}
                >
                  Información Básica
                </Typography>
                <Button
                  variant={editMode ? "outlined" : "contained"}
                  startIcon={editMode ? <Save /> : <Edit />}
                  onClick={editMode ? handleSave : () => setEditMode(true)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <CircularProgress size={20} />
                  ) : editMode ? (
                    "Guardar"
                  ) : (
                    "Editar"
                  )}
                </Button>
              </Box>

              <Box display="flex" flexDirection="column" gap={3}>
                <TextField
                  fullWidth
                  label="Título del Curso"
                  value={formData.title}
                  onChange={handleInputChange("title")}
                  disabled={!editMode}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descripción"
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  disabled={!editMode}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Precio ($)"
                  value={formData.price}
                  onChange={handleInputChange("price")}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Box>
            </Paper>
          )}

          {activeStep === 1 && (
            <Paper sx={{ p: 4 }}>
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
                  sx={{ fontWeight: 600 }}
                >
                  Secciones y Videos
                </Typography>
                {editMode && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowAddSectionDialog(true)}
                  >
                    Agregar Sección
                  </Button>
                )}
              </Box>

              {formData.sections && formData.sections.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={3}>
                  {formData.sections.map((section, sectionIndex) => (
                    <Accordion key={sectionIndex} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            width: "100%",
                          }}
                        >
                          <DragIndicator color="action" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {section.title}
                          </Typography>
                          <Chip
                            label={`${section.videos?.length || 0} videos`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </AccordionSummary>
                      {editMode && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            zIndex: 1,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveSection(section.title)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      )}
                      <AccordionDetails>
                        {section.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            {section.description}
                          </Typography>
                        )}

                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                            >
                              Videos
                            </Typography>
                            {editMode && (
                              <Button
                                size="small"
                                startIcon={
                                  isSaving ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Add />
                                  )
                                }
                                onClick={() => {
                                  setSelectedSection(section);
                                  setShowAddVideoDialog(true);
                                }}
                                disabled={isSaving}
                              >
                                {isSaving ? "Guardando..." : "Agregar Video"}
                              </Button>
                            )}
                          </Box>

                          {section.videos && section.videos.length > 0 ? (
                            <List dense>
                              {section.videos.map((video, videoIndex) => (
                                <ListItem key={videoIndex} sx={{ px: 0 }}>
                                  <ListItemText
                                    primary={video.title}
                                    secondaryTypographyProps={{
                                      component: "div",
                                    }}
                                    secondary={
                                      <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={2}
                                      >
                                        <Typography variant="caption">
                                          {formatDuration(video.duration || 0)}
                                        </Typography>
                                        {video.description && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {video.description}
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                  />
                                  {editMode && (
                                    <ListItemSecondaryAction>
                                      <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() =>
                                          handleRemoveVideo(
                                            section.title,
                                            video.title,
                                          )
                                        }
                                        color="error"
                                      >
                                        <Delete />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  )}
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No hay videos en esta sección
                            </Typography>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <VideoLibrary
                    sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No hay secciones en este curso
                  </Typography>
                  {editMode && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setShowAddSectionDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Agregar Primera Sección
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          )}

          {activeStep === 2 && (
            <Paper sx={{ p: 4 }}>
              <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 600, mb: 3 }}
              >
                Configuración del Curso
              </Typography>

              <Box display="flex" flexDirection="column" gap={3}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{ fontWeight: 600 }}
                      >
                        Estado del Curso
                      </Typography>
                      <Chip
                        label={course.isVisible ? "Publicado" : "Borrador"}
                        color={course.isVisible ? "success" : "default"}
                        icon={course.isVisible ? <Visibility /> : <Drafts />}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      {course.isVisible
                        ? "Tu curso está visible para todos los estudiantes y puede ser comprado."
                        : "Tu curso está en modo borrador y solo tú puedes verlo."}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      {!course.isVisible ? (
                        <Button
                          variant="contained"
                          startIcon={<Publish />}
                          onClick={handlePublishCourse}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <CircularProgress size={20} />
                          ) : (
                            "Publicar Curso"
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<VisibilityOff />}
                          onClick={handleToggleVisibility}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <CircularProgress size={20} />
                          ) : (
                            "Ocultar Curso"
                          )}
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{ fontWeight: 600, mb: 2 }}
                    >
                      Información del Curso
                    </Typography>

                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Secciones:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formData.sections?.length || 0}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Videos Totales:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formData.sections?.reduce(
                            (total, section) =>
                              total + (section.videos?.length || 0),
                            0,
                          ) || 0}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Duración Total:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatDuration(course.totalDuration || 0)}
                        </Typography>
                      </Box>

                      {course.isVisible && (
                        <>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Estudiantes:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {course.totalStudents || 0}
                            </Typography>
                          </Box>

                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Calificación:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {course.rating?.toFixed(1) || "0.0"}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Paper>
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={activeStep === 0}
            onClick={() =>
              setActiveStep((prevActiveStep) => prevActiveStep - 1)
            }
          >
            Anterior
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              setActiveStep((prevActiveStep) => prevActiveStep + 1)
            }
            disabled={activeStep === steps.length - 1}
          >
            Siguiente
          </Button>
        </Box>
      </Container>

      <Dialog
        open={showAddSectionDialog}
        onClose={() => setShowAddSectionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar Nueva Sección</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título de la Sección"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddSectionDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddSection} variant="contained">
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showAddVideoDialog}
        onClose={() => setShowAddVideoDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar Nuevo Video</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título del Video"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Descripción (opcional)"
            value={newVideoDescription}
            onChange={(e) => setNewVideoDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="URL del Video"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Minutos"
              value={newVideoMinutes}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "" ||
                  (parseInt(value) >= 0 && parseInt(value) <= 999)
                ) {
                  setNewVideoMinutes(value);
                }
              }}
              placeholder="5"
              inputProps={{ min: 0, max: 999 }}
              helperText="0-999 minutos"
            />
            <TextField
              fullWidth
              type="number"
              label="Segundos"
              value={newVideoSeconds}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "" ||
                  (parseInt(value) >= 0 && parseInt(value) <= 59)
                ) {
                  setNewVideoSeconds(value);
                }
              }}
              placeholder="30"
              inputProps={{ min: 0, max: 59 }}
              helperText="0-59 segundos"
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Ejemplo: 5 minutos y 30 segundos = 5:30
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAddVideoDialog(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddVideo}
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : <Add />}
          >
            {isSaving ? "Guardando..." : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
