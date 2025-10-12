'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Rating,
  Avatar,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  AccessTime,
  People,
  Star,
  School,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import { Navbar } from '../Navigation/Navbar';
import { StudentStats } from '../StudentStats';
import { CourseCard } from '../CourseCard/CourseCard';
import { Course } from '../../services/courseService';
import { useRouter } from 'next/navigation';

interface HomeStudentsProps {
  availableCourses: Course[];
  userCourses: Course[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const HomeStudents: React.FC<HomeStudentsProps> = ({
  availableCourses,
  userCourses,
  isLoading,
  isAuthenticated
}) => {
  const router = useRouter();

  // Filtrar cursos disponibles para excluir los ya comprados
  const purchasedCourseIds = userCourses.map(course => course._id);
  const filteredAvailableCourses = availableCourses.filter(course => 
    !purchasedCourseIds.includes(course._id)
  );

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds || isNaN(seconds) || seconds <= 0) {
      return '0m';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };

  const handleMyCoursesClick = () => {
    router.push('/my-courses');
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar currentPage="home" />
      
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          mb: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" gap={4}>
            <Box flex={1}>
              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Matemáticas
              </Typography>
              <Typography variant="h5" paragraph sx={{ opacity: 0.9 }}>
                Aprende con el Prof. Carlos Olmos, experto en educación matemática con más de 15 años de experiencia.
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                  onClick={() => router.push('/courses')}
                >
                  Ver Todos los Cursos
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ 
                    borderColor: 'white', 
                    color: 'white',
                    '&:hover': { borderColor: 'grey.300', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  onClick={() => router.push('/teacher')}
                >
                  Conoce al Maestro
                </Button>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 300,
                flex: 1,
              }}
            >
              <School sx={{ fontSize: 200, opacity: 0.3 }} />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Mis Cursos en Progreso */}
        {isAuthenticated && userCourses.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
                Mis Cursos en Progreso
              </Typography>
              <Button
                variant="text"
                onClick={handleMyCoursesClick}
                endIcon={<PlayArrow />}
              >
                Ver Todos
              </Button>
            </Box>
            {/* Debug info - remover en producción */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Debug: {userCourses.length} cursos encontrados
                </Typography>
                {userCourses.map((course, index) => (
                  <Typography key={index} variant="caption" display="block">
                    {index + 1}. {course.title || 'Sin título'} - ID: {course._id}
                  </Typography>
                ))}
              </Box>
            )}
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
              {userCourses.map((course) => (
                <Box key={course._id} flex={1}>
                  <CourseCard
                    course={course}
                    variant="compact"
                    showActions={true}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Cursos Disponibles */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Cursos Disponibles
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Explora nuestra colección completa de cursos de matemáticas diseñados para todos los niveles.
          </Typography>
          
          {!filteredAvailableCourses || filteredAvailableCourses.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {isAuthenticated && userCourses.length > 0 
                  ? '¡Felicidades! Ya tienes acceso a todos los cursos disponibles.'
                  : 'No hay cursos disponibles en este momento.'
                }
              </Typography>
            </Paper>
          ) : (
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(auto-fit, minmax(400px, 1fr))' }} gap={3}>
              {filteredAvailableCourses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  variant="default"
                  showActions={true}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Estadísticas para Estudiantes */}
        <StudentStats availableCourses={availableCourses} />
      </Container>
    </Box>
  );
};
