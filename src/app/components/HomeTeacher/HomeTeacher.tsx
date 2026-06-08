"use client";

import React from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from "@mui/material";
import { School } from "@mui/icons-material";
import { Navbar } from "../Navigation/Navbar";
import { TeacherDashboard } from "../TeacherDashboard";
import { Course } from "../../services/courseService";

interface HomeTeacherProps {
  availableCourses: Course[];
  isLoading: boolean;
}

export const HomeTeacher: React.FC<HomeTeacherProps> = ({
  availableCourses,
  isLoading,
}) => {
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
      <Navbar currentPage="home" />
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          py: 4,
          mb: 4,
        }}
      ></Box>

      <Container maxWidth="lg">
        <TeacherDashboard />
      </Container>
    </Box>
  );
};
