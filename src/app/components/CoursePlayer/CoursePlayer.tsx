import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Chip,
  Alert,
} from "@mui/material";
import {
  PlayArrow,
  CheckCircle,
  Lock,
  ExpandMore,
  People,
  AccessTime,
  Book,
  VideoLibrary,
  Assessment,
  Search,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Visibility,
  Download,
  PictureAsPdf,
  Image,
  Slideshow,
  Article,
  Description,
} from "@mui/icons-material";
import { VideoPlayer } from "../VideoPlayer/components/VideoPlayer";
import {
  Course,
  CourseResource,
  CourseResourceType,
  Video,
} from "../../services/courseService";
import {
  CourseEvaluation,
  EvaluationAnswerInput,
  EvaluationQuestion,
  evaluationService,
} from "../../services/evaluationService";

interface CoursePlayerProps {
  course: Course;
  isPreviewMode?: boolean;
  initialVideoId?: string;
  onVideoComplete?: (videoId: string) => void;
  onVideoProgress?: (videoId: string, progress: number) => void;
  className?: string;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({
  course,
  isPreviewMode = false,
  initialVideoId,
  onVideoComplete,
  onVideoProgress,
  className,
}) => {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>(
    {},
  );
  const [activeEvaluation, setActiveEvaluation] =
    useState<CourseEvaluation | null>(null);
  const [evaluationAnswers, setEvaluationAnswers] = useState<
    Record<string, string | boolean>
  >({});
  const [evaluationResult, setEvaluationResult] = useState<string | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [completedEvaluationIds, setCompletedEvaluationIds] = useState<
    Set<string>
  >(new Set());
  const [triggeredEvaluationIds, setTriggeredEvaluationIds] = useState<
    Set<string>
  >(new Set());
  const [fetchedEvaluations, setFetchedEvaluations] = useState<
    CourseEvaluation[]
  >([]);
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceSearchTerm, setResourceSearchTerm] = useState("");
  const [sidebarView, setSidebarView] = useState<"content" | "resources">(
    "content",
  );
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const lastPersistedProgressRef = useRef<
    Record<string, { progress: number; savedAt: number }>
  >({});

  // Get all videos from all sections
  const allVideos = useMemo(() => {
    if (!course?.sections || !Array.isArray(course.sections)) {
      return [];
    }
    return course.sections.flatMap((section) => section.videos || []);
  }, [course?.sections]);

  const allResources = useMemo(() => {
    if (!course?.sections || !Array.isArray(course.sections)) {
      return [];
    }
    return course.sections.flatMap((section) => section.resources || []);
  }, [course?.sections]);

  const allEvaluations = useMemo(() => {
    return course.evaluations?.length ? course.evaluations : fetchedEvaluations;
  }, [course.evaluations, fetchedEvaluations]);

  // Get current video
  const currentVideo = useMemo(() => {
    if (!currentVideoId) {
      return undefined;
    }
    return allVideos.find((video) => video._id === currentVideoId);
  }, [currentVideoId, allVideos]);

  // Debug: Log current video info

  // Get current video index
  const currentVideoIndex = useMemo(() => {
    return allVideos.findIndex((video) => video._id === currentVideo?._id);
  }, [currentVideo, allVideos]);

  // Get next and previous videos
  const nextVideo = useMemo(() => {
    if (currentVideoIndex < allVideos.length - 1) {
      return allVideos[currentVideoIndex + 1];
    }
    return null;
  }, [currentVideoIndex, allVideos]);

  const previousVideo = useMemo(() => {
    if (currentVideoIndex > 0) {
      return allVideos[currentVideoIndex - 1];
    }
    return null;
  }, [currentVideoIndex, allVideos]);

  // Calculate course progress
  const courseProgress = useMemo(() => {
    if (allVideos.length === 0) {
      return 0;
    }

    const completedVideos = allVideos.filter(
      (video) => video.isCompleted,
    ).length;
    return (completedVideos / allVideos.length) * 100;
  }, [allVideos]);

  // Calculate total watched time
  const totalWatchedTime = useMemo(() => {
    return allVideos.reduce((total, video) => {
      const progress = videoProgress[video._id] || 0;
      return total + video.duration * progress;
    }, 0);
  }, [allVideos, videoProgress]);

  // Format duration helper
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getResourceTypeLabel = useCallback((type: CourseResourceType) => {
    const labels: Record<CourseResourceType, string> = {
      powerpoint: "PowerPoint",
      docx: "Documento",
      pdf: "PDF",
      image: "Imagen",
    };

    return labels[type];
  }, []);

  const getResourceIcon = (resource: CourseResource) => {
    if (resource.isLocked) {
      return <Lock fontSize="small" color="action" />;
    }

    switch (resource.type) {
      case "powerpoint":
        return <Slideshow fontSize="small" color="warning" />;
      case "docx":
        return <Article fontSize="small" color="primary" />;
      case "pdf":
        return <PictureAsPdf fontSize="small" color="error" />;
      case "image":
        return <Image fontSize="small" color="success" />;
      default:
        return <Description fontSize="small" color="action" />;
    }
  };

  const handleResourceDownload = useCallback((resource: CourseResource) => {
    if (resource.isLocked || !resource.url) {
      return;
    }

    window.open(resource.url, "_blank", "noopener,noreferrer");
  }, []);

  const isEvaluationCompleted = useCallback(
    (evaluation: CourseEvaluation) =>
      evaluation.isCompleted || completedEvaluationIds.has(evaluation._id),
    [completedEvaluationIds],
  );

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

  const getVideoEvaluations = useCallback(
    (videoId: string, trigger: CourseEvaluation["trigger"]) =>
      allEvaluations.filter(
        (evaluation) =>
          getEntityId(evaluation.videoId) === videoId &&
          evaluation.trigger === trigger &&
          !evaluation.isLocked,
      ),
    [allEvaluations, getEntityId],
  );

  const getBlockingEvaluation = useCallback(
    (video: Video | null | undefined, trigger: CourseEvaluation["trigger"]) => {
      if (!video) {
        return null;
      }

      return (
        getVideoEvaluations(video._id, trigger).find(
          (evaluation) =>
            evaluation.isRequired && !isEvaluationCompleted(evaluation),
        ) || null
      );
    },
    [getVideoEvaluations, isEvaluationCompleted],
  );

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const matchesSearch = useCallback(
    (...values: Array<string | undefined>) => {
      if (!normalizedSearchTerm) {
        return true;
      }

      return values.some((value) =>
        (value || "").toLowerCase().includes(normalizedSearchTerm),
      );
    },
    [normalizedSearchTerm],
  );

  const visibleSections = useMemo(() => {
    if (!course?.sections || !Array.isArray(course.sections)) {
      return [];
    }

    if (!normalizedSearchTerm) {
      return course.sections;
    }

    return course.sections.filter((section) => {
      const sectionMatches = matchesSearch(section.title, section.description);
      const videosMatch = (section.videos || []).some((video) =>
        matchesSearch(video.title, video.description),
      );
      const resourcesMatch = (section.resources || []).some((resource) =>
        matchesSearch(resource.title, resource.description, resource.fileName),
      );
      const evaluationsMatch = allEvaluations.some(
        (evaluation) =>
          getEntityId(evaluation.sectionId) === section._id &&
          matchesSearch(evaluation.title, evaluation.description),
      );

      return sectionMatches || videosMatch || resourcesMatch || evaluationsMatch;
    });
  }, [
    allEvaluations,
    course?.sections,
    getEntityId,
    matchesSearch,
    normalizedSearchTerm,
  ]);

  const normalizedResourceSearchTerm = resourceSearchTerm.trim().toLowerCase();
  const filteredResources = useMemo(() => {
    if (!normalizedResourceSearchTerm) {
      return allResources;
    }

    return allResources.filter((resource) =>
      [
        resource.title,
        resource.description,
        resource.fileName,
        getResourceTypeLabel(resource.type),
      ].some((value) =>
        (value || "").toLowerCase().includes(normalizedResourceSearchTerm),
      ),
    );
  }, [allResources, getResourceTypeLabel, normalizedResourceSearchTerm]);

  const resourcesByType = useMemo(() => {
    return filteredResources.reduce(
      (groups, resource) => {
        groups[resource.type] = [...(groups[resource.type] || []), resource];
        return groups;
      },
      {} as Partial<Record<CourseResourceType, CourseResource[]>>,
    );
  }, [filteredResources]);

  const resourceTypeOrder: CourseResourceType[] = [
    "pdf",
    "powerpoint",
    "docx",
    "image",
  ];

  const openEvaluation = useCallback((evaluation: CourseEvaluation) => {
    setActiveEvaluation(evaluation);
    setEvaluationAnswers({});
    setEvaluationResult(null);
    setEvaluationError(null);
  }, []);

  const getQuestionAnswerValue = (question: EvaluationQuestion) => {
    const questionId = question._id || String(question.order);
    return evaluationAnswers[questionId];
  };

  // Handle video selection
  const handleVideoSelect = useCallback(
    (video: Video) => {
      if (video.isLocked) {
        return; // Show purchase prompt or unlock message
      }

      const selectedVideoIndex = allVideos.findIndex(
        (item) => item._id === video._id,
      );
      const isMovingForward =
        currentVideo &&
        selectedVideoIndex > -1 &&
        currentVideoIndex > -1 &&
        selectedVideoIndex > currentVideoIndex;

      if (isMovingForward) {
        const blockingAfterEvaluation = getBlockingEvaluation(
          currentVideo,
          "after_video",
        );
        if (blockingAfterEvaluation) {
          openEvaluation(blockingAfterEvaluation);
          return;
        }
      }

      const blockingEvaluation = getBlockingEvaluation(video, "before_video");
      if (blockingEvaluation) {
        openEvaluation(blockingEvaluation);
        return;
      }

      setCurrentVideoId(video._id);
    },
    [
      allVideos,
      currentVideo,
      currentVideoIndex,
      getBlockingEvaluation,
      openEvaluation,
    ],
  );

  // Handle section expansion
  const handleSectionToggle = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Handle next video
  const handleNextVideo = useCallback(() => {
    const blockingAfterEvaluation = getBlockingEvaluation(
      currentVideo,
      "after_video",
    );
    if (blockingAfterEvaluation) {
      openEvaluation(blockingAfterEvaluation);
      return;
    }

    const blockingBeforeEvaluation = getBlockingEvaluation(
      nextVideo,
      "before_video",
    );
    if (blockingBeforeEvaluation) {
      openEvaluation(blockingBeforeEvaluation);
      return;
    }

    if (nextVideo && !nextVideo.isLocked) {
      setCurrentVideoId(nextVideo._id);
    }
  }, [currentVideo, getBlockingEvaluation, nextVideo, openEvaluation]);

  // Handle previous video
  const handlePreviousVideo = useCallback(() => {
    if (previousVideo) {
      setCurrentVideoId(previousVideo._id);
    }
  }, [previousVideo]);

  // Handle video progress
  const handleVideoProgress = useCallback(
    (progress: number) => {
      if (currentVideo) {
        setVideoProgress((prev) => ({
          ...prev,
          [currentVideo._id]: progress,
        }));

        const lastPersisted = lastPersistedProgressRef.current[
          currentVideo._id
        ] || { progress: 0, savedAt: 0 };
        const now = Date.now();
        const enoughTimePassed = now - lastPersisted.savedAt >= 10000;
        const enoughProgressChanged =
          progress > lastPersisted.progress &&
          Math.abs(progress - lastPersisted.progress) >= 0.05;

        if (enoughTimePassed || enoughProgressChanged || progress >= 0.95) {
          lastPersistedProgressRef.current[currentVideo._id] = {
            progress,
            savedAt: now,
          };
          onVideoProgress?.(currentVideo._id, progress);
        }

        if (!activeEvaluation) {
          const currentSecond = currentVideo.duration * progress;
          const dueEvaluation = getVideoEvaluations(
            currentVideo._id,
            "during_video",
          ).find(
            (evaluation) =>
              !triggeredEvaluationIds.has(evaluation._id) &&
              !isEvaluationCompleted(evaluation) &&
              currentSecond >= (evaluation.triggerTimeSeconds || 0),
          );

          if (dueEvaluation) {
            setTriggeredEvaluationIds((prev) => {
              const next = new Set(prev);
              next.add(dueEvaluation._id);
              return next;
            });
            openEvaluation(dueEvaluation);
          }
        }
      }
    },
    [
      activeEvaluation,
      currentVideo,
      getVideoEvaluations,
      isEvaluationCompleted,
      onVideoProgress,
      openEvaluation,
      triggeredEvaluationIds,
    ],
  );

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    if (currentVideo) {
      // Mark video as completed
      currentVideo.isCompleted = true;
      lastPersistedProgressRef.current[currentVideo._id] = {
        progress: 1,
        savedAt: Date.now(),
      };
      onVideoComplete?.(currentVideo._id);

      const blockingEvaluation = getBlockingEvaluation(
        currentVideo,
        "after_video",
      );
      if (blockingEvaluation) {
        openEvaluation(blockingEvaluation);
        return;
      }

      // Auto-advance to next video after a delay
      setTimeout(() => {
        const blockingBeforeEvaluation = getBlockingEvaluation(
          nextVideo,
          "before_video",
        );
        if (blockingBeforeEvaluation) {
          openEvaluation(blockingBeforeEvaluation);
          return;
        }

        if (nextVideo && !nextVideo.isLocked) {
          handleNextVideo();
        }
      }, 2000);
    }
  }, [
    currentVideo,
    getBlockingEvaluation,
    handleNextVideo,
    nextVideo,
    onVideoComplete,
    openEvaluation,
  ]);

  // Expand all sections initially
  React.useEffect(() => {
    if (course?.sections && Array.isArray(course.sections)) {
      const videos = course.sections.flatMap((section) => section.videos || []);
      const persistedProgress = Object.fromEntries(
        videos
          .filter((video) => video.progress && video.progress > 0)
          .map((video) => [video._id, video.progress || 0]),
      );

      setExpandedSections(
        new Set(course.sections.map((section) => section._id)),
      );
      setVideoProgress(persistedProgress);
      lastPersistedProgressRef.current = Object.fromEntries(
        videos.map((video) => [
          video._id,
          { progress: video.progress || 0, savedAt: Date.now() },
        ]),
      );

      setCurrentVideoId((previousVideoId) => {
        if (
          previousVideoId &&
          videos.some((video) => video._id === previousVideoId)
        ) {
          return previousVideoId;
        }

        const initialVideo = videos.find(
          (video) => video._id === initialVideoId && !video.isLocked,
        );
        const inProgressVideo = videos.find((video) => {
          const progress = video.progress || 0;
          return progress > 0 && progress < 1 && !video.isLocked;
        });
        const firstIncompleteVideo = videos.find(
          (video) => !video.isCompleted && !video.isLocked,
        );
        const firstUnlockedVideo = videos.find((video) => !video.isLocked);

        return (
          initialVideo?._id ||
          inProgressVideo?._id ||
          firstIncompleteVideo?._id ||
          firstUnlockedVideo?._id ||
          videos[0]?._id ||
          null
        );
      });
    }
  }, [course?.sections, initialVideoId]);

  React.useEffect(() => {
    const loadEvaluations = async () => {
      if (!course?._id || course.evaluations?.length) {
        setFetchedEvaluations([]);
        return;
      }

      try {
        const evaluations = await evaluationService.getCourseEvaluations(
          course._id,
        );
        setFetchedEvaluations(evaluations);
      } catch {
        setFetchedEvaluations([]);
      }
    };

    loadEvaluations();
  }, [course?._id, course.evaluations?.length]);

  React.useEffect(() => {
    setCompletedEvaluationIds(
      new Set(
        allEvaluations
          .filter((evaluation) => evaluation.isCompleted)
          .map((evaluation) => evaluation._id),
      ),
    );
  }, [allEvaluations]);

  const certificationEvaluations = allEvaluations.filter(
    (evaluation) => evaluation.kind === "certificacion",
  );
  const canOpenCertification =
    allVideos.length > 0 && allVideos.every((video) => video.isCompleted);
  const completedVideosCount = allVideos.filter((video) => video.isCompleted).length;
  const completedEvaluationsCount = allEvaluations.filter((evaluation) =>
    isEvaluationCompleted(evaluation),
  ).length;
  const remainingEvaluationsCount = Math.max(
    0,
    allEvaluations.length - completedEvaluationsCount,
  );
  const requiredRemainingEvaluationsCount = allEvaluations.filter(
    (evaluation) => evaluation.isRequired && !isEvaluationCompleted(evaluation),
  ).length;

  const handleEvaluationAnswerChange = (
    question: EvaluationQuestion,
    answer: string | boolean,
  ) => {
    const questionId = question._id || String(question.order);
    setEvaluationAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitEvaluation = async () => {
    if (!activeEvaluation) {
      return;
    }

    const missingAnswer = activeEvaluation.questions.some((question) => {
      const value = getQuestionAnswerValue(question);
      return value === undefined || value === "";
    });

    if (missingAnswer) {
      setEvaluationError("Responde todas las preguntas antes de continuar");
      return;
    }

    const answers: EvaluationAnswerInput[] = activeEvaluation.questions.map(
      (question) => ({
        questionId: question._id || String(question.order),
        answer: getQuestionAnswerValue(question) ?? "",
      }),
    );

    try {
      setIsSubmittingEvaluation(true);
      setEvaluationError(null);
      const result = await evaluationService.submitEvaluation(
        course._id,
        activeEvaluation._id,
        answers,
      );
      if (result.passed || !activeEvaluation.isRequired) {
        setCompletedEvaluationIds((prev) => {
          const next = new Set(prev);
          next.add(activeEvaluation._id);
          return next;
        });
      }
      setEvaluationResult(
        `Resultado: ${result.score}% (${result.correctAnswers}/${result.totalQuestions})`,
      );
    } catch {
      setEvaluationError("No se pudo enviar la evaluación");
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  const handleCloseEvaluation = () => {
    if (activeEvaluation?.isRequired && !completedEvaluationIds.has(activeEvaluation._id)) {
      setEvaluationError("Esta evaluación es obligatoria para continuar");
      return;
    }

    setActiveEvaluation(null);
    setEvaluationAnswers({});
    setEvaluationResult(null);
    setEvaluationError(null);
  };

  return (
    <Box
      className={className}
      sx={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Typography variant="h5" component="h1">
              {course.title}
            </Typography>
            {isPreviewMode && (
              <Chip
                icon={<Visibility />}
                label="Vista previa"
                size="small"
                variant="outlined"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}>
              <AccessTime fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {formatDuration(course.totalDuration)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <People fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {course.totalStudents.toLocaleString()} estudiantes
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Video Player Section */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Video Player */}
          <Box sx={{ flex: 1, p: 2, pb: 1, minHeight: 520 }}>
            {currentVideo?.url ? (
              <VideoPlayer
                key={currentVideo._id}
                url={currentVideo.url}
                title={currentVideo.title}
                initialProgress={
                  videoProgress[currentVideo._id] || currentVideo.progress || 0
                }
                onNext={handleNextVideo}
                onPrevious={handlePreviousVideo}
                hasNext={!!nextVideo && !nextVideo.isLocked}
                hasPrevious={!!previousVideo}
                onProgress={handleVideoProgress}
                onEnded={handleVideoEnd}
                autoPlay={true}
                fullScreen={false}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: 400,
                  bgcolor: "grey.200",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 1,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  No hay video seleccionado
                </Typography>
              </Box>
            )}
          </Box>

          {/* Video Info */}
          <Paper sx={{ m: 2, mt: 0, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {currentVideo?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {currentVideo?.description}
            </Typography>

            {currentVideo &&
              getVideoEvaluations(currentVideo._id, "before_video")
                .concat(getVideoEvaluations(currentVideo._id, "during_video"))
                .concat(getVideoEvaluations(currentVideo._id, "after_video"))
                .length > 0 && (
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {getVideoEvaluations(currentVideo._id, "before_video")
                    .concat(getVideoEvaluations(currentVideo._id, "during_video"))
                    .concat(getVideoEvaluations(currentVideo._id, "after_video"))
                    .map((evaluation) => (
                      <Chip
                        key={evaluation._id}
                        label={`${evaluation.title}${evaluation.isRequired ? " (obligatoria)" : ""}`}
                        color={
                          isEvaluationCompleted(evaluation)
                            ? "success"
                            : evaluation.isRequired
                              ? "error"
                              : "default"
                        }
                        variant="outlined"
                        size="small"
                        onClick={() => openEvaluation(evaluation)}
                      />
                    ))}
                </Box>
              )}

            {/* Navigation Buttons */}
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<KeyboardArrowUp />}
                onClick={handlePreviousVideo}
                disabled={!previousVideo}
                fullWidth
              >
                Video anterior
              </Button>
              <Button
                variant="contained"
                endIcon={<KeyboardArrowDown />}
                onClick={handleNextVideo}
                disabled={!nextVideo || nextVideo.isLocked}
                fullWidth
              >
                Siguiente video
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Course Content Sidebar */}
        <Paper
          elevation={1}
          sx={{
            width: 400,
            borderLeft: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "background.paper",
          }}
        >
          {/* Sidebar Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="h6">
                {sidebarView === "resources"
                  ? "Recursos del curso"
                  : "Contenido del curso"}
              </Typography>
              <Box display="flex" gap={1}>
                <IconButton
                  size="small"
                  color={isSearchOpen ? "primary" : "default"}
                  onClick={() => setIsSearchOpen((prev) => !prev)}
                >
                  <Search />
                </IconButton>
                <IconButton
                  size="small"
                  color={showStatsPanel ? "primary" : "default"}
                  onClick={() => setShowStatsPanel((prev) => !prev)}
                >
                  <Assessment />
                </IconButton>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                {sidebarView === "resources"
                  ? `${filteredResources.length} de ${allResources.length} recursos`
                  : `${completedVideosCount} de ${allVideos.length} lecciones completadas • ${allResources.length} recursos`}
              </Typography>
            </Box>
            {(isSearchOpen || sidebarView === "resources") && (
              <TextField
                fullWidth
                size="small"
                placeholder={
                  sidebarView === "resources"
                    ? "Buscar recursos..."
                    : "Buscar lecciones, recursos o evaluaciones..."
                }
                value={
                  sidebarView === "resources" ? resourceSearchTerm : searchTerm
                }
                onChange={(event) =>
                  sidebarView === "resources"
                    ? setResourceSearchTerm(event.target.value)
                    : setSearchTerm(event.target.value)
                }
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: <Search fontSize="small" sx={{ mr: 1 }} />,
                }}
              />
            )}
            {showStatsPanel && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Progreso general
                  </Typography>
                  <Typography variant="subtitle2" color="primary">
                    {Math.round(courseProgress)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={courseProgress}
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                />
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Lecciones completadas
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {completedVideosCount}/{allVideos.length}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Evaluaciones completadas
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {completedEvaluationsCount}/{allEvaluations.length}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Evaluaciones restantes
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {remainingEvaluationsCount}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Obligatorias pendientes
                    </Typography>
                    <Typography
                      variant="body2"
                      color={
                        requiredRemainingEvaluationsCount > 0
                          ? "error"
                          : "success.main"
                      }
                      sx={{ fontWeight: 600 }}
                    >
                      {requiredRemainingEvaluationsCount}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>

          {/* Course Sections */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {sidebarView === "resources" ? (
              filteredResources.length > 0 ? (
                resourceTypeOrder.map((type) => {
                  const resources = resourcesByType[type] || [];

                  if (resources.length === 0) {
                    return null;
                  }

                  return (
                    <Box
                      key={type}
                      sx={{ borderBottom: 1, borderColor: "divider" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 2,
                          py: 1.5,
                          bgcolor: "action.hover",
                        }}
                      >
                        {getResourceIcon({
                          _id: type,
                          title: type,
                          url: "",
                          type,
                          order: 0,
                        })}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {getResourceTypeLabel(type)}
                        </Typography>
                        <Chip
                          label={resources.length}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <List dense sx={{ p: 0 }}>
                        {resources.map((resource) => (
                          <ListItem key={resource._id} disablePadding>
                            <ListItemButton
                              onClick={() => handleResourceDownload(resource)}
                              disabled={resource.isLocked || !resource.url}
                              sx={{ px: 2 }}
                            >
                              <ListItemIcon sx={{ minWidth: 38 }}>
                                {getResourceIcon(resource)}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: resource.isLocked
                                        ? "text.disabled"
                                        : "text.primary",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {resource.title}
                                  </Typography>
                                }
                                secondary={
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                    flexWrap="wrap"
                                  >
                                    {resource.fileName && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {resource.fileName}
                                      </Typography>
                                    )}
                                    {resource.description && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {resource.description}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                                secondaryTypographyProps={{ component: "div" }}
                              />
                              {!resource.isLocked && resource.url && (
                                <Download fontSize="small" color="action" />
                              )}
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {normalizedResourceSearchTerm
                      ? "No hay recursos para tu búsqueda"
                      : "Este curso no tiene recursos disponibles"}
                  </Typography>
                </Box>
              )
            ) : visibleSections.length > 0 ? (
              visibleSections.map((section) => {
                const sectionMatches = matchesSearch(
                  section.title,
                  section.description,
                );
                const visibleVideos = (section.videos || []).filter(
                  (video) =>
                    sectionMatches ||
                    matchesSearch(video.title, video.description),
                );
                const visibleResources = (section.resources || []).filter(
                  (resource) =>
                    sectionMatches ||
                    matchesSearch(
                      resource.title,
                      resource.description,
                      resource.fileName,
                    ),
                );

                return (
                  <Accordion
                    key={section._id}
                    expanded={expandedSections.has(section._id)}
                    onChange={() => handleSectionToggle(section._id)}
                    sx={{
                      "&:before": { display: "none" },
                      boxShadow: "none",
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      "& .MuiAccordionSummary-content": {
                        margin: 0,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        width: "100%",
                      }}
                    >
                      <VideoLibrary fontSize="small" color="action" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">
                          {section.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(section.videos || []).length} lecciones •{" "}
                          {(section.resources || []).length} recursos •{" "}
                          {
                            allEvaluations.filter(
                              (evaluation) => evaluation.sectionId === section._id,
                            ).length
                          }{" "}
                          evaluaciones •{" "}
                          {formatDuration(
                            (section.videos || []).reduce(
                              (sum, v) => sum + v.duration,
                              0,
                            ),
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List dense sx={{ p: 0 }}>
                      {visibleVideos.map((video) => {
                        const isCurrentVideo = video._id === currentVideo?._id;
                        const progress = videoProgress[video._id] || 0;

                        return (
                          <ListItem
                            key={video._id}
                            disablePadding
                            sx={{
                              backgroundColor: isCurrentVideo
                                ? "action.selected"
                                : "transparent",
                              "&:hover": {
                                backgroundColor: "action.hover",
                              },
                            }}
                          >
                            <ListItemButton
                              onClick={() => handleVideoSelect(video)}
                              disabled={video.isLocked}
                              sx={{ pl: 4 }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {video.isLocked ? (
                                  <Lock fontSize="small" color="action" />
                                ) : video.isCompleted ? (
                                  <CheckCircle
                                    fontSize="small"
                                    color="success"
                                  />
                                ) : (
                                  <PlayArrow fontSize="small" color="action" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: isCurrentVideo ? 600 : 400,
                                      color: video.isLocked
                                        ? "text.disabled"
                                        : "text.primary",
                                    }}
                                  >
                                    {video.title}
                                  </Typography>
                                }
                                secondaryTypographyProps={{ component: "div" }}
                                secondary={
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {formatDuration(video.duration)}
                                    </Typography>
                                    {progress > 0 && !video.isCompleted && (
                                      <LinearProgress
                                        variant="determinate"
                                        value={progress * 100}
                                        sx={{ flex: 1, height: 2 }}
                                      />
                                    )}
                                  </Box>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                    {visibleResources.length > 0 && (
                      <Box sx={{ borderTop: 1, borderColor: "divider" }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "block",
                            px: 4,
                            pt: 1.5,
                            pb: 0.5,
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          Recursos descargables
                        </Typography>
                        <List dense sx={{ p: 0 }}>
                          {visibleResources.map((resource) => (
                            <ListItem
                              key={resource._id}
                              disablePadding
                              sx={{
                                "&:hover": {
                                  backgroundColor: "action.hover",
                                },
                              }}
                            >
                              <ListItemButton
                                onClick={() => handleResourceDownload(resource)}
                                disabled={resource.isLocked || !resource.url}
                                sx={{ pl: 4 }}
                              >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  {getResourceIcon(resource)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: resource.isLocked
                                          ? "text.disabled"
                                          : "text.primary",
                                      }}
                                    >
                                      {resource.title}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                      flexWrap="wrap"
                                    >
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {getResourceTypeLabel(resource.type)}
                                      </Typography>
                                      {resource.description && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {resource.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  secondaryTypographyProps={{ component: "div" }}
                                />
                                {!resource.isLocked && resource.url && (
                                  <Download
                                    fontSize="small"
                                    color="action"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </AccordionDetails>
                  </Accordion>
                );
              })
            ) : (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {normalizedSearchTerm
                    ? "No hay resultados para tu búsqueda"
                    : "No hay contenido disponible para este curso"}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Sidebar Footer */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            {certificationEvaluations.length > 0 && (
              <Button
                variant="contained"
                startIcon={<Assessment />}
                fullWidth
                size="small"
                sx={{ mb: 1 }}
                disabled={!canOpenCertification}
                onClick={() => openEvaluation(certificationEvaluations[0])}
              >
                {canOpenCertification
                  ? "Evaluación de certificación"
                  : "Certificación bloqueada"}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={sidebarView === "resources" ? <VideoLibrary /> : <Book />}
              fullWidth
              size="small"
              disabled={allResources.length === 0}
              onClick={() =>
                setSidebarView((currentView) =>
                  currentView === "resources" ? "content" : "resources",
                )
              }
            >
              {sidebarView === "resources"
                ? "Contenido del curso"
                : `Recursos del curso (${allResources.length})`}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={!!activeEvaluation}
        onClose={handleCloseEvaluation}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{activeEvaluation?.title}</DialogTitle>
        <DialogContent>
          {activeEvaluation?.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {activeEvaluation.description}
            </Typography>
          )}
          {activeEvaluation?.isRequired && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Esta evaluación es obligatoria para continuar.
            </Alert>
          )}
          {evaluationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {evaluationError}
            </Alert>
          )}
          {evaluationResult && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {evaluationResult}
            </Alert>
          )}
          <Box display="flex" flexDirection="column" gap={2}>
            {activeEvaluation?.questions.map((question, index) => (
              <Box key={question._id || question.order}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  {index + 1}. {question.prompt}
                </Typography>
                {question.type === "multiple_choice" && (
                  <TextField
                    select
                    fullWidth
                    label="Selecciona una respuesta"
                    value={String(getQuestionAnswerValue(question) || "")}
                    onChange={(event) =>
                      handleEvaluationAnswerChange(question, event.target.value)
                    }
                    disabled={!!evaluationResult}
                  >
                    {(question.options || []).map((option, optionIndex) => (
                      <MenuItem key={option._id || optionIndex} value={option.text}>
                        {option.text}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                {question.type === "input" && (
                  <TextField
                    fullWidth
                    label="Tu respuesta"
                    value={String(getQuestionAnswerValue(question) || "")}
                    onChange={(event) =>
                      handleEvaluationAnswerChange(question, event.target.value)
                    }
                    disabled={!!evaluationResult}
                  />
                )}
                {question.type === "true_false" && (
                  <TextField
                    select
                    fullWidth
                    label="Selecciona una respuesta"
                    value={String(getQuestionAnswerValue(question) ?? "")}
                    onChange={(event) =>
                      handleEvaluationAnswerChange(
                        question,
                        event.target.value === "true",
                      )
                    }
                    disabled={!!evaluationResult}
                  >
                    <MenuItem value="true">Verdadero</MenuItem>
                    <MenuItem value="false">Falso</MenuItem>
                  </TextField>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEvaluation} disabled={isSubmittingEvaluation}>
            {evaluationResult ? "Cerrar" : "Cancelar"}
          </Button>
          {!evaluationResult && (
            <Button
              variant="contained"
              onClick={handleSubmitEvaluation}
              disabled={isSubmittingEvaluation}
            >
              {isSubmittingEvaluation ? "Enviando..." : "Enviar Evaluación"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
