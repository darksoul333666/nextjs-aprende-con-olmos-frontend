'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  LinearProgress,
  Chip,
  Paper,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  AccessTime,
  CheckCircle,
  School,
  TrendingUp,
  Book,
} from '@mui/icons-material';
import { Navbar } from '../components/Navigation/Navbar';
import { courseService, Course } from '../services/courseService';
import { progressService, CourseProgress } from '../services/progressService';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const courses = await courseService.getPurchasedCourses();
        setUserCourses(courses);

        // Obtener progreso para cada curso
        const progressData: Record<string, CourseProgress> = {};
        for (const course of courses) {
          try {
            const progress = await progressService.getCourseProgress(course._id);
            progressData[course._id] = progress;
          } catch (error) {
            console.error(`Error fetching progress for course ${course._id}:`, error);
          }
        }
        setCourseProgress(progressData);
      } catch (error) {
        console.error('Error fetching user courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCourses();
  }, [isAuthenticated]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateProgress = (course: Course): number => {
    const progress = courseProgress[course._id];
    if (!progress) return 0;
    return progress.progress;
  };

  const handleContinueCourse = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };

  const handleViewAllCourses = () => {
    router.push('/courses');
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar currentPage="my-courses" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Debes iniciar sesión para ver tus cursos
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/login')}
              sx={{ mt: 2 }}
            >
              Iniciar Sesión
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar currentPage="my-courses" />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Mis Cursos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Continúa tu aprendizaje donde lo dejaste
          </Typography>
        </Box>

        {userCourses.length === 0 ? (
          /* Estado Vacío */
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <Book sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              No tienes cursos aún
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Explora nuestra colección de cursos de matemáticas y comienza tu viaje de aprendizaje.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<School />}
              onClick={handleViewAllCourses}
            >
              Explorar Cursos
            </Button>
          </Paper>
        ) : (
          /* Lista de Cursos */
          <Box>
            {/* Estadísticas Rápidas */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
                <Box flex={1} display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Book />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {userCourses.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cursos Inscritos
                    </Typography>
                  </Box>
                </Box>
                <Box flex={1} display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {userCourses.filter(course => calculateProgress(course) === 100).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cursos Completados
                    </Typography>
                  </Box>
                </Box>
                <Box flex={1} display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {Math.round(userCourses.reduce((avg, course) => avg + calculateProgress(course), 0) / userCourses.length)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Progreso Promedio
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Cursos */}
            <Box display="flex" flexDirection="column" gap={3}>
              {userCourses.map((course) => {
                const progress = calculateProgress(course);
                const isCompleted = progress === 100;
                
                return (
                  <Card key={course._id} sx={{ 
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    }
                  }}>
                    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }}>
                      {/* Imagen del Curso */}
                      <CardMedia
                        component="div"
                        sx={{
                          width: { xs: '100%', md: 280 },
                          height: { xs: 200, md: 200 },
                          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          position: 'relative',
                        }}
                      >
                        <School sx={{ fontSize: 80 }} />
                        {isCompleted && (
                          <Chip
                            label="Completado"
                            color="success"
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              bgcolor: 'white',
                              color: 'success.main',
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </CardMedia>

                      {/* Contenido del Curso */}
                      <Box flex={1} display="flex" flexDirection="column">
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            {isCompleted ? (
                              <CheckCircle color="success" fontSize="small" />
                            ) : (
                              <PlayArrow color="primary" fontSize="small" />
                            )}
                            <Typography variant="caption" color={isCompleted ? 'success.main' : 'primary.main'}>
                              {isCompleted ? 'Completado' : 'En Progreso'}
                            </Typography>
                          </Box>
                          
                          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                            {course.title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {course.description}
                          </Typography>

                          {/* Progreso */}
                          <Box sx={{ mb: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2" color="text.secondary">
                                Progreso del curso
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {Math.round(progress)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={progress} 
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>

                          {/* Información Adicional */}
                          <Box display="flex" alignItems="center" gap={3}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <AccessTime fontSize="small" />
                              <Typography variant="caption">
                                {formatDuration(course.totalDuration)}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <School fontSize="small" />
                              <Typography variant="caption">
                                {course.sections.length} secciones
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>

                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            variant="contained"
                            startIcon={isCompleted ? <CheckCircle /> : <PlayArrow />}
                            onClick={() => handleContinueCourse(course._id)}
                            fullWidth
                          >
                            {isCompleted ? 'Repasar Curso' : 'Continuar'}
                          </Button>
                        </CardActions>
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </Box>

            {/* Call to Action */}
            <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                ¿Quieres aprender más?
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Explora nuestra colección completa de cursos de matemáticas
              </Typography>
              <Button
                variant="outlined"
                size="large"
                startIcon={<School />}
                onClick={handleViewAllCourses}
              >
                Ver Todos los Cursos
              </Button>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
}
