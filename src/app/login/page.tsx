"use client";

import React, { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Link,
} from "@mui/material";
import { School, Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, register, isLoading } = useAuth();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isLoginMode) {
        await login(formData.email, formData.password);
      } else {
        // La API asigna automáticamente el rol (el primer usuario será maestro)
        await register(formData.email, formData.password);
      }
      router.push("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    }
  };

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    setError("");

    if (!credentialResponse.credential) {
      setError("No se pudo obtener la credencial de Google");
      return;
    }

    try {
      await loginWithGoogle(credentialResponse.credential);
      router.push("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    }
  };

  const handleGoogleError = () => {
    setError("No se pudo iniciar sesión con Google");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, textAlign: "center" }}>
          {/* Logo y Título */}
          <Box sx={{ mb: 3 }}>
            <School sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              Aprende con Olmos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isLoginMode
                ? "Inicia sesión en tu cuenta"
                : "Crea tu cuenta de estudiante"}
            </Typography>
          </Box>

          {/* Formulario */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange("password")}
              required
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={() => setShowPassword(!showPassword)}
                    sx={{ minWidth: "auto", p: 1 }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </Button>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mb: 2 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isLoginMode ? (
                "Iniciar Sesión"
              ) : (
                "Registrarse como Estudiante"
              )}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                o
              </Typography>
            </Divider>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              {googleClientId && !isLoading ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text={isLoginMode ? "signin_with" : "signup_with"}
                  width="360"
                />
              ) : (
                <Button fullWidth variant="outlined" disabled>
                  {googleClientId
                    ? "Continuar con Google"
                    : "Google no configurado"}
                </Button>
              )}
            </Box>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => setIsLoginMode(!isLoginMode)}
              disabled={isLoading}
            >
              {isLoginMode
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </Button>
          </Box>

          {/* Enlaces adicionales */}
          {isLoginMode && (
            <Box sx={{ mt: 3 }}>
              <Link href="#" variant="body2" sx={{ cursor: "pointer" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
