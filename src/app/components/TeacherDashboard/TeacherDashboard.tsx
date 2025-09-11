'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Dashboard,
  PersonAdd,
  People,
  VideoLibrary,
  MonetizationOn,
  Refresh,
  TrendingUp,
  School,
  Edit,
} from '@mui/icons-material';
import { teacherStatsService, TeacherDashboardData, VideoStat } from '../../services/teacherStatsService';

export const TeacherDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await teacherStatsService.getDashboardStats();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('No se pudieron cargar las estadísticas del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 6 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData} startIcon={<Refresh />}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return null;
  }

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
                  {dashboardData.kpis.totalUsers.toLocaleString()}
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
                  {dashboardData.kpis.totalSubscribers.toLocaleString()}
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
                  ${dashboardData.kpis.totalIncome.toLocaleString()}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Ingresos Totales
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Estadísticas de Cursos y Crecimiento */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1, bgcolor: 'info.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                <School sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {dashboardData.courseStats.totalCourses}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Cursos Totales
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {dashboardData.courseStats.publishedCourses} publicados, {dashboardData.courseStats.draftCourses} borradores
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: 'secondary.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                <TrendingUp sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  +{dashboardData.growth.recentUsers}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Usuarios Recientes
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {dashboardData.growth.recentPurchases} compras, ${dashboardData.growth.recentIncome} ingresos
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
          {dashboardData.videoStats.map((video) => (
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {video.courseTitle} - {video.sectionTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {video.videoId}
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
                        ${video.income.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ingresos
                      </Typography>
                    </Box>
                    
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                        {video.conversion.toFixed(1)}%
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
