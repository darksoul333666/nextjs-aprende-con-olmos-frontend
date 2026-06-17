"use client";

import React from "react";
import { Chip, type ChipProps } from "@mui/material";
import { APP_VERSION } from "../../utils/appVersion";

interface AppVersionLabelProps {
  size?: ChipProps["size"];
}

export const AppVersionLabel: React.FC<AppVersionLabelProps> = ({
  size = "small",
}) => (
  <Chip
    label={`v${APP_VERSION}`}
    size={size}
    variant="outlined"
    sx={{
      fontWeight: 600,
      fontSize: size === "small" ? "0.7rem" : "0.75rem",
      height: size === "small" ? 22 : 26,
      color: "text.secondary",
      borderColor: "divider",
      flexShrink: 0,
    }}
  />
);
