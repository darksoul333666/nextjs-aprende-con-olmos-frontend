"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  CardGiftcard,
  ContentCopy,
  Delete as DeleteIcon,
  Edit,
  Event,
  LocalOffer,
  Percent,
  PersonSearch,
  Redeem,
  School,
} from "@mui/icons-material";
import { Navbar } from "../../components/Navigation/Navbar";
import {
  courseService,
  TeacherCourse,
} from "../../services/courseService";
import {
  GiftCard,
  giftCardService,
} from "../../services/giftCardService";
import {
  Promotion,
  promotionService,
} from "../../services/promotionService";
import {
  Scholarship,
  ScholarshipStudent,
  scholarshipService,
} from "../../services/scholarshipService";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

type PromotionsTab = "promotions" | "gift-cards" | "scholarships";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const generateGiftCode = () => {
  const letters = Array.from(
    { length: 8 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");

  return `${letters.slice(0, 4)}-${letters.slice(4)}`;
};

export default function TeacherPromotionsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<PromotionsTab>("promotions");
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [students, setStudents] = useState<ScholarshipStudent[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<ScholarshipStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPromotion, setIsCreatingPromotion] = useState(false);
  const [isCreatingGiftCard, setIsCreatingGiftCard] = useState(false);
  const [isSavingScholarship, setIsSavingScholarship] = useState(false);
  const [isRemovingScholarship, setIsRemovingScholarship] = useState(false);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [promotionForm, setPromotionForm] = useState({
    courseId: "",
    discountPercentage: 10,
    startsAt: "",
    endsAt: "",
  });
  const [giftCardForm, setGiftCardForm] = useState({
    name: "",
    courseId: "",
    maxRedemptions: 1,
    code: "",
  });
  const [scholarshipForm, setScholarshipForm] = useState({
    discountPercentage: 50,
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const coursesData = await courseService.getTeacherCoursesWithStats();
      setCourses(coursesData.courses);

      const [promotionsResult, giftCardsResult, scholarshipsResult] =
        await Promise.allSettled([
          promotionService.getPromotions(),
          giftCardService.getGiftCards(),
          scholarshipService.getScholarships(),
        ]);

      setPromotions(
        promotionsResult.status === "fulfilled" ? promotionsResult.value : [],
      );
      setGiftCards(
        giftCardsResult.status === "fulfilled" ? giftCardsResult.value : [],
      );
      setScholarships(
        scholarshipsResult.status === "fulfilled"
          ? scholarshipsResult.value
          : [],
      );
    } catch {
      setError("No se pudieron cargar los cursos del maestro");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === undefined) {
      return;
    }

    if (!isAuthenticated || user?.role !== "maestro") {
      router.push("/");
      return;
    }

    loadData();
  }, [isAuthenticated, loadData, router, user]);

  useEffect(() => {
    if (activeTab !== "scholarships") {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setIsSearchingStudents(true);
        const studentsData = await scholarshipService.searchStudents(
          studentSearch.trim(),
        );
        setStudents(studentsData);
      } catch {
        setStudents([]);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [activeTab, studentSearch]);

  useEffect(() => {
    if (!selectedStudent) {
      return;
    }

    const existingScholarship =
      selectedStudent.scholarship ||
      scholarships.find(
        (scholarship) => scholarship.studentId._id === selectedStudent._id,
      );

    setScholarshipForm({
      discountPercentage: existingScholarship?.discountPercentage || 50,
    });
  }, [scholarships, selectedStudent]);

  const courseTitleById = useMemo(() => {
    return courses.reduce<Record<string, string>>((acc, course) => {
      acc[course.id] = course.title;
      return acc;
    }, {});
  }, [courses]);

  const getGiftCardCourseTitle = (giftCard: GiftCard) => {
    if (typeof giftCard.courseId === "object") {
      return giftCard.courseId.title;
    }

    return courseTitleById[giftCard.courseId] || "Curso no encontrado";
  };

  const getPromotionCourseTitle = (promotion: Promotion) => {
    if (typeof promotion.courseId === "object") {
      return promotion.courseId.title;
    }

    return courseTitleById[promotion.courseId] || "Curso no encontrado";
  };

  const selectedStudentScholarship = useMemo(() => {
    if (!selectedStudent) {
      return null;
    }

    return (
      selectedStudent.scholarship ||
      scholarships.find(
        (scholarship) => scholarship.studentId._id === selectedStudent._id,
      ) ||
      null
    );
  }, [scholarships, selectedStudent]);

  const getStudentLabel = (student: ScholarshipStudent) => {
    const name = student.name?.trim();
    return name ? `${name} (${student.email})` : student.email;
  };

  const formatDateTime = (value: string) => {
    if (!value) {
      return "Sin fecha";
    }

    return new Date(value).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = Date.now();
    const startsAt = new Date(promotion.startsAt).getTime();
    const endsAt = new Date(promotion.endsAt).getTime();

    if (!promotion.isActive || now > endsAt) {
      return { label: "Finalizada", color: "default" as const };
    }

    if (now < startsAt) {
      return { label: "Programada", color: "info" as const };
    }

    return { label: "Activa", color: "success" as const };
  };

  const handleTabChange = (_event: React.SyntheticEvent, value: PromotionsTab) => {
    setActiveTab(value);
    setError("");
    setSuccess("");
  };

  const handleCreatePromotion = async () => {
    if (
      !promotionForm.courseId ||
      promotionForm.discountPercentage <= 0 ||
      promotionForm.discountPercentage >= 100 ||
      !promotionForm.startsAt ||
      !promotionForm.endsAt
    ) {
      setError("Completa curso, descuento, fecha inicial y fecha final");
      return;
    }

    if (
      new Date(promotionForm.startsAt).getTime() >=
      new Date(promotionForm.endsAt).getTime()
    ) {
      setError("La fecha final debe ser posterior a la fecha inicial");
      return;
    }

    try {
      setIsCreatingPromotion(true);
      setError("");
      setSuccess("");

      const promotion = await promotionService.createPromotion(promotionForm);
      setPromotions((prev) => [promotion, ...prev]);
      setPromotionForm({
        courseId: "",
        discountPercentage: 10,
        startsAt: "",
        endsAt: "",
      });
      setSuccess("Promoción creada correctamente");
    } catch {
      setError("No se pudo crear la promoción");
    } finally {
      setIsCreatingPromotion(false);
    }
  };

  const handleCreateGiftCard = async () => {
    if (
      !giftCardForm.name.trim() ||
      !giftCardForm.courseId ||
      giftCardForm.maxRedemptions <= 0 ||
      !giftCardForm.code
    ) {
      setError("Completa nombre, curso, canjes y genera un código");
      return;
    }

    try {
      setIsCreatingGiftCard(true);
      setError("");
      setSuccess("");

      const giftCard = await giftCardService.createGiftCard({
        name: giftCardForm.name.trim(),
        courseId: giftCardForm.courseId,
        maxRedemptions: giftCardForm.maxRedemptions,
        code: giftCardForm.code,
      });

      setGiftCards((prev) => [giftCard, ...prev]);
      setGiftCardForm({
        name: "",
        courseId: "",
        maxRedemptions: 1,
        code: "",
      });
      setSuccess("Tarjeta de regalo creada correctamente");
    } catch {
      setError("No se pudo crear la tarjeta de regalo");
    } finally {
      setIsCreatingGiftCard(false);
    }
  };

  const handleSaveScholarship = async () => {
    if (!selectedStudent) {
      setError("Selecciona un estudiante");
      return;
    }

    if (
      scholarshipForm.discountPercentage <= 0 ||
      scholarshipForm.discountPercentage > 100
    ) {
      setError("El porcentaje de beca debe estar entre 1 y 100");
      return;
    }

    try {
      setIsSavingScholarship(true);
      setError("");
      setSuccess("");

      const scholarship = await scholarshipService.upsertScholarship({
        studentId: selectedStudent._id,
        discountPercentage: scholarshipForm.discountPercentage,
      });

      setScholarships((prev) => [
        scholarship,
        ...prev.filter((item) => item.studentId._id !== selectedStudent._id),
      ]);
      setStudents((prev) =>
        prev.map((student) =>
          student._id === selectedStudent._id
            ? {
                ...student,
                scholarship: {
                  _id: scholarship._id,
                  discountPercentage: scholarship.discountPercentage,
                  isActive: scholarship.isActive,
                },
              }
            : student,
        ),
      );
      setSelectedStudent((prev) =>
        prev
          ? {
              ...prev,
              scholarship: {
                _id: scholarship._id,
                discountPercentage: scholarship.discountPercentage,
                isActive: scholarship.isActive,
              },
            }
          : prev,
      );
      setSuccess(
        selectedStudentScholarship
          ? "Beca actualizada correctamente"
          : "Beca creada correctamente",
      );
    } catch {
      setError("No se pudo guardar la beca");
    } finally {
      setIsSavingScholarship(false);
    }
  };

  const handleRemoveScholarship = async (studentId?: string) => {
    const targetStudentId = studentId || selectedStudent?._id;
    if (!targetStudentId) {
      setError("Selecciona un estudiante con beca");
      return;
    }

    try {
      setIsRemovingScholarship(true);
      setError("");
      setSuccess("");

      await scholarshipService.removeScholarship(targetStudentId);
      setScholarships((prev) =>
        prev.filter((scholarship) => scholarship.studentId._id !== targetStudentId),
      );
      setStudents((prev) =>
        prev.map((student) =>
          student._id === targetStudentId
            ? { ...student, scholarship: null }
            : student,
        ),
      );
      setSelectedStudent((prev) =>
        prev?._id === targetStudentId ? { ...prev, scholarship: null } : prev,
      );
      setSuccess("Beca removida correctamente");
    } catch {
      setError("No se pudo remover la beca");
    } finally {
      setIsRemovingScholarship(false);
    }
  };

  const handleEditScholarship = (scholarship: Scholarship) => {
    const student: ScholarshipStudent = {
      _id: scholarship.studentId._id,
      email: scholarship.studentId.email,
      name: scholarship.studentId.name,
      scholarship: {
        _id: scholarship._id,
        discountPercentage: scholarship.discountPercentage,
        isActive: scholarship.isActive,
      },
    };

    setSelectedStudent(student);
    setStudentSearch(getStudentLabel(student));
    setStudents((prev) =>
      prev.some((item) => item._id === student._id) ? prev : [student, ...prev],
    );
    setScholarshipForm({
      discountPercentage: scholarship.discountPercentage,
    });
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch {
      setError("No se pudo copiar el código");
    }
  };

  if (isAuthenticated === undefined || isLoading) {
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
      <Navbar currentPage="teacher-promotions" />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Promociones y beneficios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra descuentos por curso, tarjetas de regalo y becas para tus
            estudiantes.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              value="promotions"
              icon={<LocalOffer />}
              iconPosition="start"
              label="Promociones"
            />
            <Tab
              value="gift-cards"
              icon={<CardGiftcard />}
              iconPosition="start"
              label="Tarjetas de regalo"
            />
            <Tab
              value="scholarships"
              icon={<School />}
              iconPosition="start"
              label="Becas"
            />
          </Tabs>
        </Paper>

        {activeTab === "promotions" && (
          <>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Percent color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Crear promoción por curso
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1.3fr 0.7fr 1fr 1fr auto",
                  },
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>Curso</InputLabel>
                  <Select
                    label="Curso"
                    value={promotionForm.courseId}
                    onChange={(event) =>
                      setPromotionForm((prev) => ({
                        ...prev,
                        courseId: event.target.value,
                      }))
                    }
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Descuento"
                  type="number"
                  value={promotionForm.discountPercentage}
                  onChange={(event) =>
                    setPromotionForm((prev) => ({
                      ...prev,
                      discountPercentage: Math.min(
                        99,
                        Math.max(1, parseInt(event.target.value) || 1),
                      ),
                    }))
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 1, max: 99 }}
                  fullWidth
                />

                <TextField
                  label="Inicio"
                  type="datetime-local"
                  value={promotionForm.startsAt}
                  onChange={(event) =>
                    setPromotionForm((prev) => ({
                      ...prev,
                      startsAt: event.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <TextField
                  label="Final"
                  type="datetime-local"
                  value={promotionForm.endsAt}
                  onChange={(event) =>
                    setPromotionForm((prev) => ({
                      ...prev,
                      endsAt: event.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <Button
                  variant="contained"
                  startIcon={
                    isCreatingPromotion ? (
                      <CircularProgress size={18} />
                    ) : (
                      <Add />
                    )
                  }
                  onClick={handleCreatePromotion}
                  disabled={isCreatingPromotion || courses.length === 0}
                  sx={{ minHeight: 56 }}
                >
                  Crear
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Event color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Promociones creadas
                </Typography>
              </Box>

              {promotions.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <LocalOffer
                    sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Aún no tienes promociones
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crea descuentos temporales para destacar tus cursos.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, 1fr)",
                    },
                    gap: 3,
                  }}
                >
                  {promotions.map((promotion) => {
                    const status = getPromotionStatus(promotion);

                    return (
                      <Card key={promotion._id} sx={{ height: "100%" }}>
                        <CardContent>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            gap={2}
                            mb={2}
                          >
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 600 }}
                              >
                                {getPromotionCourseTitle(promotion)}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Descuento aplicado al listado público del curso
                              </Typography>
                            </Box>
                            <Chip
                              label={status.label}
                              color={status.color}
                              size="small"
                            />
                          </Box>

                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Chip
                              label={`${promotion.discountPercentage}% OFF`}
                              color="error"
                              icon={<LocalOffer />}
                              sx={{ fontWeight: 700 }}
                            />
                          </Box>

                          <Divider sx={{ mb: 2 }} />

                          <Box display="grid" gap={1}>
                            <Box display="flex" justifyContent="space-between">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Inicio
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700 }}
                              >
                                {formatDateTime(promotion.startsAt)}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Final
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700 }}
                              >
                                {formatDateTime(promotion.endsAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </>
        )}

        {activeTab === "gift-cards" && (
          <>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <CardGiftcard color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Crear tarjeta de regalo
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1.2fr 1.2fr 0.8fr",
                  },
                  gap: 2,
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <TextField
                  label="Nombre de la tarjeta"
                  value={giftCardForm.name}
                  onChange={(event) =>
                    setGiftCardForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ej. Regalo graduación"
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel>Curso</InputLabel>
                  <Select
                    label="Curso"
                    value={giftCardForm.courseId}
                    onChange={(event) =>
                      setGiftCardForm((prev) => ({
                        ...prev,
                        courseId: event.target.value,
                      }))
                    }
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Canjes disponibles"
                  type="number"
                  value={giftCardForm.maxRedemptions}
                  onChange={(event) =>
                    setGiftCardForm((prev) => ({
                      ...prev,
                      maxRedemptions: Math.max(
                        1,
                        parseInt(event.target.value) || 1,
                      ),
                    }))
                  }
                  inputProps={{ min: 1 }}
                  fullWidth
                />
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderStyle: "dashed",
                  bgcolor: "grey.50",
                }}
              >
                <Box
                  display="flex"
                  flexDirection={{ xs: "column", md: "row" }}
                  alignItems={{ xs: "stretch", md: "center" }}
                  justifyContent="space-between"
                  gap={2}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      Código de canje
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: 3,
                        fontFamily: "monospace",
                      }}
                    >
                      {giftCardForm.code || "---- ----"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      8 letras mayúsculas separadas de 4 en 4.
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      startIcon={<CardGiftcard />}
                      onClick={() =>
                        setGiftCardForm((prev) => ({
                          ...prev,
                          code: generateGiftCode(),
                        }))
                      }
                    >
                      Generar
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopy />}
                      onClick={() => handleCopyCode(giftCardForm.code)}
                      disabled={!giftCardForm.code}
                    >
                      {copiedCode === giftCardForm.code ? "Copiado" : "Copiar"}
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={
                        isCreatingGiftCard ? (
                          <CircularProgress size={18} />
                        ) : (
                          <Add />
                        )
                      }
                      onClick={handleCreateGiftCard}
                      disabled={isCreatingGiftCard || courses.length === 0}
                    >
                      Crear tarjeta
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <LocalOffer color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Tarjetas creadas
                </Typography>
              </Box>

              {giftCards.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Redeem sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Aún no tienes tarjetas de regalo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crea la primera para compartir acceso a uno de tus cursos.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, 1fr)",
                      lg: "repeat(3, 1fr)",
                    },
                    gap: 3,
                  }}
                >
                  {giftCards.map((giftCard) => (
                    <Card key={giftCard._id} sx={{ height: "100%" }}>
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          gap={2}
                          mb={2}
                        >
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {giftCard.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getGiftCardCourseTitle(giftCard)}
                            </Typography>
                          </Box>
                          <Chip
                            label={giftCard.isActive ? "Activa" : "Inactiva"}
                            color={giftCard.isActive ? "success" : "default"}
                            size="small"
                          />
                        </Box>

                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: "grey.50",
                            borderStyle: "dashed",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            Código para canjear
                          </Typography>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            gap={1}
                          >
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 800,
                                letterSpacing: 2,
                                fontFamily: "monospace",
                              }}
                            >
                              {giftCard.code}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ContentCopy />}
                              onClick={() => handleCopyCode(giftCard.code)}
                            >
                              {copiedCode === giftCard.code
                                ? "Copiado"
                                : "Copiar"}
                            </Button>
                          </Box>
                        </Paper>

                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Canjeadas
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {giftCard.redeemedCount} /{" "}
                            {giftCard.maxRedemptions}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </>
        )}

        {activeTab === "scholarships" && (
          <>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <School color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Asignar beca a estudiante
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                La beca aplica a todos los cursos que el estudiante compre. Si
                ya tiene una beca, puedes modificar el porcentaje o removerla.
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1.6fr 0.7fr auto auto",
                  },
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Autocomplete
                  options={students}
                  value={selectedStudent}
                  inputValue={studentSearch}
                  loading={isSearchingStudents}
                  getOptionLabel={getStudentLabel}
                  isOptionEqualToValue={(option, value) =>
                    option._id === value._id
                  }
                  onInputChange={(_event, value) => setStudentSearch(value)}
                  onChange={(_event, value) => setSelectedStudent(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar estudiante"
                      placeholder="Nombre o correo del estudiante"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PersonSearch />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {isSearchingStudents ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option._id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name || option.email}
                        </Typography>
                        {option.name && (
                          <Typography variant="caption" color="text.secondary">
                            {option.email}
                          </Typography>
                        )}
                        {option.scholarship && (
                          <Chip
                            label={`${option.scholarship.discountPercentage}% de beca`}
                            color="success"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                  noOptionsText={
                    studentSearch
                      ? "No se encontraron estudiantes"
                      : "Escribe para buscar estudiantes"
                  }
                />

                <TextField
                  label="Porcentaje"
                  type="number"
                  value={scholarshipForm.discountPercentage}
                  onChange={(event) =>
                    setScholarshipForm({
                      discountPercentage: Math.min(
                        100,
                        Math.max(1, parseInt(event.target.value) || 1),
                      ),
                    })
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 1, max: 100 }}
                  fullWidth
                />

                <Button
                  variant="contained"
                  startIcon={
                    isSavingScholarship ? (
                      <CircularProgress size={18} />
                    ) : selectedStudentScholarship ? (
                      <Edit />
                    ) : (
                      <Add />
                    )
                  }
                  onClick={handleSaveScholarship}
                  disabled={isSavingScholarship || !selectedStudent}
                  sx={{ minHeight: 56 }}
                >
                  {selectedStudentScholarship ? "Actualizar" : "Guardar"}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={
                    isRemovingScholarship ? (
                      <CircularProgress size={18} />
                    ) : (
                      <DeleteIcon />
                    )
                  }
                  onClick={() => handleRemoveScholarship()}
                  disabled={
                    isRemovingScholarship ||
                    !selectedStudent ||
                    !selectedStudentScholarship
                  }
                  sx={{ minHeight: 56 }}
                >
                  Remover
                </Button>
              </Box>

              {selectedStudentScholarship && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  Este estudiante ya tiene una beca de{" "}
                  <strong>
                    {selectedStudentScholarship.discountPercentage}%
                  </strong>
                  . Puedes actualizar el porcentaje o removerla.
                </Alert>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <School color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Becas registradas
                </Typography>
              </Box>

              {scholarships.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <School sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Aún no tienes becas registradas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Selecciona un estudiante y asigna un porcentaje de beca.
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, 1fr)",
                      lg: "repeat(3, 1fr)",
                    },
                    gap: 3,
                  }}
                >
                  {scholarships.map((scholarship) => (
                    <Card key={scholarship._id} sx={{ height: "100%" }}>
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          gap={2}
                          mb={2}
                        >
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {scholarship.studentId.name ||
                                scholarship.studentId.email}
                            </Typography>
                            {scholarship.studentId.name && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {scholarship.studentId.email}
                              </Typography>
                            )}
                          </Box>
                          <Chip
                            label={scholarship.isActive ? "Activa" : "Inactiva"}
                            color={scholarship.isActive ? "success" : "default"}
                            size="small"
                          />
                        </Box>

                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: "grey.50",
                            borderStyle: "dashed",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            Descuento global del estudiante
                          </Typography>
                          <Typography
                            variant="h4"
                            color="primary"
                            sx={{ fontWeight: 800 }}
                          >
                            {scholarship.discountPercentage}% OFF
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Aplica a todos los cursos que adquiera.
                          </Typography>
                        </Paper>

                        <Box display="flex" gap={1}>
                          <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => handleEditScholarship(scholarship)}
                            fullWidth
                          >
                            Modificar
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() =>
                              handleRemoveScholarship(scholarship.studentId._id)
                            }
                            disabled={isRemovingScholarship}
                            fullWidth
                          >
                            Remover
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}
