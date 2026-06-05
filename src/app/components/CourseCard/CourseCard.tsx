"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Typography,
  Box,
  Chip,
  Rating,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  ShoppingCart,
  PlayArrow,
  CheckCircle,
  School,
  AccessTime,
  People,
  AddShoppingCart,
  CreditCard,
  LocalOffer,
} from "@mui/icons-material";
import { Course } from "../../services/courseService";
import { useCart } from "../../contexts/CartContext";
import { useRouter } from "next/navigation";
import { StripePayment } from "../StripePayment/StripePayment";

interface CourseCardProps {
  course: Course;
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  variant = "default",
  showActions = true,
}) => {
  const router = useRouter();
  const { addToCart, isInCart, isLoading } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds || isNaN(seconds) || seconds <= 0) {
      return "0m";
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleCourseClick = () => {
    router.push(`/course/${course._id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir que se ejecute handleCourseClick

    if (course.isPurchased) {
      setSnackbarMessage("Ya tienes acceso a este curso");
      setSnackbarOpen(true);
      return;
    }

    try {
      setIsAddingToCart(true);
      await addToCart(course._id);
      setSnackbarMessage("Curso agregado al carrito");
      setSnackbarOpen(true);
    } catch {
      setSnackbarMessage("Error al agregar al carrito");
      setSnackbarOpen(true);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (course.isPurchased) {
      setSnackbarMessage("Ya tienes acceso a este curso");
      setSnackbarOpen(true);
      return;
    }

    // Abrir modal de pago
    setPaymentModalOpen(true);
  };

  const handlePaymentClose = () => {
    setPaymentModalOpen(false);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setSnackbarMessage("¡Compra realizada exitosamente!");
    setSnackbarOpen(true);
    // Opcional: refrescar la página o actualizar el estado
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  useEffect(() => {
    if (!course.activePromotion) {
      return;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, [course.activePromotion]);

  const getPromotionDate = (value?: string) => {
    if (!value) {
      return NaN;
    }

    return new Date(value).getTime();
  };

  const formatPromotionTimeLeft = (milliseconds: number) => {
    const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}d ${hours}h restantes`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    }

    return `${minutes}m restantes`;
  };

  const isCourseInCart = isInCart(course._id);
  const isCoursePurchased = course.isPurchased;
  const promotion = course.activePromotion;
  const promotionStartTime = getPromotionDate(
    promotion?.startsAt || promotion?.startDate,
  );
  const promotionEndTime = getPromotionDate(
    promotion?.endsAt || promotion?.endDate,
  );
  const hasActivePromotion = Boolean(
    promotion &&
      Number.isFinite(promotionEndTime) &&
      now < promotionEndTime &&
      (!Number.isFinite(promotionStartTime) || now >= promotionStartTime),
  );
  const promotionTimeLeft = hasActivePromotion
    ? formatPromotionTimeLeft(promotionEndTime - now)
    : "";
  const discountedPrice =
    hasActivePromotion && promotion
      ? promotion.discountedPrice ??
        Math.max(0, course.price * (1 - promotion.discountPercentage / 100))
      : course.price;

  if (variant === "compact") {
    return (
      <>
        <Card
          sx={{
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: 4,
            },
            ...(isCoursePurchased && {
              border: "2px solid",
              borderColor: "success.main",
              backgroundColor: "rgba(76, 175, 80, 0.05)",
            }),
          }}
        >
          <Box display="flex" flexDirection="row">
            {/* Image */}
            <Box
              sx={{
                width: 120,
                height: 90,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {course.thumbnail ? (
                <CardMedia
                  component="img"
                  image={course.thumbnail}
                  alt={course.title}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                  <School sx={{ fontSize: 40 }} />
                </Box>
              )}
            </Box>

            {/* Content */}
            <Box flex={1} display="flex" flexDirection="column">
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={1}
                >
                  <Typography
                    variant="subtitle1"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      flex: 1,
                      cursor: "pointer",
                      "&:hover": {
                        color: "primary.main",
                        textDecoration: "underline",
                      },
                    }}
                    onClick={handleCourseClick}
                  >
                    {course.title}
                  </Typography>
                  {isCoursePurchased && (
                    <Chip
                      label="Comprado"
                      color="success"
                      size="small"
                      icon={<CheckCircle />}
                    />
                  )}
                  {hasActivePromotion && !isCoursePurchased && promotion && (
                    <Chip
                      label={`${promotion.discountPercentage}% OFF`}
                      color="warning"
                      size="small"
                      icon={<LocalOffer />}
                    />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {course.description}
                </Typography>

                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <AccessTime fontSize="small" />
                    <Typography variant="caption">
                      {formatDuration(course.totalDuration)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <People fontSize="small" />
                    <Typography variant="caption">
                      {course.totalStudents || 0} estudiantes
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  {hasActivePromotion ? (
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textDecoration: "line-through" }}
                      >
                        ${course.price || 0} USD
                      </Typography>
                      <Typography variant="h6" color="error" fontWeight="bold">
                        ${discountedPrice.toFixed(2)} USD
                      </Typography>
                      <Chip
                        label={promotionTimeLeft}
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    </>
                  ) : (
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      ${course.price || 0} USD
                    </Typography>
                  )}
                </Box>
              </CardContent>

              {showActions && (
                <CardActions sx={{ p: 2, pt: 0 }}>
                  {isCoursePurchased ? (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<PlayArrow />}
                      onClick={handleCourseClick}
                      fullWidth
                    >
                      Continuar Curso
                    </Button>
                  ) : (
                    <Box display="flex" gap={1} width="100%">
                      <Button
                        variant="outlined"
                        startIcon={<AddShoppingCart />}
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || isLoading || isCourseInCart}
                        sx={{ flex: 1 }}
                      >
                        {isCourseInCart ? "En Carrito" : "Carrito"}
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CreditCard />}
                        onClick={handleBuyNow}
                        sx={{ flex: 1 }}
                      >
                        Comprar
                      </Button>
                    </Box>
                  )}
                </CardActions>
              )}
            </Box>
          </Box>
        </Card>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // Variant default/detailed
  return (
    <>
      <Card
        sx={{
          height: "100%",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 4,
          },
          ...(isCoursePurchased && {
            border: "2px solid",
            borderColor: "success.main",
            backgroundColor: "rgba(76, 175, 80, 0.05)",
          }),
        }}
        onClick={handleCourseClick}
      >
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }}>
          {/* Image */}
          <Box
            sx={{
              width: { xs: "100%", md: 280 },
              height: { xs: 200, md: 200 },
              position: "relative",
              overflow: "hidden",
            }}
          >
            {course.thumbnail ? (
              <CardMedia
                component="img"
                image={course.thumbnail}
                alt={course.title}
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
                <School sx={{ fontSize: 80 }} />
              </Box>
            )}

            {/* Price Chip */}
            <Chip
              label={
                hasActivePromotion
                  ? `$${discountedPrice.toFixed(2)}`
                  : `$${course.price || 0}`
              }
              color={hasActivePromotion ? "error" : "primary"}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                bgcolor: "white",
                color: hasActivePromotion ? "error.main" : "primary.main",
                fontWeight: 600,
              }}
            />

            {/* Promotion Badge */}
            {hasActivePromotion && !isCoursePurchased && promotion && (
              <Chip
                label={`${promotion.discountPercentage}% OFF`}
                color="warning"
                icon={<LocalOffer />}
                sx={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  fontWeight: 700,
                  bgcolor: "#fff3cd",
                  color: "#8a4b00",
                }}
              />
            )}

            {/* Purchased Badge */}
            {isCoursePurchased && (
              <Chip
                label="Comprado"
                color="success"
                icon={<CheckCircle />}
                sx={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                }}
              />
            )}
          </Box>

          {/* Content */}
          <Box flex={1} display="flex" flexDirection="column">
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Rating
                  value={course.rating || 0}
                  precision={0.1}
                  size="small"
                  readOnly
                />
                <Typography variant="caption" color="text.secondary">
                  ({course.rating || 0} calificaciones)
                </Typography>
              </Box>

              {hasActivePromotion && promotion && (
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip
                    label="Promoción activa"
                    color="error"
                    size="small"
                    icon={<LocalOffer />}
                  />
                  <Chip
                    label={promotionTimeLeft}
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              )}

              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    color: "primary.main",
                    textDecoration: "underline",
                  },
                }}
                onClick={handleCourseClick}
              >
                {course.title}
              </Typography>

              <Typography variant="body2" color="text.secondary" paragraph>
                {course.description}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <AccessTime fontSize="small" />
                  <Typography variant="caption">
                    {formatDuration(course.totalDuration)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <People fontSize="small" />
                  <Typography variant="caption">
                    {course.totalStudents || 0} estudiantes
                  </Typography>
                </Box>
              </Box>
            </CardContent>

            {showActions && (
              <CardActions sx={{ p: 2, pt: 0 }}>
                {isCoursePurchased ? (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayArrow />}
                    onClick={handleCourseClick}
                    fullWidth
                    sx={{
                      "&:hover": {
                        transform: "scale(1.02)",
                      },
                      transition: "transform 0.2s",
                    }}
                  >
                    Continuar Curso
                  </Button>
                ) : (
                  <Box display="flex" gap={1} width="100%">
                    <Button
                      variant="outlined"
                      startIcon={<AddShoppingCart />}
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || isLoading || isCourseInCart}
                      sx={{
                        flex: 1,
                        "&:hover": {
                          transform: "scale(1.02)",
                        },
                        transition: "transform 0.2s",
                      }}
                    >
                      {isCourseInCart ? "En Carrito" : "Carrito"}
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<CreditCard />}
                      onClick={handleBuyNow}
                      sx={{
                        flex: 1,
                        "&:hover": {
                          transform: "scale(1.02)",
                        },
                        transition: "transform 0.2s",
                      }}
                    >
                      Comprar $
                      {hasActivePromotion
                        ? discountedPrice.toFixed(2)
                        : course.price || 0}
                    </Button>
                  </Box>
                )}
              </CardActions>
            )}
          </Box>
        </Box>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Modal de Pago con Stripe */}
      <StripePayment
        open={paymentModalOpen}
        onClose={handlePaymentClose}
        courseId={course._id}
        courseTitle={course.title}
        courseDescription={course.description}
        courseThumbnail={course.thumbnail || "/placeholder-course.jpg"}
        coursePrice={hasActivePromotion ? discountedPrice : course.price || 0}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};
