"use client";

import React, { useState, useEffect } from "react";
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
  Rating,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  AccessTime,
  People,
  School,
  ShoppingCart,
  FilterList,
  Visibility,
  CheckCircle,
  PlayArrow,
} from "@mui/icons-material";
import { Navbar } from "../components/Navigation/Navbar";
import { StripePayment } from "../components/StripePayment";
import { CourseCard } from "../components/CourseCard/CourseCard";
import {
  courseService,
  Course,
  CourseFilters,
} from "../services/courseService";
import { stripeService } from "../services/stripeService";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");

  // Estado para el modal de pago
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const coursesData = await courseService.getCourses();

        const coursesArray = Array.isArray(coursesData) ? coursesData : [];
        setCourses(coursesArray);
        setFilteredCourses(coursesArray);

        // Verificar si el backend proporciona isPurchased correctamente
        const hasPurchasedCourses = coursesArray.some(
          (course) => course.isPurchased === true,
        );

        // Si no hay cursos marcados como comprados, usar el método alternativo
        if (!hasPurchasedCourses && user) {
          try {
            const purchases = await stripeService.getPurchases();

            if (Array.isArray(purchases)) {
              const purchasedIds = purchases
                .filter((purchase) => purchase.status === "completed")
                .flatMap((purchase) =>
                  purchase.courses.map((item) => item.courseId._id),
                );

              setPurchasedCourseIds(purchasedIds);
            }
          } catch {}
        }
      } catch {
        setCourses([]);
        setPurchasedCourseIds([]);
        setFilteredCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  useEffect(() => {
    // Filtrar cursos basado en los criterios
    let filtered = courses;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtro por precio
    if (priceFilter !== "all") {
      filtered = filtered.filter((course) => {
        const price = course.price || 0;
        switch (priceFilter) {
          case "low":
            return price < 300;
          case "medium":
            return price >= 300 && price < 500;
          case "high":
            return price >= 500;
          default:
            return true;
        }
      });
    }

    // Filtro por duración
    if (durationFilter !== "all") {
      filtered = filtered.filter((course) => {
        const hours = (course.totalDuration || 0) / 3600;
        switch (durationFilter) {
          case "short":
            return hours < 20;
          case "medium":
            return hours >= 20 && hours < 40;
          case "long":
            return hours >= 40;
          default:
            return true;
        }
      });
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, priceFilter, durationFilter]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isCoursePurchased = (course: Course): boolean => {
    // Usar el campo isPurchased del backend si está disponible
    if (course.isPurchased !== undefined) {
      return course.isPurchased;
    }

    // Fallback al método anterior si el backend no proporciona el campo
    return purchasedCourseIds.includes(course._id);
  };

  const handleCourseClick = (courseId: string) => {
    if (!courseId) {
      alert("Error: El curso no tiene un ID válido");
      return;
    }
    router.push(`/course/${courseId}`);
  };

  const handlePurchase = (course: Course) => {
    setSelectedCourse(course);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setSelectedCourse(null);
    // Recargar la página para actualizar el estado de los cursos
    window.location.reload();
  };

  const handlePaymentClose = () => {
    setPaymentModalOpen(false);
    setSelectedCourse(null);
  };

  const handlePreview = (courseId: string) => {
    // Navegar a la vista de preview del curso
    router.push(`/course/${courseId}?preview=true`);
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar currentPage="courses" />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Cursos Disponibles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explora nuestra colección completa de cursos de matemáticas
          </Typography>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <FilterList color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filtros
            </Typography>
          </Box>

          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            gap={3}
          >
            <TextField
              fullWidth
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Precio</InputLabel>
              <Select
                value={priceFilter}
                label="Precio"
                onChange={(e) => setPriceFilter(e.target.value)}
              >
                <MenuItem value="all">Todos los precios</MenuItem>
                <MenuItem value="low">Menos de $300</MenuItem>
                <MenuItem value="medium">$300 - $500</MenuItem>
                <MenuItem value="high">Más de $500</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Duración</InputLabel>
              <Select
                value={durationFilter}
                label="Duración"
                onChange={(e) => setDurationFilter(e.target.value)}
              >
                <MenuItem value="all">Todas las duraciones</MenuItem>
                <MenuItem value="short">Menos de 20h</MenuItem>
                <MenuItem value="medium">20h - 40h</MenuItem>
                <MenuItem value="long">Más de 40h</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Resultados */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {filteredCourses.length} curso
            {filteredCourses.length !== 1 ? "s" : ""} encontrado
            {filteredCourses.length !== 1 ? "s" : ""}
          </Typography>
        </Box>

        {/* Lista de Cursos */}
        {filteredCourses.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 80,
                height: 80,
                mx: "auto",
                mb: 3,
              }}
            >
              <Search sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              No se encontraron cursos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Intenta ajustar los filtros de búsqueda
            </Typography>
          </Paper>
        ) : (
          <Box display="flex" flexDirection="column" gap={3}>
            {filteredCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                variant="default"
                showActions={true}
              />
            ))}
          </Box>
        )}

        {/* Call to Action */}
        <Paper sx={{ p: 4, mt: 4, textAlign: "center" }}>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            ¿Necesitas ayuda para elegir?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Contacta al maestro para recibir asesoría personalizada sobre qué
            curso es mejor para ti
          </Typography>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.push("/teacher")}
          >
            Contactar al Maestro
          </Button>
        </Paper>
      </Container>

      {/* Modal de Pago con Stripe */}
      {selectedCourse && (
        <StripePayment
          open={paymentModalOpen}
          onClose={handlePaymentClose}
          courseId={selectedCourse._id}
          courseTitle={selectedCourse.title}
          courseDescription={selectedCourse.description}
          courseThumbnail={
            selectedCourse.thumbnail || "/placeholder-course.jpg"
          }
          coursePrice={selectedCourse.price || 0}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Box>
  );
}
