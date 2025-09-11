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
  CircularProgress,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  AccessTime,
  Person,
  School,
} from '@mui/icons-material';
import { Navbar } from '../components/Navigation/Navbar';
import { stripeService, Purchase } from '../services/stripeService';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function MyPurchasesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPurchases();
    }
  }, [isAuthenticated]);

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await stripeService.getPurchases();
      setPurchases(response.purchases);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError('Error al cargar tus compras');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">
            Necesitas iniciar sesión para ver tus compras
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Mis Compras
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aquí puedes ver todos los cursos que has comprado
          </Typography>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : purchases.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No tienes compras aún
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Explora nuestros cursos y comienza tu aprendizaje
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/courses')}
              sx={{ mt: 2 }}
            >
              Ver Cursos Disponibles
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {purchases.map((purchase) => (
              <Grid item xs={12} md={6} lg={4} key={purchase.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={purchase.course.thumbnail || '/placeholder-course.jpg'}
                    alt={purchase.course.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flex: 1 }}>
                        {purchase.course.title}
                      </Typography>
                      <Chip
                        label={getStatusText(purchase.status)}
                        color={getStatusColor(purchase.status) as any}
                        size="small"
                        icon={purchase.status === 'completed' ? <CheckCircle /> : undefined}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {purchase.course.description}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {purchase.course.instructorName}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Comprado el {formatDate(purchase.purchaseDate)}
                      </Typography>
                    </Box>

                    <Typography variant="h6" color="primary" fontWeight="bold">
                      ${purchase.price.toFixed(2)} USD
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handleCourseClick(purchase.courseId)}
                      disabled={purchase.status !== 'completed'}
                      fullWidth
                      sx={{ 
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      {purchase.status === 'completed' ? 'Continuar Curso' : 'Pago Pendiente'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Resumen de compras */}
        {purchases.length > 0 && (
          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Resumen de Compras
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">
                Total de cursos comprados: <strong>{purchases.length}</strong>
              </Typography>
              <Typography variant="h6" color="primary">
                Total gastado: <strong>${purchases.reduce((sum, p) => sum + p.price, 0).toFixed(2)} USD</strong>
              </Typography>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
