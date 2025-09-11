'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Dashboard,
  PersonAdd,
  People,
  VideoLibrary,
  MonetizationOn,
} from '@mui/icons-material';

interface VideoStats {
  videoId: string;
  title: string;
  subscribers: number;
  views: number;
  revenue: number;
}

interface TeacherStats {
  totalUsers: number;
  totalSubscribers: number;
  totalRevenue: number;
  videoStats: VideoStats[];
}

export const TeacherDashboard: React.FC = () => {
  const [teacherStats, setTeacherStats] = useState<TeacherStats>({
    totalUsers: 0,
    totalSubscribers: 0,
    totalRevenue: 0,
    videoStats: []
  });

  useEffect(() => {
    // Simular carga de estadísticas del maestro (en producción vendría del backend)
    setTeacherStats({
      totalUsers: 1247,
      totalSubscribers: 892,
      totalRevenue: 45680,
      videoStats: [
        {
          videoId: '1',
          title: 'Introducción al Álgebra',
          subscribers: 234,
          views: 1847,
          revenue: 11700
        },
        {
          videoId: '2',
          title: 'Geometría Básica',
          subscribers: 189,
          views: 1523,
          revenue: 9450
        },
        {
          videoId: '3',
          title: 'Cálculo Diferencial',
          subscribers: 156,
          views: 1298,
          revenue: 7800
        },
        {
          videoId: '4',
          title: 'Trigonometría Avanzada',
          subscribers: 143,
          views: 1124,
          revenue: 7150
        },
        {
          videoId: '5',
          title: 'Estadística y Probabilidad',
          subscribers: 98,
          views: 876,
          revenue: 4900
        }
      ]
    });
  }, []);

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Dashboard color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          Dashboard del Maestro
        </Typography>
      </Box>

      {/* Estadísticas Generales */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                <PersonAdd sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {teacherStats.totalUsers.toLocaleString()}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Usuarios Registrados
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: 'success.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                <People sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {teacherStats.totalSubscribers.toLocaleString()}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Suscriptores Totales
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: 'warning.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                <MonetizationOn sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  ${teacherStats.totalRevenue.toLocaleString()}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Ingresos Totales
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Estadísticas por Video */}
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <VideoLibrary color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
            Estadísticas por Video
          </Typography>
        </Box>
        
        <Box display="flex" flexDirection="column" gap={2}>
          {teacherStats.videoStats.map((video) => (
            <Card key={video.videoId} sx={{ 
              border: '1px solid',
              borderColor: 'grey.200',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: 2
              }
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Box flex={1} minWidth={200}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {video.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Video ID: {video.videoId}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" gap={4} flexWrap="wrap">
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {video.subscribers}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Suscriptores
                      </Typography>
                    </Box>
                    
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {video.views.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Visualizaciones
                      </Typography>
                    </Box>
                    
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                        ${video.revenue.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ingresos
                      </Typography>
                    </Box>
                    
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                        {((video.subscribers / video.views) * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Conversión
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};
