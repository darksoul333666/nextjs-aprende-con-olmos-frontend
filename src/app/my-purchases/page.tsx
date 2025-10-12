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
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  AccessTime,
  Person,
  School,
  ShoppingCart,
  Download,
} from '@mui/icons-material';
import { Navbar } from '../components/Navigation/Navbar';
import { stripeService, PurchaseGroup } from '../services/stripeService';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function MyPurchasesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadMessage, setDownloadMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPurchases();
    }
  }, [isAuthenticated]);

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const purchases = await stripeService.getPurchases();
      setPurchases(purchases);
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

  const handleDownloadReceipt = async (purchaseGroupId: string) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(purchaseGroupId));
      setDownloadMessage(null);
      
      await stripeService.downloadReceiptPDF(purchaseGroupId);
      
      setDownloadMessage({
        type: 'success',
        text: 'Comprobante descargado exitosamente'
      });
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setDownloadMessage(null), 3000);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      setDownloadMessage({
        type: 'error',
        text: 'Error al descargar el comprobante. Inténtalo de nuevo.'
      });
      
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setDownloadMessage(null), 5000);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(purchaseGroupId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="warning">
            Necesitas iniciar sesión para ver esta página
          </Alert>
        </Container>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={fetchPurchases}>
            Reintentar
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
          Mis Compras
        </Typography>

        {downloadMessage && (
          <Alert 
            severity={downloadMessage.type} 
            sx={{ mb: 3 }}
            onClose={() => setDownloadMessage(null)}
          >
            {downloadMessage.text}
          </Alert>
        )}

        {purchases.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No tienes compras aún
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Explora nuestros cursos y encuentra tu próximo aprendizaje
            </Typography>
            <Button variant="contained" size="large" onClick={() => router.push('/courses')}>
              Explorar Cursos
            </Button>
          </Paper>
        ) : (
          <Box>
            {purchases.map((purchaseGroup) => (
              <Box key={purchaseGroup.id} mb={4}>
                {/* Header del grupo de compra */}
                <Paper sx={{ p: 3, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {purchaseGroup.isGroupedPurchase ? 'Compra Múltiple' : 'Compra Individual'}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {formatDate(purchaseGroup.purchaseDate)} • {purchaseGroup.itemCount} curso{purchaseGroup.itemCount > 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box textAlign="right">
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          ${purchaseGroup.totalAmount.toFixed(2)}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleDownloadReceipt(purchaseGroup.id)}
                        disabled={downloadingIds.has(purchaseGroup.id)}
                        sx={{
                          borderColor: 'white',
                          color: 'white',
                          '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.8)',
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                          },
                          '&:disabled': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'rgba(255, 255, 255, 0.5)',
                          },
                        }}
                      >
                        {downloadingIds.has(purchaseGroup.id) ? 'Descargando...' : 'PDF'}
                      </Button>
                    </Box>
                  </Box>
                </Paper>

                {/* Lista de cursos en el grupo */}
                <Box display="flex" flexDirection="column" gap={2}>
                  {purchaseGroup.courses.map((courseItem) => (
                    <Card
                      key={courseItem.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      {/* Imagen del curso */}
                      <Box sx={{ width: 280, height: 200, position: 'relative', overflow: 'hidden' }}>
                        {courseItem.courseId.thumbnail ? (
                          <CardMedia
                            component="img"
                            image={courseItem.courseId.thumbnail}
                            alt={courseItem.courseId.title}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}
                          >
                            <School sx={{ fontSize: 80 }} />
                          </Box>
                        )}
                      </Box>

                      {/* Contenido del curso */}
                      <Box flex={1} display="flex" flexDirection="column">
                        <CardContent sx={{ flexGrow: 1, p: 2 }}>
                          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                            {courseItem.courseId.title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {courseItem.courseId.description}
                          </Typography>

                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Person fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {courseItem.courseId.instructorId.name}
                            </Typography>
                          </Box>

                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <AccessTime fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Comprado el {formatDate(courseItem.purchaseDate)}
                            </Typography>
                          </Box>

                          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                            ${courseItem.price.toFixed(2)}
                          </Typography>
                        </CardContent>

                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleCourseClick(courseItem.courseId._id)}
                            disabled={purchaseGroup.status !== 'completed'}
                            sx={{
                              '&:hover': {
                                transform: 'scale(1.02)',
                              },
                              transition: 'transform 0.2s',
                            }}
                          >
                            {purchaseGroup.status === 'completed' ? 'Continuar Curso' : 'Pago Pendiente'}
                          </Button>
                        </CardActions>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}