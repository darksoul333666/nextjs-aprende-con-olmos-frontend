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
import { courseService, Course } from '../../services/courseService';
import { Navbar } from '../../components/Navigation/Navbar';

export default function TeacherCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'drafts'>('all');

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
      const coursesData = await courseService.getTeacherCourses();
      console.log('Cursos obtenidos:', coursesData);
      console.log('Estructura del primer curso:', coursesData[0]);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Error al cargar los cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      if (!newCourse.title.trim()) {
        setError('El título del curso es obligatorio');
        return;
      }

      const createdCourse = await courseService.createCourse({
        title: newCourse.title,
        description: newCourse.description,
        price: newCourse.price,
        sections: []
      });

      if (createdCourse) {
        setSuccess('Curso creado exitosamente como borrador');
        setShowCreateDialog(false);
        setNewCourse({ title: '', description: '', price: 0 });
        fetchCourses();
      } else {
        setError('Error al crear el curso');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      setError('Error al crear el curso');
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

  const getFilteredCourses = () => {
    console.log("Cursos obtenidos:", courses);
    
    switch (filter) {
      case 'published':
        return courses.filter(course => course.isVisible);
      case 'drafts':
        return courses.filter(course => !course.isVisible);
      default:
        return courses;
    }
  };

  const filteredCourses = getFilteredCourses();

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

        {/* Filtros y Acciones */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Gestionar Cursos
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateDialog(true)}
            >
              Crear Nuevo Curso
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/teacher/courses/create')}
            >
              Crear Curso (Página Completa)
            </Button>
          </Box>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por Estado</InputLabel>
            <Select
              value={filter}
              label="Filtrar por Estado"
              onChange={(e) => setFilter(e.target.value as 'all' | 'published' | 'drafts')}
            >
              <MenuItem value="all">Todos los Cursos</MenuItem>
              <MenuItem value="published">Cursos Publicados</MenuItem>
              <MenuItem value="drafts">Borradores</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              console.log('Usuario actual:', user);
              console.log('Estado de autenticación:', isAuthenticated);
            }}
          >
            Debug Usuario
          </Button>
        </Paper>

        {/* Lista de Cursos */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : filteredCourses.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              {filter === 'all' ? 'No tienes cursos aún' : 
               filter === 'published' ? 'No tienes cursos publicados' : 'No tienes borradores'}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {filter === 'all' ? 'Comienza creando tu primer curso' : 
               filter === 'published' ? 'Publica algunos de tus borradores' : 'Crea un nuevo borrador'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateDialog(true)}
              sx={{ mt: 2 }}
            >
              Crear Nuevo Curso
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
            {filteredCourses.map((course, index) => (
              <Box key={course._id || `course-${index}`}>
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
                      label={course.isVisible ? 'Publicado' : 'Borrador'}
                      color={course.isVisible ? 'success' : 'default'}
                      size="small"
                      icon={course.isVisible ? <Visibility /> : <Drafts />}
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
                          {formatDuration(course.totalDuration || 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <School fontSize="small" />
                        <Typography variant="caption">
                          {course.sections?.length || 0} secciones
                        </Typography>
                      </Box>
                      {course.isVisible && (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <People fontSize="small" />
                            <Typography variant="caption">
                              {course.totalStudents || 0}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star fontSize="small" />
                            <Typography variant="caption">
                              {course.rating?.toFixed(1) || '0.0'}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>

                    {/* TODO: Agregar createdAt a la interfaz Course 
                    <Typography variant="caption" color="text.secondary">
                      Creado: {new Date().toLocaleDateString()}
                    </Typography>
                    */}
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        console.log('Editando curso:', course);
                        console.log('ID del curso:', course._id);
                        if (!course._id) {
                          setError('Error: El curso no tiene un ID válido');
                          return;
                        }
                        router.push(`/courses/edit/${course._id}`);
                      }}
                      sx={{ flex: 1 }}
                      disabled={!course._id}
                    >
                      Editar
                    </Button>
                    
                    {!course.isVisible ? (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Publish />}
                        onClick={() => handlePublishCourse(course)}
                        sx={{ flex: 1 }}
                      >
                        Publicar
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityOff />}
                        onClick={() => handleToggleVisibility(course)}
                        sx={{ flex: 1 }}
                      >
                        Ocultar
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Box>
            ))}
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
          <Button onClick={handleCreateCourse} variant="contained">Crear Borrador</Button>
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
