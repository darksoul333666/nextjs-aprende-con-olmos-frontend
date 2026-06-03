import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Tooltip,
  Fade,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  SkipNext,
  SkipPrevious,
} from "@mui/icons-material";
import screenfull from "screenfull";
import ReactPlayer from "react-player";

interface VideoPlayerProps {
  url: string;
  fullScreen?: boolean;
  title?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
}

type MediaPlayerElement = HTMLVideoElement & {
  buffered?: TimeRanges;
};

const PlayerComponent = ReactPlayer as React.ElementType;

// Helper function to check if URL is YouTube
const isYouTubeUrl = (url: string): boolean => {
  return url.includes("youtube.com") || url.includes("youtu.be");
};

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  fullScreen = false,
  title,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  onProgress,
  onEnded,
  autoPlay = false,
  showControls = true,
  className,
}) => {
  // Debug: Log video URL
  const videoRef = useRef<MediaPlayerElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle SSR - only render after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Monitor URL changes
  useEffect(() => {
    if (url) {
      setIsLoading(true);
      setIsSeeking(false); // Reset seeking state when URL changes
      setPlaying(autoPlay);
    }
  }, [autoPlay, url]);

  // Handle buffering using standard ReactPlayer events
  const handleBuffer = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleBufferEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    setPlaying(!playing);
  }, [playing]);

  // Handle seek
  const handleSeek = useCallback((_: Event, newValue: number | number[]) => {
    const seekTo = newValue as number;

    // Validar que el valor sea un número finito
    if (!isFinite(seekTo) || isNaN(seekTo)) {
      return;
    }

    setIsSeeking(true);

    if (videoRef.current && videoRef.current.duration) {
      // Asegurar que el valor esté dentro del rango válido
      const clampedValue = Math.max(
        0,
        Math.min(seekTo, videoRef.current.duration),
      );
      videoRef.current.currentTime = clampedValue;
    }
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      const newVolume = newValue as number;
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
      }
      if (newVolume === 0) {
        setMuted(true);
      } else if (muted) {
        setMuted(false);
      }
    },
    [muted],
  );

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  }, [muted]);

  // Handle fullscreen
  const handleFullscreen = useCallback(() => {
    if (screenfull.isEnabled && containerRef.current) {
      screenfull.toggle(containerRef.current);
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  // Handle loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  // Handle ended
  const handleEnded = useCallback(() => {
    setPlaying(false);
    onEnded?.();
  }, [onEnded]);

  // Handle mouse movement for controls visibility
  const handleMouseMove = useCallback(() => {
    setShowControlsOverlay(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      if (!isHovering) {
        setShowControlsOverlay(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  }, [controlsTimeout, isHovering]);

  // Handle mouse enter/leave
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    setShowControlsOverlay(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      setShowControlsOverlay(false);
    }, 1000);
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.code) {
        case "Space":
          event.preventDefault();
          handlePlayPause();
          break;
        case "ArrowRight":
          event.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(currentTime + 10, duration);
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(currentTime - 10, 0);
          }
          break;
        case "KeyM":
          event.preventDefault();
          handleMuteToggle();
          break;
        case "KeyF":
          event.preventDefault();
          handleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [
    handlePlayPause,
    handleMuteToggle,
    handleFullscreen,
    currentTime,
    duration,
  ]);

  // Set initial volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        width: "100%",
        maxWidth: "100%",
        aspectRatio: "16 / 9",
        position: "relative",
        backgroundColor: "#000",
        borderRadius: fullScreen ? 0 : 2,
        overflow: "hidden",
        cursor: "pointer",
        "&:hover .controls-overlay": {
          opacity: 1,
        },
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isMounted ? (
        <div>
          {React.createElement(PlayerComponent, {
            ref: videoRef,
            width: "100%",
            src: url,
            height: "100%",
            playing: playing,
            muted: muted,
            volume: volume,
            onPlay: () => {
              setPlaying(true);
              setIsLoading(false);
            },
            onPause: () => {
              setPlaying(false);
            },
            onTimeUpdate: () => {
              const player = videoRef.current;
              if (!player) return;

              if (!player.duration) return;

              setCurrentTime(player.currentTime);
              onProgress?.(player.currentTime / player.duration);

              // Si estábamos buscando, terminar el estado de búsqueda
              if (isSeeking) {
                setIsSeeking(false);
              }
            },
            onDurationChange: () => {
              const player = videoRef.current;
              if (!player) return;

              setDuration(player.duration);
            },
            onProgress: () => {
              const player = videoRef.current;
              if (!player || !player.buffered?.length) return;

              // No necesitamos actualizar el estado aquí, onTimeUpdate se encarga
            },
            onEnded: () => {
              setPlaying(false);
              handleEnded();
            },
            onError: () => {
              setIsLoading(false);
            },
            onWaiting: () => {
              // Solo mostrar loading si no estamos buscando
              if (!isSeeking) {
                setIsLoading(true);
              }
            },
            onCanPlay: () => {
              setIsLoading(false);
            },
          })}
        </div>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            backgroundColor: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="white">
            Cargando...
          </Typography>
        </Box>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.7)",
            zIndex: 1,
          }}
        >
          <LinearProgress sx={{ width: "60%" }} />
        </Box>
      )}

      {/* Center play button overlay - only for non-YouTube videos */}
      {!playing && showControls && !isYouTubeUrl(url) && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          }}
        >
          <IconButton
            onClick={handlePlayPause}
            sx={{
              bgcolor: "rgba(0,0,0,0.7)",
              color: "white",
              width: 80,
              height: 80,
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.8)",
              },
            }}
          >
            <PlayArrow sx={{ fontSize: 40 }} />
          </IconButton>
        </Box>
      )}

      {/* Custom Controls Overlay - only for non-YouTube videos */}
      {showControls && !isYouTubeUrl(url) && (
        <Fade in={showControlsOverlay}>
          <Box
            className="controls-overlay"
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
              color: "white",
              px: 2,
              py: 1,
              zIndex: 3,
              opacity: 0,
              transition: "opacity 0.3s ease",
            }}
          >
            {/* Progress bar */}
            <Box sx={{ mb: 1 }}>
              <Slider
                min={0}
                max={Math.max(duration, 1)}
                step={0.1}
                value={isFinite(currentTime) ? Math.max(currentTime, 0) : 0}
                onChange={handleSeek}
                sx={{
                  color: "rgba(41, 50, 218, 0.7)",
                  "& .MuiSlider-track": {
                    backgroundColor: "rgba(41, 50, 218, 0.7)",
                  },
                  "& .MuiSlider-rail": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                  },
                  "& .MuiSlider-thumb": {
                    width: 12,
                    height: 12,
                    backgroundColor: "rgba(41, 50, 218, 0.7)",
                    "&:hover": {
                      boxShadow: "0 0 0 8px rgba(41, 50, 218, 0.16)",
                    },
                  },
                }}
              />
            </Box>

            {/* Controls row */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center" gap={1}>
                {/* Previous button */}
                {hasPrevious && (
                  <Tooltip title="Video anterior">
                    <IconButton
                      onClick={onPrevious}
                      sx={{ color: "white", opacity: 0.8 }}
                    >
                      <SkipPrevious />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Play/Pause button */}
                <Tooltip title={playing ? "Pausar" : "Reproducir"}>
                  <IconButton onClick={handlePlayPause} sx={{ color: "white" }}>
                    {playing ? <Pause /> : <PlayArrow />}
                  </IconButton>
                </Tooltip>

                {/* Next button */}
                {hasNext && (
                  <Tooltip title="Siguiente video">
                    <IconButton
                      onClick={onNext}
                      sx={{ color: "white", opacity: 0.8 }}
                    >
                      <SkipNext />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Volume controls */}
                <Box display="flex" alignItems="center" gap={1}>
                  <Tooltip title={muted ? "Activar sonido" : "Silenciar"}>
                    <IconButton
                      onClick={handleMuteToggle}
                      sx={{ color: "white" }}
                    >
                      {muted ? <VolumeOff /> : <VolumeUp />}
                    </IconButton>
                  </Tooltip>

                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    sx={{
                      width: 80,
                      color: "rgba(41, 50, 218, 0.7)",
                      "& .MuiSlider-track": {
                        backgroundColor: "rgba(41, 50, 218, 0.7)",
                      },
                      "& .MuiSlider-rail": {
                        backgroundColor: "rgba(255,255,255,0.3)",
                      },
                      "& .MuiSlider-thumb": {
                        backgroundColor: "rgba(41, 50, 218, 0.7)",
                        "&:hover": {
                          boxShadow: "0 0 0 8px rgba(41, 50, 218, 0.16)",
                        },
                      },
                    }}
                  />
                </Box>

                {/* Time display */}
                <Typography variant="caption" sx={{ ml: 2, opacity: 0.8 }}>
                  {formatTime(isNaN(currentTime) ? 0 : currentTime)} /{" "}
                  {formatTime(isNaN(duration) ? 0 : duration)}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                {/* Additional controls */}
                <Tooltip title="Pantalla completa">
                  <IconButton
                    onClick={handleFullscreen}
                    sx={{ color: "white" }}
                  >
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Title */}
            {title && (
              <Typography
                variant="subtitle2"
                sx={{
                  mt: 1,
                  opacity: 0.9,
                  fontWeight: 500,
                }}
              >
                {title}
              </Typography>
            )}
          </Box>
        </Fade>
      )}

      {/* Keyboard shortcuts hint - only for non-YouTube videos */}
      {showControlsOverlay && !isYouTubeUrl(url) && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 4,
          }}
        >
          <Chip
            label="Espacio: Reproducir/Pausar | ←→: Avanzar/Retroceder | M: Mute | F: Fullscreen"
            size="small"
            sx={
              isFullscreen
                ? {
                    bgcolor: "rgba(41, 50, 218, 0.7)",
                    padding: "2rem",
                    color: "white",
                    fontSize: "1.7rem",
                  }
                : {
                    bgcolor: "rgba(41, 50, 218, 0.7)",
                    padding: "0.5rem 1rem",
                    color: "white",
                    fontSize: ".7rem",
                  }
            }
          />
        </Box>
      )}
    </Box>
  );
};
