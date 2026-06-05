import React, { useState, useMemo, useCallback } from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Chip,
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

interface CoursePlayerProps {
  course: Course;
  isPreviewMode?: boolean;
  onVideoComplete?: (videoId: string) => void;
  onVideoProgress?: (videoId: string, progress: number) => void;
  className?: string;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({
  course,
  isPreviewMode = false,
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

  // Get current video
  const currentVideo = useMemo(() => {
    if (!currentVideoId) {
      return allVideos[0];
    }
    return (
      allVideos.find((video) => video._id === currentVideoId) || allVideos[0]
    );
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

  const getResourceTypeLabel = (type: CourseResourceType) => {
    const labels: Record<CourseResourceType, string> = {
      powerpoint: "PowerPoint",
      docx: "Documento",
      pdf: "PDF",
      image: "Imagen",
    };

    return labels[type];
  };

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

  // Handle video selection
  const handleVideoSelect = useCallback((video: Video) => {
    if (video.isLocked) {
      return; // Show purchase prompt or unlock message
    }
    setCurrentVideoId(video._id);
  }, []);

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
    if (nextVideo && !nextVideo.isLocked) {
      setCurrentVideoId(nextVideo._id);
    }
  }, [nextVideo]);

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
        onVideoProgress?.(currentVideo._id, progress);
      }
    },
    [currentVideo, onVideoProgress],
  );

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    if (currentVideo) {
      // Mark video as completed
      currentVideo.isCompleted = true;
      onVideoComplete?.(currentVideo._id);

      // Auto-advance to next video after a delay
      setTimeout(() => {
        if (nextVideo && !nextVideo.isLocked) {
          handleNextVideo();
        }
      }, 2000);
    }
  }, [currentVideo, nextVideo, handleNextVideo, onVideoComplete]);

  // Expand all sections initially
  React.useEffect(() => {
    if (course?.sections && Array.isArray(course.sections)) {
      setExpandedSections(
        new Set(course.sections.map((section) => section._id)),
      );
    }
  }, [course?.sections]);

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
                url={currentVideo.url}
                title={currentVideo.title}
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

            {/* Progress Bar */}
            <Box sx={{ mb: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="body2" color="text.secondary">
                  Progreso del curso
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(courseProgress)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={courseProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

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
              <Typography variant="h6">Contenido del curso</Typography>
              <Box display="flex" gap={1}>
                <IconButton size="small">
                  <Search />
                </IconButton>
                <IconButton size="small">
                  <Assessment />
                </IconButton>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                {allVideos.filter((v) => v.isCompleted).length} de{" "}
                {allVideos.length} lecciones completadas •{" "}
                {allResources.length} recursos
              </Typography>
            </Box>
          </Box>

          {/* Course Sections */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {course?.sections && Array.isArray(course.sections) ? (
              course.sections.map((section) => (
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
                      {(section.videos || []).map((video) => {
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
                    {(section.resources || []).length > 0 && (
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
                          {(section.resources || []).map((resource) => (
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
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No hay contenido disponible para este curso
                </Typography>
              </Box>
            )}
          </Box>

          {/* Sidebar Footer */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button
              variant="outlined"
              startIcon={<Book />}
              fullWidth
              size="small"
              disabled={allResources.length === 0}
            >
              Recursos del curso ({allResources.length})
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
