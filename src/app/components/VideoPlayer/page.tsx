'use client';

import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { CoursePlayer, mockCourse } from '../CoursePlayer';

export default function VideoPlayerPage() {
  const handleVideoComplete = (videoId: string) => {
    console.log('Video completed:', videoId);
  };

  const handleVideoProgress = (videoId: string, progress: number) => {
    console.log('Video progress:', videoId, progress);
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ height: '100vh' }}>
      <CoursePlayer
        course={mockCourse}
        onVideoComplete={handleVideoComplete}
        onVideoProgress={handleVideoProgress}
      />
    </Container>
  );
}
