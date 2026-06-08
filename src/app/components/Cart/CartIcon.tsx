"use client";

import React from "react";
import { IconButton, Badge, Tooltip } from "@mui/material";
import { ShoppingCart } from "@mui/icons-material";
import { useCart } from "../../contexts/CartContext";
import { useRouter } from "next/navigation";

interface CartIconProps {
  onClick?: () => void;
}

export const CartIcon: React.FC<CartIconProps> = ({ onClick }) => {
  const { itemCount, isLoading } = useCart();
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push("/cart");
    }
  };

  return (
    <Tooltip
      title={`Carrito (${itemCount} ${itemCount === 1 ? "curso" : "cursos"})`}
    >
      <IconButton
        color="inherit"
        onClick={handleClick}
        disabled={isLoading}
        sx={{
          position: "relative",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <Badge
          badgeContent={itemCount}
          color="error"
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.75rem",
              minWidth: "18px",
              height: "18px",
              borderRadius: "9px",
            },
          }}
        >
          <ShoppingCart />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};
