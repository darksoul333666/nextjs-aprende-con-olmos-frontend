import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Chip,
  Divider,
  Avatar,
  Rating,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  Badge,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  CheckCircle,
  Lock,
  ExpandMore,
  Star,
  People,
  AccessTime,
  School,
  Book,
  VideoLibrary,
  Notes,
  Chat,
  Announcement,
  Assessment,
  Search,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { VideoPlayer } from '../VideoPlayer/components/VideoPlayer';
import { Course, Video, Section } from './types';

interface CoursePlayerProps {
  course: Course;
  onVideoComplete?: (videoId: string) => void;
  onVideoProgress?: (videoId: string, progress: number) => void;
  className?: string;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({
  course,
  onVideoComplete,
  onVideoProgress,
  className,
}) => {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});

  // Get all videos from all sections
  const allVideos = useMemo(() => {
    return course.sections.flatMap(section => section.videos);
  }, [course.sections]);

  // Get current video
  const currentVideo = useMemo(() => {
    if (!currentVideoId) {
      return allVideos[0];
    }
    return allVideos.find(video => video.id === currentVideoId) || allVideos[0];
  }, [currentVideoId, allVideos]);

  // Get current video index
  const currentVideoIndex = useMemo(() => {
    return allVideos.findIndex(video => video.id === currentVideo?.id);
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
    const completedVideos = allVideos.filter(video => video.isCompleted).length;
    return (completedVideos / allVideos.length) * 100;
  }, [allVideos]);

  // Calculate total watched time
  const totalWatchedTime = useMemo(() => {
    return allVideos.reduce((total, video) => {
      const progress = videoProgress[video.id] || 0;
      return total + (video.duration * progress);
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

  // Handle video selection
  const handleVideoSelect = useCallback((video: Video) => {
    if (video.isLocked) {
      return; // Show purchase prompt or unlock message
    }
    setCurrentVideoId(video.id);
  }, []);

  // Handle section expansion
  const handleSectionToggle = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
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
      setCurrentVideoId(nextVideo.id);
    }
  }, [nextVideo]);

  // Handle previous video
  const handlePreviousVideo = useCallback(() => {
    if (previousVideo) {
      setCurrentVideoId(previousVideo.id);
    }
  }, [previousVideo]);

  // Handle video progress
  const handleVideoProgress = useCallback((progress: number) => {
    if (currentVideo) {
      setVideoProgress(prev => ({
        ...prev,
        [currentVideo.id]: progress,
      }));
      onVideoProgress?.(currentVideo.id, progress);
    }
  }, [currentVideo, onVideoProgress]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    if (currentVideo) {
      // Mark video as completed
      currentVideo.isCompleted = true;
      onVideoComplete?.(currentVideo.id);
      
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
    setExpandedSections(new Set(course.sections.map(section => section.id)));
  }, [course.sections]);

  return (
    <Box className={className} sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" component="h1" gutterBottom>
              {course.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={1}>
                <Rating value={course.rating} precision={0.1} size="small" readOnly />
                <Typography variant="body2" color="text.secondary">
                  {course.rating} ({course.totalStudents.toLocaleString()} estudiantes)
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <AccessTime fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {formatDuration(course.totalDuration)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <School fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {course.instructor}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<Notes />}
                size="small"
              >
                Notas
              </Button>
              <Button
                variant="outlined"
                startIcon={<Chat />}
                size="small"
              >
                Q&A
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video Player Section */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Video Player */}
          <Box sx={{ flex: 1, p: 2, pb: 1 }}>
            <VideoPlayer
              url={currentVideo?.url || ''}
              title={currentVideo?.title}
              onNext={handleNextVideo}
              onPrevious={handlePreviousVideo}
              hasNext={!!nextVideo && !nextVideo.isLocked}
              hasPrevious={!!previousVideo}
              onProgress={handleVideoProgress}
              onEnded={handleVideoEnd}
              autoPlay={false}
              fullScreen={false}
            />
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
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
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.paper'
          }}
        >
          {/* Sidebar Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">
                Contenido del curso
              </Typography>
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
                {allVideos.filter(v => v.isCompleted).length} de {allVideos.length} lecciones completadas
              </Typography>
            </Box>
          </Box>

          {/* Course Sections */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {course.sections.map((section) => (
              <Accordion
                key={section.id}
                expanded={expandedSections.has(section.id)}
                onChange={() => handleSectionToggle(section.id)}
                sx={{
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      margin: 0,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <VideoLibrary fontSize="small" color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">
                        {section.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {section.videos.length} lecciones • {formatDuration(section.videos.reduce((sum, v) => sum + v.duration, 0))}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List dense sx={{ p: 0 }}>
                    {section.videos.map((video) => {
                      const isCurrentVideo = video.id === currentVideo?.id;
                      const progress = videoProgress[video.id] || 0;
                      
                      return (
                        <ListItem
                          key={video.id}
                          disablePadding
                          sx={{
                            backgroundColor: isCurrentVideo ? 'action.selected' : 'transparent',
                            '&:hover': {
                              backgroundColor: 'action.hover',
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
                                <CheckCircle fontSize="small" color="success" />
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
                                    color: video.isLocked ? 'text.disabled' : 'text.primary',
                                  }}
                                >
                                  {video.title}
                                </Typography>
                              }
                              secondary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="caption" color="text.secondary">
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
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          {/* Sidebar Footer */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="outlined"
              startIcon={<Book />}
              fullWidth
              size="small"
            >
              Recursos del curso
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
