'use client';

import React, { useEffect, useState } from 'react';
import { Container, CircularProgress, Paper, Typography, Box, Button, Chip } from '@mui/material';
import { Edit, Visibility } from '@mui/icons-material';
import { CoursePlayer } from '../../components/CoursePlayer/CoursePlayer';
import { courseService, Course } from '../../services/courseService';
import { progressService } from '../../services/progressService';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/Navigation/Navbar';

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Detectar si está en modo preview
  const isPreviewMode = searchParams.get('preview') === 'true';

  // Handle SSR - only render after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const courseData = await courseService.getCourse(courseId);
        setCourse(courseData);
      } catch (error) {
        console.error('Error fetching course:', error);
        setError('No se pudo cargar el curso');
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleVideoComplete = async (videoId: string) => {
    // No guardar progreso en modo preview
    if (isPreviewMode || !isAuthenticated || !course) return;

    try {
      await progressService.markVideoCompleted(course._id, videoId);
      console.log('Video completed:', videoId);
    } catch (error) {
      console.error('Error marking video as completed:', error);
    }
  };

  const handleVideoProgress = async (videoId: string, progress: number) => {
    // No guardar progreso en modo preview
    if (isPreviewMode || !isAuthenticated || !course) return;

    try {
      await progressService.updateVideoProgress(course._id, videoId, progress);
      console.log('Video progress:', videoId, progress);
    } catch (error) {
      console.error('Error updating video progress:', error);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar />
        <Box sx={{ 
          minHeight: 'calc(100vh - 64px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <CircularProgress size={60} />
        </Box>
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar />
        <Container maxWidth={false} disableGutters sx={{ height: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {error || 'Curso no encontrado'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              El curso que buscas no existe o no tienes permisos para acceder a él.
            </Typography>
            {user?.role === 'maestro' && (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => router.push(`/courses/edit/${courseId}`)}
                sx={{ mt: 2 }}
              >
                Editar Curso
              </Button>
            )}
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar />
      <Container maxWidth={false} disableGutters sx={{ height: 'calc(100vh - 64px)', position: 'relative' }}>
        {/* Indicador de Preview */}
        {isPreviewMode && (
          <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}>
            <Chip
              icon={<Visibility />}
              label="Vista Previa"
              color="primary"
              variant="filled"
              sx={{ 
                bgcolor: 'rgba(41, 50, 218, 0.9)',
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-icon': {
                  color: 'white'
                }
              }}
            />
          </Box>
        )}
        
        {/* Botón de Editar - Solo para maestros y NO en modo preview */}
        {user?.role === 'maestro' && !isPreviewMode && (
          <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => router.push(`/courses/edit/${courseId}`)}
              sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
            >
              Editar Curso
            </Button>
          </Box>
        )}
        
        <CoursePlayer
          course={course}
          onVideoComplete={handleVideoComplete}
          onVideoProgress={handleVideoProgress}
        />
      </Container>
    </Box>
  );
}
