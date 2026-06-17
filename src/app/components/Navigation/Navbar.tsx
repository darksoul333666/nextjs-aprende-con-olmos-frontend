"use client";

import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  School,
  Person,
  Book,
  Home,
  ContactSupport,
  ExitToApp,
  Login,
  ShoppingCart,
  LocalOffer,
  People,
  Menu as MenuIcon,
  Close,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { CartIcon } from "../Cart/CartIcon";
import { CartDrawer } from "../Cart/CartDrawer";
import { AppVersionLabel } from "../AppVersionLabel/AppVersionLabel";

interface NavbarProps {
  currentPage?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  pageKey: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage = "home" }) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    handleMenuClose();
    setMobileNavOpen(false);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    setMobileNavOpen(false);
    router.push("/");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleCartOpen = () => {
    setCartDrawerOpen(true);
  };

  const handleCartClose = () => {
    setCartDrawerOpen(false);
  };

  const teacherNavItems: NavItem[] = [
    { label: "Inicio", path: "/", icon: <Home />, pageKey: "home" },
    {
      label: "Gestionar Cursos",
      path: "/teacher/courses",
      icon: <Book />,
      pageKey: "teacher-courses",
    },
    {
      label: "Promociones",
      path: "/teacher/promotions",
      icon: <LocalOffer />,
      pageKey: "teacher-promotions",
    },
    {
      label: "Estudiantes",
      path: "/teacher/users",
      icon: <People />,
      pageKey: "teacher-users",
    },
    {
      label: "Mi Perfil",
      path: "/teacher/edit",
      icon: <Person />,
      pageKey: "teacher-edit",
    },
    {
      label: "Tickets",
      path: "/teacher/tickets",
      icon: <ContactSupport />,
      pageKey: "teacher-tickets",
    },
  ];

  const studentNavItems: NavItem[] = [
    { label: "Inicio", path: "/", icon: <Home />, pageKey: "home" },
    {
      label: "Explorar cursos",
      path: "/courses",
      icon: <Book />,
      pageKey: "courses",
    },
    {
      label: "Mis cursos",
      path: "/my-courses",
      icon: <School />,
      pageKey: "my-courses",
    },
    {
      label: "Mis Compras",
      path: "/my-purchases",
      icon: <ShoppingCart />,
      pageKey: "my-purchases",
    },
    {
      label: "Soporte",
      path: "/tickets",
      icon: <ContactSupport />,
      pageKey: "tickets",
    },
  ];

  const navItems =
    user?.role === "maestro" ? teacherNavItems : studentNavItems;

  const renderNavButton = (item: NavItem) => (
    <Button
      key={item.path}
      color={currentPage === item.pageKey ? "primary" : "inherit"}
      onClick={() => handleNavigation(item.path)}
      startIcon={item.icon}
    >
      {item.label}
    </Button>
  );

  const renderMobileNavItem = (item: NavItem) => (
    <ListItemButton
      key={item.path}
      selected={currentPage === item.pageKey}
      onClick={() => handleNavigation(item.path)}
    >
      <ListItemIcon>{item.icon}</ListItemIcon>
      <ListItemText primary={item.label} />
    </ListItemButton>
  );

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{ backgroundColor: "white", color: "text.primary" }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {isMobile && isAuthenticated && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="abrir menú"
            onClick={() => setMobileNavOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box display="flex" alignItems="center" sx={{ flexGrow: 1, minWidth: 0, gap: 1 }}>
          <School
            sx={{ mr: 1, color: "primary.main", flexShrink: 0 }}
          />
          <Typography
            variant="h6"
            component="div"
            noWrap
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.95rem", sm: "1.25rem" },
            }}
          >
            Aprende con Olmos
          </Typography>
          <AppVersionLabel />
        </Box>

        {isAuthenticated && !isMobile && (
          <Box display="flex" gap={1} sx={{ mr: 2, flexWrap: "wrap" }}>
            {navItems
              .filter((item) => item.pageKey !== "tickets" && item.pageKey !== "teacher-tickets")
              .map(renderNavButton)}
          </Box>
        )}

        {isAuthenticated && user?.role === "estudiante" && (
          <CartIcon onClick={handleCartOpen} />
        )}

        {isAuthenticated ? (
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{
                width: 40,
                height: 40,
                cursor: "pointer",
                bgcolor: "primary.main",
                "&:hover": { opacity: 0.8 },
              }}
              onClick={handleMenuOpen}
            >
              {user?.name?.charAt(0).toUpperCase() ||
                user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        ) : (
          <Button
            variant="contained"
            startIcon={<Login />}
            onClick={handleLogin}
            size={isMobile ? "small" : "medium"}
          >
            {isMobile ? "Entrar" : "Iniciar Sesión"}
          </Button>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 200, mt: 1 },
          }}
        >
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role === "maestro" ? "Maestro" : "Estudiante"}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            selected={
              user?.role === "maestro"
                ? currentPage === "teacher-tickets"
                : currentPage === "tickets"
            }
            onClick={() =>
              handleNavigation(
                user?.role === "maestro" ? "/teacher/tickets" : "/tickets",
              )
            }
          >
            <ContactSupport sx={{ mr: 2 }} />
            {user?.role === "maestro" ? "Tickets" : "Soporte"}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ExitToApp sx={{ mr: 2 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>

      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Menú
          </Typography>
          <IconButton onClick={() => setMobileNavOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        <List sx={{ pt: 1 }}>
          {navItems.map(renderMobileNavItem)}
          <Divider sx={{ my: 1 }} />
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </List>
      </Drawer>

      <CartDrawer open={cartDrawerOpen} onClose={handleCartClose} />
    </AppBar>
  );
};
