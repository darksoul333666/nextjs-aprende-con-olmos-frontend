"use client";

import React from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { School, People, AccessTime, TrendingUp } from "@mui/icons-material";

interface StudentStatsProps {
  availableCourses: any[];
}

export const StudentStats: React.FC<StudentStatsProps> = ({
  availableCourses,
}) => {
  const totalStudents = availableCourses.reduce(
    (total, course) => total + (course.totalStudents || 0),
    0,
  );
  const totalHours = Math.round(
    availableCourses.reduce(
      (total, course) => total + (course.totalDuration || 0),
      0,
    ) / 3600,
  );

  return (
    <Paper sx={{ p: 4, mb: 6, textAlign: "center" }}>
      <Typography
        variant="h4"
        component="h2"
        gutterBottom
        sx={{ fontWeight: 600 }}
      >
        ¿Por qué elegirnos?
      </Typography>
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={4}
        sx={{ mt: 2 }}
      >
        <Box flex={1} display="flex" flexDirection="column" alignItems="center">
          <Avatar
            sx={{ bgcolor: "primary.main", width: 64, height: 64, mb: 2 }}
          >
            <School sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {availableCourses.length} Cursos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Especializados en Matemáticas
          </Typography>
        </Box>
        <Box flex={1} display="flex" flexDirection="column" alignItems="center">
          <Avatar
            sx={{ bgcolor: "success.main", width: 64, height: 64, mb: 2 }}
          >
            <People sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {totalStudents.toLocaleString()}+ Estudiantes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Satisfechos con nuestros cursos
          </Typography>
        </Box>
        <Box flex={1} display="flex" flexDirection="column" alignItems="center">
          <Avatar
            sx={{ bgcolor: "warning.main", width: 64, height: 64, mb: 2 }}
          >
            <AccessTime sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {totalHours}+ Horas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            De contenido educativo
          </Typography>
        </Box>
        <Box flex={1} display="flex" flexDirection="column" alignItems="center">
          <Avatar sx={{ bgcolor: "info.main", width: 64, height: 64, mb: 2 }}>
            <TrendingUp sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            95% Éxito
          </Typography>
          <Typography variant="body2" color="text.secondary">
            En exámenes de admisión
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
