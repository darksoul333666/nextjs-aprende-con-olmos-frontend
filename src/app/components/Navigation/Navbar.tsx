'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Box,
  IconButton,
  Badge,
  Divider,
} from '@mui/material';
import {
  School,
  Person,
  Book,
  Home,
  ContactSupport,
  ExitToApp,
  Notifications,
  Login,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  currentPage?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage = 'home',
}) => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    router.push('/');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <AppBar position="static" elevation={1} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
      <Toolbar>
        {/* Logo y Título */}
        <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
          <School sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Aprende con Olmos
          </Typography>
        </Box>

        {/* Navegación Principal */}
        <Box display="flex" gap={1} sx={{ mr: 2 }}>
          <Button
            color={currentPage === 'home' ? 'primary' : 'inherit'}
            onClick={() => handleNavigation('/')}
            startIcon={<Home />}
          >
            Inicio
          </Button>
          <Button
            color={currentPage === 'courses' ? 'primary' : 'inherit'}
            onClick={() => handleNavigation('/courses')}
            startIcon={<Book />}
          >
            Cursos
          </Button>
          {user?.role === 'maestro' ? (
            <Button
              color={currentPage === 'teacher' ? 'primary' : 'inherit'}
              onClick={() => handleNavigation('/teacher')}
              startIcon={<Person />}
            >
              Mi Perfil
            </Button>
          ) : (
            <Button
              color={currentPage === 'teacher' ? 'primary' : 'inherit'}
              onClick={() => handleNavigation('/teacher')}
              startIcon={<Person />}
            >
              Maestro
            </Button>
          )}
        </Box>

        {/* Notificaciones - Solo para usuarios autenticados */}
        {isAuthenticated && (
          <IconButton
            color="inherit"
            onClick={handleNotificationOpen}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        )}

        {/* Avatar y Menú de Usuario o Botón de Login */}
        {isAuthenticated ? (
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{ 
                width: 40, 
                height: 40, 
                cursor: 'pointer',
                bgcolor: 'primary.main',
                '&:hover': { opacity: 0.8 }
              }}
              onClick={handleMenuOpen}
            >
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        ) : (
          <Button
            variant="contained"
            startIcon={<Login />}
            onClick={handleLogin}
          >
            Iniciar Sesión
          </Button>
        )}

        {/* Menú de Notificaciones */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: { minWidth: 300, mt: 1 }
          }}
        >
          <MenuItem onClick={handleNotificationClose}>
            <Typography variant="body2">
              Nuevo curso disponible: Álgebra Avanzada
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleNotificationClose}>
            <Typography variant="body2">
              Progreso guardado en Geometría
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleNotificationClose}>
            <Typography variant="body2">
              Mensaje del maestro: ¡Excelente progreso!
            </Typography>
          </MenuItem>
        </Menu>

        {/* Menú de Usuario */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 200, mt: 1 }
          }}
        >
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name || user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role === 'maestro' ? 'Maestro' : 'Estudiante'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => handleNavigation('/my-courses')}>
            <Book sx={{ mr: 2 }} />
            Mis Cursos
          </MenuItem>
          {user?.role === 'maestro' ? (
            [
              <MenuItem key="manage-courses" onClick={() => handleNavigation('/teacher/courses')}>
                <Book sx={{ mr: 2 }} />
                Gestionar Cursos
              </MenuItem>,
              <MenuItem key="edit-profile" onClick={() => handleNavigation('/teacher/edit')}>
                <Person sx={{ mr: 2 }} />
                Editar Perfil
              </MenuItem>
            ]
          ) : (
            [
              <MenuItem key="profile" onClick={() => handleNavigation('/profile')}>
                <Person sx={{ mr: 2 }} />
                Perfil
              </MenuItem>,
              <MenuItem key="contact-teacher" onClick={() => handleNavigation('/teacher')}>
                <ContactSupport sx={{ mr: 2 }} />
                Contactar Maestro
              </MenuItem>
            ]
          )}
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ExitToApp sx={{ mr: 2 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
