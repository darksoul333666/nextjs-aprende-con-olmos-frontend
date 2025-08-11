'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { courseService } from '../services/courseService';
import { authService } from '../services/authService';

export default function DebugPage() {
  const { user, isAuthenticated } = useAuth();
  const [courses, setCourses] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (user?.role === 'estudiante') {
        const coursesData = await courseService.getPurchasedCourses();
        setCourses(coursesData);
      } else if (user?.role === 'maestro') {
        const coursesData = await courseService.getTeacherCourses();
        setCourses(coursesData);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Error al cargar los cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 4 }}>
        🔍 Página de Debug
      </Typography>

      {/* Información del Usuario */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
          Información del Usuario
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2">
            <strong>Autenticado:</strong> {isAuthenticated ? 'Sí' : 'No'}
          </Typography>
          <Typography variant="body2">
            <strong>Usuario:</strong> {user ? JSON.stringify(user, null, 2) : 'No hay usuario'}
          </Typography>
          <Typography variant="body2">
            <strong>Token:</strong> {authService.getToken() || 'No hay token'}
          </Typography>
        </Box>
      </Paper>

      {/* Acciones de Debug */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
          Acciones de Debug
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={fetchCourses}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Cargar Mis Cursos'}
          </Button>
          <Button
            variant="outlined"
            onClick={clearStorage}
          >
            Limpiar localStorage
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Usuario actual:', user);
              console.log('Estado de autenticación:', isAuthenticated);
              console.log('Token:', authService.getToken());
            }}
          >
            Log a Consola
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.location.href = '/debug/courses'}
          >
            Debug de Cursos
          </Button>
        </Box>
      </Paper>

      {/* Cursos */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
          Mis Cursos ({courses.length})
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {courses.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay cursos cargados
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {courses.map((course, index) => (
              <Paper key={index} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>
                  Curso {index + 1}
                </Typography>
                <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem' }}>
                  {JSON.stringify(course, null, 2)}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Información del Sistema */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
          Información del Sistema
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2">
            <strong>URL actual:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
          </Typography>
          <Typography variant="body2">
            <strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}
          </Typography>
          <Typography variant="body2">
            <strong>localStorage disponible:</strong> {typeof window !== 'undefined' ? 'Sí' : 'No'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
