"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Container,
  CircularProgress,
  Paper,
  Typography,
  Box,
  Button,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { CoursePlayer } from "../../components/CoursePlayer/CoursePlayer";
import { courseService, Course } from "../../services/courseService";
import { CourseProgress, progressService } from "../../services/progressService";
import { useAuth } from "../../contexts/AuthContext";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "../../components/Navigation/Navbar";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [initialVideoId, setInitialVideoId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Detectar si está en modo preview
  const isPreviewMode = searchParams.get("preview") === "true";

  const getEntityId = useCallback((value: unknown) => {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      return String(record._id || record.id || "");
    }

    return String(value);
  }, []);

  const applyProgressToCourse = useCallback(
    (courseData: Course, progress: CourseProgress): Course => {
      const completedVideoIds = new Set(
        (progress.completedVideos || []).map((videoId) => getEntityId(videoId)),
      );
      const videoProgressById = new Map(
        (progress.videoProgress || []).map((item) => [
          getEntityId(item.videoId),
          item,
        ]),
      );
      const completedEvaluationIds = new Set(
        (progress.completedEvaluations || []).map((evaluationId) =>
          getEntityId(evaluationId),
        ),
      );
      const passedEvaluationIds = new Set(
        (progress.evaluationAttempts || [])
          .filter((attempt) => attempt.passed)
          .map((attempt) => getEntityId(attempt.evaluationId)),
      );

      return {
        ...courseData,
        sections: courseData.sections.map((section) => ({
          ...section,
          videos: section.videos.map((video) => {
            const persistedProgress = videoProgressById.get(video._id);
            const isCompleted =
              video.isCompleted ||
              completedVideoIds.has(video._id) ||
              persistedProgress?.completed ||
              persistedProgress?.progress === 1;

            return {
              ...video,
              isCompleted,
              progress: persistedProgress?.progress ?? video.progress ?? 0,
            };
          }),
        })),
        evaluations: courseData.evaluations?.map((evaluation) => ({
          ...evaluation,
          isCompleted:
            evaluation.isCompleted ||
            completedEvaluationIds.has(evaluation._id) ||
            passedEvaluationIds.has(evaluation._id),
        })),
      };
    },
    [getEntityId],
  );

  const getResumeVideoId = useCallback(
    (courseData: Course, progress?: CourseProgress): string | undefined => {
      const videos = courseData.sections.flatMap(
        (section) => section.videos || [],
      );
      if (!videos.length) {
        return undefined;
      }

      const existingVideoIds = new Set(videos.map((video) => video._id));
      const backendVideoId =
        getEntityId(progress?.currentVideoId) ||
        getEntityId(progress?.lastVideoId);

      if (backendVideoId && existingVideoIds.has(backendVideoId)) {
        return backendVideoId;
      }

      const latestProgressVideo = [...(progress?.videoProgress || [])]
        .filter((item) => existingVideoIds.has(getEntityId(item.videoId)))
        .sort((a, b) => {
          const aDate = a.lastWatchedAt
            ? new Date(a.lastWatchedAt).getTime()
            : 0;
          const bDate = b.lastWatchedAt
            ? new Date(b.lastWatchedAt).getTime()
            : 0;
          return bDate - aDate;
        })[0];

      if (latestProgressVideo) {
        return getEntityId(latestProgressVideo.videoId);
      }

      return videos.find((video) => !video.isCompleted)?._id || videos[0]._id;
    },
    [getEntityId],
  );

  // Handle SSR - only render after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const courseData = await courseService.getCourse(courseId);
        if (!courseData) {
          setCourse(null);
          setInitialVideoId(undefined);
          return;
        }

        if (isAuthenticated && !isPreviewMode) {
          try {
            const progress = await progressService.getCourseProgress(courseId);
            const courseWithProgress = applyProgressToCourse(courseData, progress);
            setInitialVideoId(getResumeVideoId(courseWithProgress, progress));
            setCourse(courseWithProgress);
            return;
          } catch {}
        }

        setInitialVideoId(getResumeVideoId(courseData));
        setCourse(courseData);
      } catch {
        setError("No se pudo cargar el curso");
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [
    applyProgressToCourse,
    courseId,
    getResumeVideoId,
    isAuthenticated,
    isPreviewMode,
  ]);

  const handleVideoComplete = async (videoId: string) => {
    // No guardar progreso en modo preview
    if (isPreviewMode || !isAuthenticated || !course) return;

    try {
      await progressService.markVideoCompleted(course._id, videoId);
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((section) => ({
                ...section,
                videos: section.videos.map((video) =>
                  video._id === videoId
                    ? { ...video, isCompleted: true, progress: 1 }
                    : video,
                ),
              })),
            }
          : prev,
      );
    } catch {}
  };

  const handleVideoProgress = async (videoId: string, progress: number) => {
    // No guardar progreso en modo preview
    if (isPreviewMode || !isAuthenticated || !course) return;

    try {
      await progressService.updateVideoProgress(course._id, videoId, progress);
    } catch {}
  };

  if (!isMounted || isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar />
        <Box
          sx={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar />
        <Container
          maxWidth={false}
          disableGutters
          sx={{
            height: "calc(100vh - 64px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {error || "Curso no encontrado"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              El curso que buscas no existe o no tienes permisos para acceder a
              él.
            </Typography>
            {user?.role === "maestro" && (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => router.push(`/courses/edit/${courseId}`)}
                sx={{ mt: 2 }}
              >
                Editar Curso
              </Button>
            )}
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar />
      <Container
        maxWidth={false}
        disableGutters
        sx={{ height: "calc(100vh - 64px)", position: "relative" }}
      >
        {/* Botón de Editar - Solo para maestros y NO en modo preview */}
        {user?.role === "maestro" && !isPreviewMode && (
          <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 1000 }}>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => router.push(`/courses/edit/${courseId}`)}
              sx={{
                bgcolor: "secondary.main",
                "&:hover": { bgcolor: "secondary.dark" },
              }}
            >
              Editar Curso
            </Button>
          </Box>
        )}

        <CoursePlayer
          course={course}
          isPreviewMode={isPreviewMode}
          initialVideoId={initialVideoId}
          onVideoComplete={handleVideoComplete}
          onVideoProgress={handleVideoProgress}
        />
      </Container>
    </Box>
  );
}
