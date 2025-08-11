'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Avatar,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save,
  Edit,
  Delete,
  Add,
  School,
  Work,
  Email,
  WhatsApp,
  Instagram,
  Facebook,
  ArrowBack,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService, Teacher, UpdateTeacherRequest } from '../../services/teacherService';
import { Navbar } from '../../components/Navigation/Navbar';

export default function EditTeacherPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [newExpertise, setNewExpertise] = useState('');
  const [newEducation, setNewEducation] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'expertise' | 'education' | 'achievement'>('expertise');

  const [formData, setFormData] = useState<UpdateTeacherRequest>({
    name: '',
    title: '',
    bio: '',
    expertise: [],
    experience: '',
    education: [],
    contact: {
      whatsapp: '',
      email: '',
      instagram: '',
      facebook: '',
    },
    achievements: [],
  });

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setIsLoading(true);
        // Obtener perfil del maestro (solo maestros)
        const teacherData = await teacherService.getTeacherProfile();
        console.log(teacherData);
        setTeacher(teacherData);
        setFormData({
          name: teacherData.name,
          title: teacherData.title,
          bio: teacherData.bio,
          expertise: teacherData.expertise,
          experience: teacherData.experience,
          education: teacherData.education,
          contact: teacherData.contact,
          achievements: teacherData.achievements,
        });
      } catch (error) {
        console.error('Error fetching teacher data:', error);
        setError('No se pudo cargar la información del maestro');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleContactChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact!,
        [field]: e.target.value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const updatedTeacher = await teacherService.updateTeacher(formData);
      setTeacher(updatedTeacher);
      setEditMode(false);
      setSuccess('Información actualizada correctamente');
    } catch (error) {
      setError('Error al actualizar la información');
      console.error('Error updating teacher:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!newExpertise && !newEducation && !newAchievement) return;

    setFormData(prev => {
      const updated = { ...prev };
      
      switch (dialogType) {
        case 'expertise':
          if (newExpertise.trim()) {
            updated.expertise = [...(updated.expertise || []), newExpertise.trim()];
          }
          break;
        case 'education':
          if (newEducation.trim()) {
            updated.education = [...(updated.education || []), newEducation.trim()];
          }
          break;
        case 'achievement':
          if (newAchievement.trim()) {
            updated.achievements = [...(updated.achievements || []), newAchievement.trim()];
          }
          break;
      }
      
      return updated;
    });

    setNewExpertise('');
    setNewEducation('');
    setNewAchievement('');
    setShowAddDialog(false);
  };

  const handleRemoveItem = (type: 'expertise' | 'education' | 'achievement', index: number) => {
    setFormData(prev => {
      const updated = { ...prev };
      
      switch (type) {
        case 'expertise':
          updated.expertise = updated.expertise?.filter((_, i) => i !== index);
          break;
        case 'education':
          updated.education = updated.education?.filter((_, i) => i !== index);
          break;
        case 'achievement':
          updated.achievements = updated.achievements?.filter((_, i) => i !== index);
          break;
      }
      
      return updated;
    });
  };

  const openAddDialog = (type: 'expertise' | 'education' | 'achievement') => {
    setDialogType(type);
    setShowAddDialog(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!teacher) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar currentPage="teacher" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h5" color="text.secondary">
              No se pudo cargar la información del maestro.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
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
            Editar Perfil del Maestro
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

        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
          {/* Información Básica */}
          <Box flex={2}>
            <Paper sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                  Información Básica
                </Typography>
                <Button
                  variant={editMode ? 'outlined' : 'contained'}
                  startIcon={editMode ? <Save /> : <Edit />}
                  onClick={editMode ? handleSave : () => setEditMode(true)}
                  disabled={isSaving}
                >
                  {isSaving ? <CircularProgress size={20} /> : (editMode ? 'Guardar' : 'Editar')}
                </Button>
              </Box>

              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={3} flexWrap="wrap">
                <Box flex={1} minWidth={300}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    disabled={!editMode}
                  />
                </Box>
                <Box flex={1} minWidth={300}>
                  <TextField
                    fullWidth
                    label="Título Profesional"
                    value={formData.title}
                    onChange={handleInputChange('title')}
                    disabled={!editMode}
                  />
                </Box>
                <Box flex={1} minWidth="100%">
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Biografía"
                    value={formData.bio}
                    onChange={handleInputChange('bio')}
                    disabled={!editMode}
                  />
                </Box>
                <Box flex={1} minWidth="100%">
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Experiencia Profesional"
                    value={formData.experience}
                    onChange={handleInputChange('experience')}
                    disabled={!editMode}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Información de Contacto */}
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
                Información de Contacto
              </Typography>

              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={3} flexWrap="wrap">
                <Box flex={1} minWidth={300}>
                  <TextField
                    fullWidth
                    label="WhatsApp"
                    value={formData.contact?.whatsapp || ''}
                    onChange={handleContactChange('whatsapp')}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <WhatsApp sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
                <Box flex={1} minWidth={300}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.contact?.email || ''}
                    onChange={handleContactChange('email')}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
                <Box flex={1} minWidth={300}>
                  <TextField
                    fullWidth
                    label="Instagram"
                    value={formData.contact?.instagram || ''}
                    onChange={handleContactChange('instagram')}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Instagram sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
                <Box flex={1} minWidth={300}>
                  <TextField
                    fullWidth
                    label="Facebook"
                    value={formData.contact?.facebook || ''}
                    onChange={handleContactChange('facebook')}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Facebook sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Columna Derecha */}
          <Box flex={1}>
            {/* Áreas de Experticia */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    Áreas de Experticia
                  </Typography>
                  {editMode && (
                    <IconButton size="small" onClick={() => openAddDialog('expertise')}>
                      <Add />
                    </IconButton>
                  )}
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {formData.expertise?.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      color="primary"
                      variant="outlined"
                      onDelete={editMode ? () => handleRemoveItem('expertise', index) : undefined}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Educación */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    Educación
                  </Typography>
                  {editMode && (
                    <IconButton size="small" onClick={() => openAddDialog('education')}>
                      <Add />
                    </IconButton>
                  )}
                </Box>
                <List dense>
                  {formData.education?.map((degree, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText primary={degree} />
                      {editMode && (
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemoveItem('education', index)}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Logros */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    Logros y Reconocimientos
                  </Typography>
                  {editMode && (
                    <IconButton size="small" onClick={() => openAddDialog('achievement')}>
                      <Add />
                    </IconButton>
                  )}
                </Box>
                <List dense>
                  {formData.achievements?.map((achievement, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText primary={achievement} />
                      {editMode && (
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemoveItem('achievement', index)}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>

      {/* Dialog para agregar elementos */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Agregar {dialogType === 'expertise' ? 'Área de Experticia' : dialogType === 'education' ? 'Educación' : 'Logro'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={dialogType === 'expertise' ? 'Área de Experticia' : dialogType === 'education' ? 'Educación' : 'Logro'}
            value={dialogType === 'expertise' ? newExpertise : dialogType === 'education' ? newEducation : newAchievement}
            onChange={(e) => {
              if (dialogType === 'expertise') setNewExpertise(e.target.value);
              else if (dialogType === 'education') setNewEducation(e.target.value);
              else setNewAchievement(e.target.value);
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddItem} variant="contained">Agregar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
