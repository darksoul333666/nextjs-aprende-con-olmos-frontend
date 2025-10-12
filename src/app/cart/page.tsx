'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Delete,
  School,
  ArrowForward,
  ShoppingCart,
  Home,
} from '@mui/icons-material';
import { Navbar } from '../components/Navigation/Navbar';
import { useCart } from '../contexts/CartContext';
import { stripeService } from '../services/stripeService';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, isLoading, removeFromCart, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveItem = async (courseId: string) => {
    try {
      setError(null);
      await removeFromCart(courseId);
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Error al remover el curso del carrito');
    }
  };

  const handleClearCart = async () => {
    try {
      setError(null);
      await clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Error al limpiar el carrito');
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    try {
      setIsProcessing(true);
      setError(null);
      const checkoutSession = await stripeService.createCartCheckoutSession();
      
      // Redirigir a Stripe Checkout
      window.location.href = checkoutSession.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError('Error al procesar el pago. Inténtalo de nuevo.');
      setIsProcessing(false);
    }
  };

  const handleContinueShopping = () => {
    router.push('/courses');
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Navbar currentPage="cart" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar currentPage="cart" />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              router.push('/');
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Home fontSize="small" />
            Inicio
          </Link>
          <Typography color="text.primary">Carrito de Compras</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Carrito de Compras
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Revisa tus cursos seleccionados y procede al pago
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!cart || cart.items.length === 0 ? (
          /* Empty Cart */
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Tu carrito está vacío
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Agrega algunos cursos para comenzar tu aprendizaje
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinueShopping}
              startIcon={<School />}
            >
              Explorar Cursos
            </Button>
          </Paper>
        ) : (
          /* Cart with Items */
          <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={4}>
            {/* Cart Items */}
            <Box flex={2}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Cursos Seleccionados ({cart.itemCount})
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                {cart.items.map((item) => (
                  <Card key={item.courseId._id} sx={{ display: 'flex', flexDirection: 'row' }}>
                    {/* Course Image */}
                    <Box sx={{ width: 200, height: 150, position: 'relative', overflow: 'hidden' }}>
                      {item.courseId.thumbnail ? (
                        <CardMedia
                          component="img"
                          image={item.courseId.thumbnail}
                          alt={item.courseId.title}
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
                          <School sx={{ fontSize: 60 }} />
                        </Box>
                      )}
                    </Box>

                    {/* Course Content */}
                    <Box flex={1} display="flex" flexDirection="column">
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {item.courseId.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {item.courseId.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Instructor: {item.courseId.instructorId.name}
                        </Typography>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          ${item.price.toFixed(2)} USD
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveItem(item.courseId._id)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </CardActions>
                    </Box>
                  </Card>
                ))}
              </Box>

              {/* Clear Cart Button */}
              <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClearCart}
                  disabled={isProcessing}
                >
                  Limpiar Carrito
                </Button>
              </Box>
            </Box>

            {/* Order Summary */}
            <Box flex={1}>
              <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Resumen del Pedido
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">
                    Subtotal ({cart.itemCount} {cart.itemCount === 1 ? 'curso' : 'cursos'})
                  </Typography>
                  <Typography variant="body1">
                    ${cart.totalAmount.toFixed(2)} USD
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Impuestos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Incluidos
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" mb={3}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                    ${cart.totalAmount.toFixed(2)} USD
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  endIcon={isProcessing ? <CircularProgress size={20} /> : <ArrowForward />}
                  sx={{ mb: 2 }}
                >
                  {isProcessing ? 'Procesando...' : 'Proceder al Pago'}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={handleContinueShopping}
                >
                  Continuar Comprando
                </Button>
              </Paper>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
