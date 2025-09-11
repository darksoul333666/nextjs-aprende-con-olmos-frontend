'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Divider,
} from '@mui/material';
import {
  CreditCard,
  Lock,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { stripeService, StripeConfig } from '../../services/stripeService';

interface StripePaymentProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  courseThumbnail: string;
  coursePrice: number;
  onSuccess?: () => void;
}

export const StripePayment: React.FC<StripePaymentProps> = ({
  open,
  onClose,
  courseId,
  courseTitle,
  courseDescription,
  courseThumbnail,
  coursePrice,
  onSuccess,
}) => {
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cargar configuración de Stripe al abrir el modal
  useEffect(() => {
    if (open) {
      loadStripeConfig();
    }
  }, [open]);

  const loadStripeConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const config = await stripeService.getConfig();
      setStripeConfig(config);
    } catch (err) {
      console.error('Error loading Stripe config:', err);
      setError('Error al cargar la configuración de pagos');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Crear sesión de checkout
      const session = await stripeService.createCheckoutSession(courseId);
      
      // Cargar Stripe
      const stripe = await loadStripe(stripeConfig!.publishableKey);
      
      if (!stripe) {
        throw new Error('Error al cargar Stripe');
      }

      // Redirigir a Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <CreditCard color="primary" />
          <Typography variant="h6" component="div">
            Completar Compra
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando configuración de pagos...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            {/* Información del curso */}
            <Card sx={{ mb: 3, boxShadow: 1 }}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" gap={2}>
                  <CardMedia
                    component="img"
                    sx={{ width: 80, height: 60, borderRadius: 1 }}
                    image={courseThumbnail || '/placeholder-course.jpg'}
                    alt={courseTitle}
                  />
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      {courseTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {courseDescription}
                    </Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      ${coursePrice.toFixed(2)} USD
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Información de seguridad */}
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Lock color="success" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                Pago seguro procesado por Stripe
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Resumen de pago */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Resumen de la compra:
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {courseTitle}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${coursePrice.toFixed(2)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  Impuestos
                </Typography>
                <Typography variant="body2">
                  $0.00
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6" fontWeight="bold">
                  Total
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  ${coursePrice.toFixed(2)} USD
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={isProcessing}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handlePayment}
          disabled={isLoading || isProcessing || !stripeConfig}
          variant="contained"
          startIcon={isProcessing ? <CircularProgress size={16} /> : <CreditCard />}
          sx={{ 
            minWidth: 140,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          {isProcessing ? 'Procesando...' : 'Pagar con Stripe'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
