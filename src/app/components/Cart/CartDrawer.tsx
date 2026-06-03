"use client";

import React from "react";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Divider,
  CardMedia,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import {
  Close,
  Delete,
  ShoppingCart,
  School,
  ArrowForward,
} from "@mui/icons-material";
import { useCart } from "../../contexts/CartContext";
import { useRouter } from "next/navigation";
import { stripeService } from "../../services/stripeService";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose }) => {
  const { cart, isLoading, removeFromCart, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleRemoveItem = async (courseId: string) => {
    try {
      await removeFromCart(courseId);
    } catch {}
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch {}
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    try {
      setIsProcessing(true);
      const checkoutSession = await stripeService.createCartCheckoutSession();

      // Redirigir a Stripe Checkout
      window.location.href = checkoutSession.url;
    } catch {
      setIsProcessing(false);
    }
  };

  const handleViewCart = () => {
    onClose();
    router.push("/cart");
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 400 },
          maxWidth: "100vw",
        },
      }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6" component="h2">
              Carrito de Compras
            </Typography>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : !cart || cart.items.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <ShoppingCart
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Tu carrito está vacío
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega algunos cursos para comenzar
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {cart.items.map((item, index) => (
                <React.Fragment key={item.courseId._id}>
                  <ListItem sx={{ px: 2, py: 1.5 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        mr: 2,
                        borderRadius: 1,
                        overflow: "hidden",
                      }}
                    >
                      {item.courseId.thumbnail ? (
                        <CardMedia
                          component="img"
                          image={item.courseId.thumbnail}
                          alt={item.courseId.title}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            background:
                              "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                          }}
                        >
                          <School sx={{ fontSize: 24 }} />
                        </Box>
                      )}
                    </Box>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" noWrap>
                          {item.courseId.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          ${item.price.toFixed(2)} USD
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveItem(item.courseId._id)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < cart.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Box sx={{ mb: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="h6">
                  Total ({cart.itemCount}{" "}
                  {cart.itemCount === 1 ? "curso" : "cursos"})
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  ${cart.totalAmount.toFixed(2)} USD
                </Typography>
              </Box>
            </Box>

            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                onClick={handleClearCart}
                disabled={isProcessing}
                sx={{ flex: 1 }}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                onClick={handleCheckout}
                disabled={isProcessing}
                endIcon={
                  isProcessing ? (
                    <CircularProgress size={16} />
                  ) : (
                    <ArrowForward />
                  )
                }
                sx={{ flex: 2 }}
              >
                {isProcessing ? "Procesando..." : "Proceder al Pago"}
              </Button>
            </Box>

            <Button
              variant="text"
              onClick={handleViewCart}
              fullWidth
              sx={{ mt: 1 }}
            >
              Ver Carrito Completo
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};
