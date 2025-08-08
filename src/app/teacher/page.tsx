'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Avatar,
  Paper,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  School,
  Work,
  Email,
  WhatsApp,
  Instagram,
  Facebook,
  Star,
  EmojiEvents,
  Psychology,
  Computer,
  Book,
  Group,
  Edit,
} from '@mui/icons-material';
import { Navbar } from '../components/Navigation/Navbar';
import { teacherService, Teacher, TeacherStats } from '../services/teacherService';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function TeacherPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setIsLoading(true);
        // Obtener información del maestro (público)
        const teacherData = await teacherService.getTeacher();
        // Obtener estadísticas del maestro (solo maestros)
        const statsData = await teacherService.getTeacherStats(teacherData.id);
        
        setTeacher(teacherData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  const handleContact = (type: string) => {
    if (!teacher) return;

    switch (type) {
      case 'whatsapp':
        window.open(`https://wa.me/${teacher.contact.whatsapp.replace(/\s/g, '')}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:${teacher.contact.email}`, '_blank');
        break;
      case 'instagram':
        window.open(`https://instagram.com/${teacher.contact.instagram.replace('@', '')}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://facebook.com/${teacher.contact.facebook.replace(/\s/g, '')}`, '_blank');
        break;
    }
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
        {/* Header del Maestro */}
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <Avatar
            src={teacher.photo}
            sx={{
              width: 150,
              height: 150,
              mx: 'auto',
              mb: 3,
              border: 4,
              borderColor: 'primary.main',
            }}
          >
            {teacher.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            {teacher.name}
          </Typography>
          
          <Typography variant="h5" color="primary" gutterBottom>
            {teacher.title}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
            {teacher.bio}
          </Typography>

          {/* Botones de Contacto */}
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<WhatsApp />}
              onClick={() => handleContact('whatsapp')}
              sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
            >
              WhatsApp
            </Button>
            <Button
              variant="contained"
              startIcon={<Email />}
              onClick={() => handleContact('email')}
            >
              Email
            </Button>
            <Button
              variant="outlined"
              startIcon={<Instagram />}
              onClick={() => handleContact('instagram')}
              sx={{ borderColor: '#E4405F', color: '#E4405F', '&:hover': { borderColor: '#C13584' } }}
            >
              Instagram
            </Button>
            <Button
              variant="outlined"
              startIcon={<Facebook />}
              onClick={() => handleContact('facebook')}
              sx={{ borderColor: '#1877F2', color: '#1877F2', '&:hover': { borderColor: '#166FE5' } }}
            >
              Facebook
            </Button>
            {user?.role === 'maestro' && (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => router.push('/teacher/edit')}
                sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
              >
                Editar Perfil
              </Button>
            )}
          </Box>
        </Paper>

        <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={4}>
          {/* Columna Izquierda */}
          <Box flex={2}>
            {/* Experiencia */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Work color="primary" />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Experiencia Profesional
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  {teacher.experience}
                </Typography>
              </CardContent>
            </Card>

            {/* Áreas de Experticia */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Psychology color="primary" />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Áreas de Experticia
                  </Typography>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {teacher.expertise.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      color="primary"
                      variant="outlined"
                      icon={<School />}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Logros y Reconocimientos */}
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <EmojiEvents color="primary" />
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Logros y Reconocimientos
                  </Typography>
                </Box>
                <List>
                  {teacher.achievements.map((achievement, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Star color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={achievement} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Columna Derecha */}
          <Box flex={1}>
            {/* Información de Contacto */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                  Información de Contacto
                </Typography>
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <WhatsApp color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="WhatsApp"
                      secondary={teacher.contact.whatsapp}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Email color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email"
                      secondary={teacher.contact.email}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Instagram sx={{ color: '#E4405F' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Instagram"
                      secondary={teacher.contact.instagram}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Facebook sx={{ color: '#1877F2' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Facebook"
                      secondary={teacher.contact.facebook}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Educación */}
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <School color="primary" />
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    Educación
                  </Typography>
                </Box>
                <List>
                  {teacher.education.map((degree, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Book color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={degree} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Sección de Estadísticas */}
        {stats && (
          <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Impacto en la Educación
            </Typography>
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} sx={{ mt: 3 }}>
              <Box flex={1} display="flex" flexDirection="column" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, mb: 2 }}>
                  <Group sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {stats.totalStudents.toLocaleString()}+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Estudiantes Atendidos
                </Typography>
              </Box>
              <Box flex={1} display="flex" flexDirection="column" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', width: 80, height: 80, mb: 2 }}>
                  <Computer sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {stats.totalCourses}+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Cursos Creados
                </Typography>
              </Box>
              <Box flex={1} display="flex" flexDirection="column" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', width: 80, height: 80, mb: 2 }}>
                  <EmojiEvents sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {stats.averageRating.toFixed(1)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Calificación Promedio
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
