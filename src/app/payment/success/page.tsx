'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  PlayArrow,
  Home,
  ShoppingCart,
} from '@mui/icons-material';
import { Navbar } from '../../components/Navigation/Navbar';
import { stripeService } from '../../services/stripeService';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id');
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
      verifyPayment(sessionIdParam);
    } else {
      setError('No se encontró el ID de sesión');
      setIsLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await stripeService.getSessionStatus(sessionId);
      
      if (response.session && response.session.status === 'complete') {
        setPurchase(response.purchase);
      } else {
        setError('El pago no se completó correctamente');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError('Error al verificar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueCourse = () => {
    if (purchase?.course?.id) {
      router.push(`/course/${purchase.course.id}`);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleViewPurchases = () => {
    router.push('/my-purchases');
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

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {isLoading ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={8}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" color="text.secondary">
              Verificando tu pago...
            </Typography>
          </Box>
        ) : error ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={handleGoHome}
              startIcon={<Home />}
            >
              Ir al Inicio
            </Button>
          </Card>
        ) : purchase ? (
          <Box>
            {/* Mensaje de éxito */}
            <Paper sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CheckCircle sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                ¡Pago Exitoso!
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Tu compra se ha procesado correctamente
              </Typography>
              <Chip
                label="Completado"
                color="success"
                icon={<CheckCircle />}
                sx={{ fontWeight: 600 }}
              />
            </Paper>

            {/* Información del curso comprado */}
            <Card sx={{ mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                  {purchase.course?.title || 'Curso Comprado'}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" paragraph>
                  {purchase.course?.description || 'Descripción del curso'}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    ${purchase.session?.amountTotal ? (purchase.session.amountTotal / 100).toFixed(2) : '0.00'} USD
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID de Sesión: {sessionId}
                  </Typography>
                </Box>

                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={handleContinueCourse}
                    size="large"
                    sx={{ 
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    Continuar Curso
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ShoppingCart />}
                    onClick={handleViewPurchases}
                    size="large"
                  >
                    Ver Mis Compras
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                ¿Qué sigue ahora?
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Acceso inmediato:</strong> Ya puedes acceder al curso desde "Mis Compras" o haciendo clic en "Continuar Curso"
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Progreso guardado:</strong> Tu progreso se guardará automáticamente mientras estudias
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Soporte incluido:</strong> Tienes acceso al soporte del maestro durante todo el curso
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>Certificado:</strong> Al completar el curso recibirás tu certificado de finalización
                </Typography>
              </Box>
            </Paper>
          </Box>
        ) : (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              No se pudo verificar la información del pago
            </Alert>
            <Button
              variant="contained"
              onClick={handleGoHome}
              startIcon={<Home />}
            >
              Ir al Inicio
            </Button>
          </Card>
        )}
      </Container>
    </Box>
  );
}
