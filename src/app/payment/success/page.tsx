"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
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
} from "@mui/material";
import {
  CheckCircle,
  PlayArrow,
  Home,
  ShoppingCart,
} from "@mui/icons-material";
import { Navbar } from "../../components/Navigation/Navbar";
import { stripeService, StripeData } from "../../services/stripeService";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

interface PaymentCourse {
  id?: string;
  _id?: string;
  title?: string;
  description?: string;
}

interface PaymentSession {
  amountTotal?: number;
}

interface PaymentSummary {
  success: boolean;
  course?: PaymentCourse;
  price?: number;
  session?: PaymentSession;
  cartPurchase?: StripeData;
  totalAmount?: number;
  itemCount?: number;
  message?: string;
  sessionId?: string;
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

const getCourse = (purchase: unknown): PaymentCourse | undefined => {
  const purchaseRecord = asRecord(purchase);
  const courseRecord = asRecord(purchaseRecord?.course) || purchaseRecord;

  if (!courseRecord) {
    return undefined;
  }

  return {
    id: asString(courseRecord.id),
    _id: asString(courseRecord._id),
    title: asString(courseRecord.title),
    description: asString(courseRecord.description),
  };
};

const getSession = (session: unknown): PaymentSession | undefined => {
  const sessionRecord = asRecord(session);

  if (!sessionRecord) {
    return undefined;
  }

  return {
    amountTotal:
      asNumber(sessionRecord.amountTotal) || asNumber(sessionRecord.amount_total),
  };
};

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PaymentSummary | null>(null);

  const handlePurchaseSuccess = useCallback(
    async (purchaseData: PaymentSummary) => {
      setPurchase(purchaseData);
      setIsLoading(false);

      // Limpiar el carrito después de una compra exitosa
      try {
        await clearCart();
      } catch {
        // No mostrar error al usuario, solo log
      }
    },
    [clearCart],
  );

  const verifyPayment = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero intentar procesar la sesión (para compras individuales)
      try {
        const processResponse = await stripeService.processSession(sessionId);

        // Verificar si la respuesta tiene la estructura esperada
        if (
          processResponse &&
          (processResponse.success || processResponse.purchase)
        ) {
          const purchase =
            processResponse.data?.purchase || processResponse.purchase;
          const session = processResponse.data?.session || processResponse.session;
          const purchaseRecord = asRecord(purchase);

          const purchaseData = {
            success: true,
            course: getCourse(purchase),
            price: asNumber(purchaseRecord?.price) || 0,
            session: getSession(session),
            message: "Compra procesada exitosamente",
          };
          await handlePurchaseSuccess(purchaseData);
          return;
        }
      } catch {}

      // Intentar procesar como sesión de carrito
      try {
        const cartProcessResponse =
          await stripeService.processCartSession(sessionId);

        // Verificar si la respuesta tiene la estructura esperada
        if (
          cartProcessResponse &&
          (cartProcessResponse.success ||
            cartProcessResponse.cartPurchase)
        ) {
          // Crear objeto de compra con la información del carrito
          const cartPurchase =
            cartProcessResponse.data?.cartPurchase ||
            cartProcessResponse.cartPurchase;
          const sessionData =
            cartProcessResponse.data?.session || cartProcessResponse.session;
          const cartPurchaseRecord = asRecord(cartPurchase);

          const purchaseData = {
            success: true,
            cartPurchase: cartPurchase,
            session: getSession(sessionData),
            totalAmount: asNumber(cartPurchaseRecord?.totalAmount) || 0,
            itemCount: asNumber(cartPurchaseRecord?.itemCount) || 0,
            message: "Compra de carrito procesada exitosamente",
          };
          await handlePurchaseSuccess(purchaseData);
          return;
        }
      } catch {}

      // Si ambos métodos fallan, verificar directamente el estado de la sesión
      try {
        const sessionStatus = await stripeService.getSessionStatus(sessionId);

        if (sessionStatus && sessionStatus.status === "paid") {
          // Crear un objeto de compra básico para mostrar éxito
          const purchaseData = {
            success: true,
            sessionId: sessionId,
            message: "Pago verificado exitosamente",
          };
          await handlePurchaseSuccess(purchaseData);
        } else {
          setError("El pago no se completó correctamente");
        }
      } catch {
        setError("No se pudo verificar el estado del pago");
      }
    } catch {
      setError("Error al verificar el pago");
    } finally {
      setIsLoading(false);
    }
  }, [handlePurchaseSuccess]);

  useEffect(() => {
    const sessionIdParam = searchParams.get("session_id");
    if (sessionIdParam) {
      verifyPayment(sessionIdParam);
    } else {
      setError("No se encontró el ID de sesión");
      setIsLoading(false);
    }
  }, [searchParams, verifyPayment]);

  const handleContinueCourse = () => {
    // Para compras individuales
    const courseId = purchase?.course?.id || purchase?.course?._id;
    if (courseId) {
      router.push(`/course/${courseId}`);
    }
    // Para compras del carrito o cuando no hay curso específico
    else {
      router.push("/my-purchases");
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleViewPurchases = () => {
    router.push("/my-purchases");
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
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
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
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
          <Card sx={{ p: 4, textAlign: "center" }}>
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
            <Paper
              sx={{
                p: 4,
                mb: 4,
                textAlign: "center",
                bgcolor: "success.light",
                color: "success.contrastText",
              }}
            >
              <CheckCircle sx={{ fontSize: 80, mb: 2 }} />
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ fontWeight: 700 }}
              >
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
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  {purchase.course?.title ||
                    ((purchase.itemCount || 0) > 1
                      ? `${purchase.itemCount} Cursos Comprados`
                      : "Curso Comprado")}
                </Typography>

                <Typography variant="body1" color="text.secondary" paragraph>
                  {purchase.course?.description ||
                    purchase.message ||
                    "Tu compra se ha procesado correctamente"}
                </Typography>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    $
                    {purchase.price
                      ? purchase.price.toFixed(2)
                      : purchase.totalAmount
                        ? (purchase.totalAmount / 100).toFixed(2)
                        : purchase.session?.amountTotal
                          ? (purchase.session.amountTotal / 100).toFixed(2)
                          : "0.00"}{" "}
                    USD
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(purchase.itemCount || 0) > 1
                      ? `${purchase.itemCount} items`
                      : "Compra realizada exitosamente"}
                  </Typography>
                </Box>

                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={handleContinueCourse}
                    size="large"
                    sx={{
                      bgcolor: "primary.main",
                      "&:hover": { bgcolor: "primary.dark" },
                    }}
                  >
                    {purchase.course?.title
                      ? "Continuar Curso"
                      : "Ver Mis Compras"}
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
            <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                ¿Qué sigue ahora?
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Acceso inmediato:</strong> Ya puedes acceder al curso
                  desde &quot;Mis Compras&quot; o haciendo clic en
                  &quot;Continuar Curso&quot;
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Progreso guardado:</strong> Tu progreso se guardará
                  automáticamente mientras estudias
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  <strong>Soporte incluido:</strong> Tienes acceso al soporte
                  del maestro durante todo el curso
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>Certificado:</strong> Al completar el curso recibirás
                  tu certificado de finalización
                </Typography>
              </Box>
            </Paper>
          </Box>
        ) : (
          <Card sx={{ p: 4, textAlign: "center" }}>
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

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            backgroundColor: "#f8f9fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={60} />
        </Box>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
