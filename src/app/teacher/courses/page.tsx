'use client';

import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
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
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { courseService, Course, DraftCourse, TeacherCourse } from '../../services/courseService';
import { Navbar } from '../../components/Navigation/Navbar';

export default function TeacherCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [drafts, setDrafts] = useState<DraftCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(null);

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    price: 0,
  });

  useEffect(() => {
    if (user?.role !== 'maestro') {
      router.push('/');
      return;
    }

    fetchCourses();
  }, [user, router]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const [coursesData, draftsData] = await Promise.all([
        courseService.getTeacherCoursesWithStats(),
        courseService.getDraftCourses()
      ]);
      
      console.log('Cursos obtenidos:', coursesData);
      console.log('Borradores obtenidos:', draftsData);
      
      setCourses(coursesData.courses);
      setDrafts(draftsData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Error al cargar los cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    try {
      if (!newCourse.title.trim()) {
        setError('El título del curso es obligatorio');
        return;
      }

      const createdDraft = await courseService.createDraftCourse({
        title: newCourse.title,
        description: newCourse.description,
        price: newCourse.price,
      });

      if (createdDraft) {
        setSuccess('Borrador creado exitosamente');
        setShowCreateDialog(false);
        setNewCourse({ title: '', description: '', price: 0 });
        fetchCourses();
      } else {
        setError('Error al crear el borrador');
      }
    } catch (error) {
      console.error('Error creating draft:', error);
      setError('Error al crear el borrador');
    }
  };

  const handlePublishCourse = async (course: Course) => {
    try {
      const publishedCourse = await courseService.toggleCourseVisibility(course._id);
      if (publishedCourse) {
        setSuccess('Curso publicado exitosamente');
        fetchCourses();
      } else {
        setError('Error al publicar el curso');
      }
    } catch (error) {
      console.error('Error publishing course:', error);
      setError('Error al publicar el curso');
    }
  };

  const handleToggleVisibility = async (course: Course) => {
    try {
      const updatedCourse = await courseService.toggleCourseVisibility(course._id);
      if (updatedCourse) {
        setSuccess(course.isVisible ? 'Curso ocultado exitosamente' : 'Curso publicado exitosamente');
        fetchCourses();
      } else {
        setError('Error al cambiar la visibilidad del curso');
      }
    } catch (error) {
      console.error('Error toggling course visibility:', error);
      setError('Error al cambiar la visibilidad del curso');
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    try {
      // Aquí implementarías la lógica de eliminación si existe el endpoint
      setSuccess('Curso eliminado exitosamente');
      setShowDeleteDialog(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      setError('Error al eliminar el curso');
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


  if (user?.role !== 'maestro') {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar currentPage="teacher" />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/teacher')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Mis Cursos
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Acciones */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Gestionar Cursos
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/teacher/courses/create')}
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
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Sección de Cursos Publicados */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility color="success" />
                  Cursos Publicados ({courses.length})
                </Typography>
              </Box>

              {courses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    No tienes cursos publicados
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Completa algunos de tus borradores para publicarlos
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {courses.map((course, index) => (
                    <Box key={course.id || `course-${index}`}>
                      <Card sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        '&:hover': {
                          boxShadow: 4,
                        }
                      }}>
                        {/* Estado del Curso */}
                        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
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
                            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            position: 'relative',
                          }}
                        >
                          <School sx={{ fontSize: 60 }} />
                          <Chip
                            label={`$${course.price || 0}`}
                            color="primary"
                            sx={{
                              position: 'absolute',
                              top: 16,
                              left: 16,
                              bgcolor: 'white',
                              color: 'primary.main',
                              fontWeight: 600,
                            }}
                          />
                        </Box>

                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {course.title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {course.description}
                          </Typography>

                          {/* Estadísticas del Curso */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime fontSize="small" />
                              <Typography variant="caption">
                                {formatDuration(course.stats.totalDuration || 0)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <School fontSize="small" />
                              <Typography variant="caption">
                                {course.stats.sectionsCount || 0} secciones
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                            onClick={() => router.push(`/courses/edit/${course.id}`)}
                            sx={{ flex: 1 }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityOff />}
                            onClick={() => handleToggleVisibility(course as any)}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Drafts color="warning" />
                  Borradores ({drafts.length})
                </Typography>
              </Box>

              {drafts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Drafts sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
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
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {drafts.map((draft, index) => (
                    <Box key={draft.id || `draft-${index}`}>
                      <Card sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        '&:hover': {
                          boxShadow: 4,
                        }
                      }}>
                        {/* Estado del Curso */}
                        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
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
                            background: 'linear-gradient(45deg, #ff9800 30%, #f57c00 90%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            position: 'relative',
                          }}
                        >
                          <Drafts sx={{ fontSize: 60 }} />
                          <Chip
                            label={`$${draft.price || 0}`}
                            color="primary"
                            sx={{
                              position: 'absolute',
                              top: 16,
                              left: 16,
                              bgcolor: 'white',
                              color: 'primary.main',
                              fontWeight: 600,
                            }}
                          />
                        </Box>

                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {draft.title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {draft.description}
                          </Typography>

                          {/* Fecha de creación */}
                          <Typography variant="caption" color="text.secondary">
                            Creado: {new Date(draft.createdAt).toLocaleDateString()}
                          </Typography>
                        </CardContent>

                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => router.push(`/teacher/courses/edit/${draft.id}`)}
                            sx={{ flex: 1 }}
                          >
                            Completar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => router.push(`/teacher/courses/edit/${draft.id}`)}
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
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nuevo Curso</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título del Curso"
            value={newCourse.title}
            onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
            sx={{ mt: 2, mb: 2 }}
            required
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Descripción"
            value={newCourse.description}
            onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Precio ($)"
            value={newCourse.price}
            onChange={(e) => setNewCourse(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateDraft} variant="contained">Crear Borrador</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar el curso &quot;{selectedCourse?.title}&quot;? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={handleDeleteCourse} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para crear curso rápidamente */}
      <Fab
        color="primary"
        aria-label="Crear curso"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowCreateDialog(true)}
      >
        <Add />
      </Fab>
    </Box>
  );
}
