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

  const formatDuration = (seconds: number): string => {
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
                Domina las Matemáticas
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
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
              {userCourses.map((course) => (
                <Box key={course._id} flex={1}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      }
                    }}
                    onClick={() => handleCourseClick(course._id)}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 200,
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <School sx={{ fontSize: 80 }} />
                    </CardMedia>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CheckCircle color="success" fontSize="small" />
                        <Typography variant="caption" color="success.main">
                          En Progreso
                        </Typography>
                      </Box>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {course.description}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AccessTime fontSize="small" />
                          <Typography variant="caption">
                            {formatDuration(course.totalDuration)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <People fontSize="small" />
                          <Typography variant="caption">
                            {course.totalStudents}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        variant="contained" 
                        fullWidth
                        startIcon={<PlayArrow />}
                      >
                        Continuar
                      </Button>
                    </CardActions>
                  </Card>
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
          
          {!availableCourses || availableCourses.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No hay cursos disponibles en este momento.
              </Typography>
            </Paper>
          ) : (
            <Box display="flex" flexDirection="column" gap={3}>
              {availableCourses.map((course) => (
                <Box key={course._id} flex={1}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      }
                    }}
                    onClick={() => handleCourseClick(course._id)}
                  >
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
                        <Chip
                          label={`$${course.price}`}
                          color="primary"
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            bgcolor: 'white',
                            color: 'primary.main',
                            fontWeight: 600,
                          }}
                        />
                      </CardMedia>

                      {/* Contenido del Curso */}
                      <Box flex={1} display="flex" flexDirection="column">
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Rating value={course.rating || 0} precision={0.1} size="small" readOnly />
                            <Typography variant="caption" color="text.secondary">
                              ({course.rating || 0})
                            </Typography>
                          </Box>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {course.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {course.description}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <AccessTime fontSize="small" />
                              <Typography variant="caption">
                                {formatDuration(course.totalDuration)}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <People fontSize="small" />
                              <Typography variant="caption">
                                {course.totalStudents} estudiantes
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button 
                            variant="contained" 
                            fullWidth
                            startIcon={<School />}
                          >
                            Comprar Curso
                          </Button>
                        </CardActions>
                      </Box>
                    </Box>
                  </Card>
                </Box>
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
