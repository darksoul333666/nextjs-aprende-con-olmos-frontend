"use client";

import React from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Paper,
} from "@mui/material";
import { Cancel, Home, ShoppingCart, ArrowBack } from "@mui/icons-material";
import { Navbar } from "../../components/Navigation/Navbar";
import { useRouter } from "next/navigation";

export default function PaymentCancelPage() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const handleViewCourses = () => {
    router.push("/courses");
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Cancel sx={{ fontSize: 80, color: "warning.main", mb: 3 }} />

          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Pago Cancelado
          </Typography>

          <Typography variant="h6" color="text.secondary" paragraph>
            Tu pago ha sido cancelado. No se ha realizado ningún cargo.
          </Typography>

          <Alert severity="info" sx={{ mb: 4, textAlign: "left" }}>
            <Typography variant="body2">
              <strong>¿Por qué se canceló?</strong>
              <br />
              • Cambiaste de opinión durante el proceso de pago
              <br />
              • Hubo un problema técnico temporal
              <br />• Decidiste usar un método de pago diferente
            </Typography>
          </Alert>

          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={handleViewCourses}
              size="large"
              sx={{
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              Ver Cursos
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              size="large"
            >
              Intentar de Nuevo
            </Button>
            <Button
              variant="text"
              startIcon={<Home />}
              onClick={handleGoHome}
              size="large"
            >
              Ir al Inicio
            </Button>
          </Box>
        </Card>

        {/* Información adicional */}
        <Paper sx={{ p: 3, mt: 4, bgcolor: "background.paper" }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            ¿Necesitas ayuda?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Si tienes problemas con el pago o necesitas asistencia, no dudes en
            contactarnos:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" paragraph>
              <strong>Email:</strong> daniel@aprendiendoconolmos.com
            </Typography>
            <Typography component="li" variant="body2" paragraph>
              <strong>WhatsApp:</strong> +1234567890
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Horario de atención:</strong> Lunes a Viernes, 9:00 AM -
              6:00 PM
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
