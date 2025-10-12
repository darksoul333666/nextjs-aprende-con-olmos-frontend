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
import { useCart } from '../../contexts/CartContext';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { clearCart } = useCart();
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
      
      
      // Primero intentar procesar la sesión (para compras individuales)
      try {
        const processResponse = await stripeService.processSession(sessionId);
        
        // Verificar si la respuesta tiene la estructura esperada
        if (processResponse && (processResponse.success || (processResponse as any).purchase)) {
          const purchase = processResponse.data?.purchase || (processResponse as any).purchase;
          const session = processResponse.data?.session || (processResponse as any).session;
          
          const purchaseData = {
            success: true,
            course: purchase?.course || purchase,
            price: purchase?.price || 0,
            session: session,
            message: 'Compra procesada exitosamente'
          };
          await handlePurchaseSuccess(purchaseData);
          return;
        }
      } catch (processError) {
      }
      
      // Intentar procesar como sesión de carrito
      try {
        const cartProcessResponse = await stripeService.processCartSession(sessionId);
        
        // Verificar si la respuesta tiene la estructura esperada
        if (cartProcessResponse && (cartProcessResponse.success || (cartProcessResponse as any).cartPurchase)) {
          // Crear objeto de compra con la información del carrito
          const cartPurchase = cartProcessResponse.data?.cartPurchase || (cartProcessResponse as any).cartPurchase;
          const sessionData = (cartProcessResponse.data as any)?.session || (cartProcessResponse as any).session;
          
          const purchaseData = {
            success: true,
            cartPurchase: cartPurchase,
            session: sessionData,
            totalAmount: cartPurchase?.totalAmount || 0,
            itemCount: cartPurchase?.itemCount || 0,
            message: 'Compra de carrito procesada exitosamente'
          };
          await handlePurchaseSuccess(purchaseData);
          return;
        }
      } catch (cartError) {
      }
      
      // Si ambos métodos fallan, verificar directamente el estado de la sesión
      try {
        const sessionStatus = await stripeService.getSessionStatus(sessionId);
        
        if (sessionStatus && sessionStatus.status === 'paid') {
          // Crear un objeto de compra básico para mostrar éxito
          const purchaseData = {
            success: true,
            sessionId: sessionId,
            message: 'Pago verificado exitosamente'
          };
          await handlePurchaseSuccess(purchaseData);
        } else {
          setError('El pago no se completó correctamente');
        }
      } catch (statusError) {
        setError('No se pudo verificar el estado del pago');
      }
      
    } catch (err) {
      setError('Error al verificar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueCourse = () => {
    // Para compras individuales
    if (purchase?.course?.id) {
      router.push(`/course/${purchase.course.id}`);
    }
    // Para compras del carrito o cuando no hay curso específico
    else {
      router.push('/my-purchases');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleViewPurchases = () => {
    router.push('/my-purchases');
  };

  const handlePurchaseSuccess = async (purchaseData: any) => {
    setPurchase(purchaseData);
    setIsLoading(false);
    
    // Limpiar el carrito después de una compra exitosa
    try {
      await clearCart();
    } catch (error) {
      // No mostrar error al usuario, solo log
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
                  {purchase.course?.title || (purchase.itemCount > 1 ? `${purchase.itemCount} Cursos Comprados` : 'Curso Comprado')}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" paragraph>
                  {purchase.course?.description || purchase.message || 'Tu compra se ha procesado correctamente'}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    ${purchase.price ? purchase.price.toFixed(2) : 
                      (purchase.totalAmount ? (purchase.totalAmount / 100).toFixed(2) : 
                      (purchase.session?.amountTotal ? (purchase.session.amountTotal / 100).toFixed(2) : '0.00'))} USD
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {purchase.itemCount > 1 ? `${purchase.itemCount} items` : 'Compra realizada exitosamente'}
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
                    {purchase.course?.title ? 'Continuar Curso' : 'Ver Mis Compras'}
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
