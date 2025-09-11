'use client';

import React, { useState, useEffect } from 'react';
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
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  AccessTime,
  People,
  School,
  ShoppingCart,
  FilterList,
  Visibility,
} from '@mui/icons-material';
import { Navbar } from '../components/Navigation/Navbar';
import { courseService, Course, CourseFilters } from '../services/courseService';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const coursesData = await courseService.getCourses();
        console.log('Cursos obtenidos:', coursesData);
        console.log('Estructura del primer curso:', coursesData[0]);
        const coursesArray = Array.isArray(coursesData) ? coursesData : [];
        setCourses(coursesArray);
        setFilteredCourses(coursesArray);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
        setFilteredCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    // Filtrar cursos basado en los criterios
    let filtered = courses;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por precio
    if (priceFilter !== 'all') {
      filtered = filtered.filter(course => {
        const price = course.price || 0;
        switch (priceFilter) {
          case 'low':
            return price < 300;
          case 'medium':
            return price >= 300 && price < 500;
          case 'high':
            return price >= 500;
          default:
            return true;
        }
      });
    }

    // Filtro por duración
    if (durationFilter !== 'all') {
      filtered = filtered.filter(course => {
        const hours = (course.totalDuration || 0) / 3600;
        switch (durationFilter) {
          case 'short':
            return hours < 20;
          case 'medium':
            return hours >= 20 && hours < 40;
          case 'long':
            return hours >= 40;
          default:
            return true;
        }
      });
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, priceFilter, durationFilter]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleCourseClick = (courseId: string) => {
    if (!courseId) {
      console.error('Error: El curso no tiene un ID válido');
      alert('Error: El curso no tiene un ID válido');
      return;
    }
    router.push(`/course/${courseId}`);
  };

  const handlePurchase = (courseId: string) => {
    // Aquí se implementaría la lógica de compra
    console.log('Comprando curso:', courseId);
    alert('Funcionalidad de compra en desarrollo');
  };

  const handlePreview = (courseId: string) => {
    // Navegar a la vista de preview del curso
    router.push(`/course/${courseId}?preview=true`);
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
      <Navbar currentPage="courses" />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Cursos Disponibles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explora nuestra colección completa de cursos de matemáticas
          </Typography>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <FilterList color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filtros
            </Typography>
          </Box>
          
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
            <TextField
              fullWidth
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Precio</InputLabel>
              <Select
                value={priceFilter}
                label="Precio"
                onChange={(e) => setPriceFilter(e.target.value)}
              >
                <MenuItem value="all">Todos los precios</MenuItem>
                <MenuItem value="low">Menos de $300</MenuItem>
                <MenuItem value="medium">$300 - $500</MenuItem>
                <MenuItem value="high">Más de $500</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Duración</InputLabel>
              <Select
                value={durationFilter}
                label="Duración"
                onChange={(e) => setDurationFilter(e.target.value)}
              >
                <MenuItem value="all">Todas las duraciones</MenuItem>
                <MenuItem value="short">Menos de 20h</MenuItem>
                <MenuItem value="medium">20h - 40h</MenuItem>
                <MenuItem value="long">Más de 40h</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Resultados */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Lista de Cursos */}
        {filteredCourses.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mx: 'auto', mb: 3 }}>
              <Search sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              No se encontraron cursos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Intenta ajustar los filtros de búsqueda
            </Typography>
          </Paper>
        ) : (
          <Box display="flex" flexDirection="column" gap={3}>
            {filteredCourses.map((course) => (
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
                    <Chip
                      label={`$${course.price || 0}`}
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
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Rating value={course.rating || 0} precision={0.1} size="small" readOnly />
                        <Typography variant="body2" color="text.secondary">
                          ({course.rating || 0})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          • {course.totalStudents || 0} estudiantes
                        </Typography>
                      </Box>
                      
                      <Typography variant="h5" component="h3" gutterBottom>
                        {course.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {course.description}
                      </Typography>

                      {/* Información del Curso */}
                      <Box display="flex" alignItems="center" gap={3} mb={2}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AccessTime fontSize="small" />
                          <Typography variant="body2">
                            {formatDuration(course.totalDuration || 0)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <School fontSize="small" />
                          <Typography variant="body2">
                            {course.sections?.length || 0} secciones
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <People fontSize="small" />
                          <Typography variant="body2">
                            {course.totalStudents || 0} estudiantes
                          </Typography>
                        </Box>
                      </Box>

                      {/* Lo que aprenderás */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                          Lo que aprenderás:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {course.sections?.slice(0, 3).map((section, index) => (
                            <Chip
                              key={index}
                              label={section.title}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                          {course.sections && course.sections.length > 3 && (
                            <Chip
                              label={`+${course.sections.length - 3} más`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          console.log('Curso clickeado:', course);
                          console.log('ID del curso:', course._id);
                          handleCourseClick(course._id);
                        }}
                        sx={{ flex: 1 }}
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handlePreview(course._id)}
                        sx={{ flex: 1 }}
                      >
                        Ver Preview
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<ShoppingCart />}
                        onClick={() => handlePurchase(course._id)}
                        sx={{ flex: 1 }}
                      >
                        Comprar ${course.price || 0}
                      </Button>
                    </CardActions>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}

        {/* Call to Action */}
        <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            ¿Necesitas ayuda para elegir?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Contacta al maestro para recibir asesoría personalizada sobre qué curso es mejor para ti
          </Typography>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.push('/teacher')}
          >
            Contactar al Maestro
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
