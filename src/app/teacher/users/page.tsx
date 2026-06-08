"use client";

import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  Block,
  Edit,
  People,
  RestartAlt,
  Search,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navigation/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import {
  CreateStudentRequest,
  StudentFilters,
  StudentUser,
  UpdateStudentRequest,
  userService,
} from "../../services/userService";

interface StudentFormState {
  email: string;
  name: string;
  password: string;
  isActive: boolean;
}

const defaultForm: StudentFormState = {
  email: "",
  name: "",
  password: "",
  isActive: true,
};

export default function TeacherUsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StudentFilters["status"]>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);
  const [form, setForm] = useState<StudentFormState>(defaultForm);
  const [formError, setFormError] = useState("");

  const loadStudents = async (filters: StudentFilters = { search, status }) => {
    try {
      setIsLoading(true);
      setError("");
      const data = await userService.getStudents(filters);
      setStudents(data);
    } catch {
      setError("No se pudieron cargar los estudiantes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "maestro") {
      return;
    }

    const timeout = window.setTimeout(() => {
      loadStudents({ search: search.trim(), status });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [user, search, status]);

  const openCreateDialog = () => {
    setEditingStudent(null);
    setForm(defaultForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEditDialog = (student: StudentUser) => {
    setEditingStudent(student);
    setForm({
      email: student.email,
      name: student.name || "",
      password: "",
      isActive: student.isActive,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSaving) {
      return;
    }
    setDialogOpen(false);
    setEditingStudent(null);
    setForm(defaultForm);
    setFormError("");
  };

  const validateForm = () => {
    if (!form.email.trim()) {
      return "El correo es requerido";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Ingresa un correo válido";
    }

    if (!editingStudent && form.password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    }

    if (editingStudent && form.password && form.password.length < 6) {
      return "La nueva contraseña debe tener al menos 6 caracteres";
    }

    return "";
  };

  const handleSave = async () => {
    const validation = validateForm();
    if (validation) {
      setFormError(validation);
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");
      setError("");
      setSuccess("");

      if (editingStudent) {
        const payload: UpdateStudentRequest = {
          email: form.email.trim(),
          name: form.name.trim() || undefined,
          isActive: form.isActive,
          ...(form.password && { password: form.password }),
        };
        await userService.updateStudent(editingStudent._id, payload);
        setSuccess("Estudiante actualizado correctamente");
      } else {
        const payload: CreateStudentRequest = {
          email: form.email.trim(),
          name: form.name.trim() || undefined,
          password: form.password,
        };
        await userService.createStudent(payload);
        setSuccess("Estudiante creado correctamente");
      }

      closeDialog();
      await loadStudents({ search: search.trim(), status });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el estudiante",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (student: StudentUser) => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      await userService.deactivateStudent(student._id);
      setSuccess("Estudiante dado de baja correctamente");
      await loadStudents({ search: search.trim(), status });
    } catch {
      setError("No se pudo dar de baja al estudiante");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReactivate = async (student: StudentUser) => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      await userService.reactivateStudent(student._id);
      setSuccess("Estudiante reactivado correctamente");
      await loadStudents({ search: search.trim(), status });
    } catch {
      setError("No se pudo reactivar al estudiante");
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== "maestro") {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar currentPage="teacher-users" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            Solo los maestros pueden gestionar estudiantes.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar currentPage="teacher-users" />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => router.push("/teacher")}>
            <ArrowBack />
          </IconButton>
          <People color="primary" sx={{ fontSize: 36 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              Gestión de Estudiantes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Altas, bajas por desactivación, reactivaciones y modificaciones
              de usuarios estudiantes.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Nuevo Estudiante
          </Button>
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

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Buscar"
              placeholder="Nombre o correo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ flex: 2, minWidth: 260 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Estado"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StudentFilters["status"])
              }
              sx={{ flex: 1, minWidth: 180 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="inactive">Inactivos</MenuItem>
            </TextField>
          </Box>
        </Paper>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={60} />
          </Box>
        ) : students.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <People sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay estudiantes registrados
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateDialog}
              sx={{ mt: 2 }}
            >
              Crear primer estudiante
            </Button>
          </Paper>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {students.map((student) => (
              <Card key={student._id}>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={2}
                    flexWrap="wrap"
                  >
                    <Box sx={{ flex: 1, minWidth: 260 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {student.name || "Sin nombre"}
                        </Typography>
                        <Chip
                          label={student.isActive ? "Activo" : "Inactivo"}
                          color={student.isActive ? "success" : "default"}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {student.email}
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                        <Chip
                          label={`${student.purchasesCount || 0} compra(s)`}
                          size="small"
                          variant="outlined"
                        />
                        {student.createdAt && (
                          <Chip
                            label={`Alta: ${new Date(
                              student.createdAt,
                            ).toLocaleDateString()}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    <Box display="flex" gap={1}>
                      <IconButton
                        color="primary"
                        onClick={() => openEditDialog(student)}
                        disabled={isSaving}
                      >
                        <Edit />
                      </IconButton>
                      {student.isActive ? (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Block />}
                          onClick={() => handleDeactivate(student)}
                          disabled={isSaving}
                        >
                          Dar de baja
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="success"
                          startIcon={<RestartAlt />}
                          onClick={() => handleReactivate(student)}
                          disabled={isSaving}
                        >
                          Reactivar
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStudent ? "Editar Estudiante" : "Nuevo Estudiante"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              fullWidth
              label="Nombre"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <TextField
              fullWidth
              label="Correo"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
            <TextField
              fullWidth
              label={
                editingStudent
                  ? "Nueva contraseña (opcional)"
                  : "Contraseña inicial"
              }
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              required={!editingStudent}
            />
            {editingStudent && (
              <TextField
                select
                label="Estado"
                value={form.isActive ? "active" : "inactive"}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: event.target.value === "active",
                  }))
                }
              >
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : <Add />}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
