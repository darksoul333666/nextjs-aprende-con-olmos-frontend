'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { courseService, CreateDraftRequest } from '../../../services/courseService';
import { Navbar } from '../../../components/Navigation/Navbar';

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateDraftRequest>({
    title: '',
    description: '',
    price: 0,
  });

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'price' ? parseFloat(e.target.value) || 0 : e.target.value
    }));
  };

  const handleCreateDraft = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      // Validar campos requeridos
      if (!formData.title.trim() || !formData.description.trim() || formData.price <= 0) {
        setError('Por favor completa todos los campos correctamente');
        return;
      }

      const createdDraft = await courseService.createDraftCourse(formData);
      if (createdDraft) {
        setSuccess('Borrador del curso creado exitosamente!');
        console.log('Borrador creado:', createdDraft);
        setTimeout(() => {
          router.push(`/teacher/courses/edit/${createdDraft.id}`);
        }, 2000);
      } else {
        setError('Error al crear el borrador del curso');
      }
    } catch (error) {
      console.error('Error creating draft course:', error);
      setError('Error al crear el borrador del curso');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'maestro') {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar currentPage="teacher" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            Solo los maestros pueden crear cursos.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar currentPage="teacher" />
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/teacher/courses')}
          >
            Volver
          </Button>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Crear Nuevo Curso
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

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
            Crear Borrador del Curso
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Primero crea un borrador con la información básica del curso. Después podrás agregar secciones y videos.
          </Alert>

          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              fullWidth
              label="Título del Curso"
              value={formData.title}
              onChange={handleInputChange('title')}
              required
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Descripción"
              value={formData.description}
              onChange={handleInputChange('description')}
              required
            />
            
            <TextField
              fullWidth
              type="number"
              label="Precio ($)"
              value={formData.price}
              onChange={handleInputChange('price')}
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => router.push('/teacher/courses')}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
              onClick={handleCreateDraft}
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Borrador'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

