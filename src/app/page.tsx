"use client";

import React, { useEffect, useState } from "react";
import { CircularProgress, Box } from "@mui/material";
import { HomeStudents } from "./components/HomeStudents";
import { HomeTeacher } from "./components/HomeTeacher";
import { courseService, Course } from "./services/courseService";
import { useAuth } from "./contexts/AuthContext";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const [courses, userCoursesData] = await Promise.all([
          courseService.getCourses(),
          isAuthenticated && user?.role === "estudiante"
            ? courseService.getPurchasedCourses()
            : Promise.resolve([]),
        ]);

        setAvailableCourses(Array.isArray(courses) ? courses : []);
        setUserCourses(Array.isArray(userCoursesData) ? userCoursesData : []);
      } catch {
        setAvailableCourses([]);
        setUserCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [isAuthenticated, user]);

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

  if (user?.role === "maestro") {
    return (
      <HomeTeacher availableCourses={availableCourses} isLoading={isLoading} />
    );
  }

  return (
    <HomeStudents
      availableCourses={availableCourses}
      userCourses={userCourses}
      isLoading={isLoading}
      isAuthenticated={isAuthenticated}
    />
  );
}
