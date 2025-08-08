'use client';

import React, { useState, useEffect } from 'react';
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
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Save,
  Edit,
  Delete,
  Add,
  School,
  PlayArrow,
  ArrowBack,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { courseService, Course, Section, Video, CreateCourseRequest } from '../../../services/courseService';
import { Navbar } from '../../../components/Navigation/Navbar';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const [formData, setFormData] = useState<Partial<CreateCourseRequest>>({
    title: '',
    description: '',
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
          setError('Curso no encontrado');
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('No se pudo cargar la información del curso');
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'price' ? parseFloat(e.target.value) || 0 : e.target.value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      if (!course) return;

      const updatedCourse = await courseService.updateCourse(courseId, formData);
      if (updatedCourse) {
        setCourse(updatedCourse);
        setEditMode(false);
        setSuccess('Curso actualizado correctamente');
      } else {
        setError('Error al actualizar el curso');
      }
    } catch (error) {
      setError('Error al actualizar el curso');
      console.error('Error updating course:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection: Omit<Section, 'id'> = {
      title: newSectionTitle.trim(),
      description: '',
      order: (formData.sections?.length || 0) + 1,
      videos: [],
    };

    setFormData(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));

    setNewSectionTitle('');
    setShowAddSectionDialog(false);
  };

  const handleAddVideo = () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim() || !selectedSection) return;

    const newVideo: Omit<Video, 'id'> = {
      title: newVideoTitle.trim(),
      description: newVideoDescription.trim(),
      url: newVideoUrl.trim(),
      duration: 0, // Se calcularía automáticamente
      order: (selectedSection.videos?.length || 0) + 1,
    };

    setFormData(prev => ({
      ...prev,
      sections: prev.sections?.map(section => 
        section.title === selectedSection.title 
          ? { ...section, videos: [...(section.videos || []), newVideo] }
          : section
      ),
    }));

    setNewVideoTitle('');
    setNewVideoDescription('');
    setNewVideoUrl('');
    setSelectedSection(null);
    setShowAddVideoDialog(false);
  };

  const handleRemoveSection = (sectionTitle: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections?.filter(section => section.title !== sectionTitle),
    }));
  };

  const handleRemoveVideo = (sectionTitle: string, videoTitle: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections?.map(section => 
        section.title === sectionTitle 
          ? { ...section, videos: section.videos?.filter(video => video.title !== videoTitle) || [] }
          : section
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

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar currentPage="courses" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h5" color="text.secondary">
              Curso no encontrado.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar currentPage="courses" />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/courses')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Editar Curso: {course.title}
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

        <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={4}>
          {/* Información Básica */}
          <Box flex={2}>
            <Paper sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                  Información Básica
                </Typography>
                <Button
                  variant={editMode ? 'outlined' : 'contained'}
                  startIcon={editMode ? <Save /> : <Edit />}
                  onClick={editMode ? handleSave : () => setEditMode(true)}
                  disabled={isSaving}
                >
                  {isSaving ? <CircularProgress size={20} /> : (editMode ? 'Guardar' : 'Editar')}
                </Button>
              </Box>

              <Box display="flex" flexDirection="column" gap={3}>
                <TextField
                  fullWidth
                  label="Título del Curso"
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  disabled={!editMode}
                />
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descripción"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  disabled={!editMode}
                />
                
                <TextField
                  fullWidth
                  type="number"
                  label="Precio ($)"
                  value={formData.price}
                  onChange={handleInputChange('price')}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={course.isVisible}
                      disabled={!editMode}
                      onChange={async () => {
                        try {
                          await courseService.toggleCourseVisibility(courseId);
                          setCourse(prev => prev ? { ...prev, isVisible: !prev.isVisible } : null);
                        } catch (error) {
                          setError('Error al cambiar la visibilidad del curso');
                        }
                      }}
                    />
                  }
                  label="Curso Visible"
                />
              </Box>
            </Paper>

            {/* Secciones del Curso */}
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                  Secciones del Curso
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
                    <Card key={sectionIndex} sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                            {section.title}
                          </Typography>
                          {editMode && (
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveSection(section.title)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          )}
                        </Box>
                        
                        {section.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {section.description}
                          </Typography>
                        )}

                        {/* Videos de la Sección */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Videos ({section.videos?.length || 0})
                            </Typography>
                            {editMode && (
                              <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={() => {
                                  setSelectedSection(section);
                                  setShowAddVideoDialog(true);
                                }}
                              >
                                Agregar Video
                              </Button>
                            )}
                          </Box>
                          
                          {section.videos && section.videos.length > 0 ? (
                            <List dense>
                              {section.videos.map((video, videoIndex) => (
                                <ListItem key={videoIndex} sx={{ px: 0 }}>
                                  <ListItemText
                                    primary={video.title}
                                    secondary={
                                      <Box display="flex" alignItems="center" gap={2}>
                                        <Typography variant="caption">
                                          {formatDuration(video.duration || 0)}
                                        </Typography>
                                        {video.description && (
                                          <Typography variant="caption" color="text.secondary">
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
                                        onClick={() => handleRemoveVideo(section.title, video.title)}
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
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
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
          </Box>

          {/* Información del Curso */}
          <Box flex={1}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                  Información del Curso
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Estado:
                    </Typography>
                    <Chip
                      label={course.isVisible ? 'Visible' : 'Oculto'}
                      color={course.isVisible ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
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
                      {formData.sections?.reduce((total, section) => total + (section.videos?.length || 0), 0) || 0}
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
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Estudiantes:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {course.totalStudents || 0}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Calificación:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {course.rating?.toFixed(1) || '0.0'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>

      {/* Dialog para agregar sección */}
      <Dialog open={showAddSectionDialog} onClose={() => setShowAddSectionDialog(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setShowAddSectionDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddSection} variant="contained">Agregar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar video */}
      <Dialog open={showAddVideoDialog} onClose={() => setShowAddVideoDialog(false)} maxWidth="sm" fullWidth>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddVideoDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddVideo} variant="contained">Agregar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

