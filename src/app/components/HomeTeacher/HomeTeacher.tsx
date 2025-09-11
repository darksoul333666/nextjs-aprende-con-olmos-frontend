'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from '@mui/material';
import { School } from '@mui/icons-material';
import { Navbar } from '../Navigation/Navbar';
import { TeacherDashboard } from '../TeacherDashboard';
import { Course } from '../../services/courseService';

interface HomeTeacherProps {
  availableCourses: Course[];
  isLoading: boolean;
}

export const HomeTeacher: React.FC<HomeTeacherProps> = ({
  availableCourses,
  isLoading
}) => {
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
      
      {/* Hero Section para Maestros */}
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
                Panel de Control del Maestro
              </Typography>
              <Typography variant="h5" paragraph sx={{ opacity: 0.9 }}>
                Gestiona tus cursos, revisa estadísticas y supervisa el progreso de tus estudiantes.
              </Typography>
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
        {/* Dashboard del Maestro */}
        <TeacherDashboard />
      </Container>
    </Box>
  );
};
