import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens export
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#e0e0e0",
          200: "#c2c2c2",
          300: "#a3a3a3",
          400: "#858585",
          500: "#666666",
          600: "#525252",
          700: "#3d3d3d",
          800: "#292929",
          900: "#141414",
        },
        primary: {
          100: "#d0d1d5",
          200: "#a1a4ab",
          300: "#727681",
          400: "#1F2A40",
          500: "#141b2d",
          600: "#101624",
          700: "#0c101b",
          800: "#080b12",
          900: "#040509",
        },
        greenAccent: {
          100: "#dbf5ee",
          200: "#b7ebde",
          300: "#94e2cd",
          400: "#70d8bd",
          500: "#4cceac",
          600: "#3da58a",
          700: "#2e7c67",
          800: "#1e5245",
          900: "#0f2922",
        },
        redAccent: {
          100: "#f8dcdb",
          200: "#f1b9b7",
          300: "#e99592",
          400: "#e2726e",
          500: "#db4f4a",
          600: "#af3f3b",
          700: "#832f2c",
          800: "#58201e",
          900: "#2c100f",
        },
        blueAccent: {
          100: "#e1e2fe",
          200: "#c3c6fd",
          300: "#a4a9fc",
          400: "#868dfb",
          500: "#6870fa",
          600: "#535ac8",
          700: "#3e4396",
          800: "#2a2d64",
          900: "#151632",
        },
      }
    : {
        grey: {
          100: "#141414",
          200: "#292929",
          300: "#3d3d3d",
          400: "#525252",
          500: "#666666",
          600: "#858585",
          700: "#a3a3a3",
          800: "#c2c2c2",
          900: "#e0e0e0",
        },
        primary: {
          100: "#040509",
          200: "#080b12",
          300: "#0c101b",
          400: "#f2f0f0", // manually changed
          500: "#141b2d",
          600: "#1F2A40",
          700: "#727681",
          800: "#a1a4ab",
          900: "#d0d1d5",
        },
        greenAccent: {
          100: "#0f2922",
          200: "#1e5245",
          300: "#2e7c67",
          400: "#3da58a",
          500: "#4cceac",
          600: "#70d8bd",
          700: "#94e2cd",
          800: "#b7ebde",
          900: "#dbf5ee",
        },
        redAccent: {
          100: "#2c100f",
          200: "#58201e",
          300: "#832f2c",
          400: "#af3f3b",
          500: "#db4f4a",
          600: "#e2726e",
          700: "#e99592",
          800: "#f1b9b7",
          900: "#f8dcdb",
        },
        blueAccent: {
          100: "#151632",
          200: "#2a2d64",
          300: "#3e4396",
          400: "#535ac8",
          500: "#6870fa",
          600: "#868dfb",
          700: "#a4a9fc",
          800: "#c3c6fd",
          900: "#e1e2fe",
        },
      }),
});

// mui theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);

  // Label color: bright in dark mode, dark in light mode — always readable
  const labelColor = mode === "dark" ? "#c2c2c2" : "#3d3d3d";
  const labelFocusColor = mode === "dark" ? "#90caf9" : "#1565c0";
  const borderColor = mode === "dark" ? "#525252" : "#bdbdbd";
  const borderFocusColor = mode === "dark" ? "#90caf9" : "#1565c0";
  const inputTextColor = mode === "dark" ? "#e0e0e0" : "#141414";

  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            primary: { main: colors.primary[500] },
            secondary: { main: colors.greenAccent[500] },
            neutral: { dark: colors.grey[700], main: colors.grey[500], light: colors.grey[100] },
            background: { default: colors.primary[500] },
          }
        : {
            primary: { main: colors.primary[100] },
            secondary: { main: colors.greenAccent[500] },
            neutral: { dark: colors.grey[700], main: colors.grey[500], light: colors.grey[100] },
            background: { default: "#fcfcfc" },
          }),
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 40 },
      h2: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 32 },
      h3: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 24 },
      h4: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 20 },
      h5: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 16 },
      h6: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 14 },
    },
    components: {
      // ── InputLabel (the floating label above/inside inputs) ──────────────
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: labelColor,
            fontSize: "0.95rem",
            // Shrunk (floating) state — keep color readable, don't override transform
            "&.MuiInputLabel-shrunk": {
              color: labelColor,
              fontWeight: 600,
            },
            // Focused state
            "&.Mui-focused": {
              color: labelFocusColor,
              fontWeight: 600,
            },
            // Disabled state
            "&.Mui-disabled": {
              color: mode === "dark" ? "#666666" : "#9e9e9e",
            },
          },
        },
      },
      // ── OutlinedInput (the box around the text) ──────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            color: inputTextColor,
            fontSize: "0.95rem",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: borderColor,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: mode === "dark" ? "#858585" : "#757575",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: borderFocusColor,
              borderWidth: 2,
            },
            "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
              borderColor: mode === "dark" ? "#3d3d3d" : "#e0e0e0",
            },
          },
          input: {
            color: inputTextColor,
            "&::placeholder": {
              color: mode === "dark" ? "#666666" : "#9e9e9e",
              opacity: 1,
            },
          },
        },
      },
      // ── Select (dropdown) ────────────────────────────────────────────────
      MuiSelect: {
        styleOverrides: {
          root: {
            color: inputTextColor,
            fontSize: "0.95rem",
          },
          icon: {
            color: mode === "dark" ? "#858585" : "#616161",
          },
        },
      },
      // ── MenuItem (dropdown options) ──────────────────────────────────────
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: "0.95rem",
            color: inputTextColor,
            paddingTop: "10px",
            paddingBottom: "10px",
          },
        },
      },
      // ── FormHelperText ───────────────────────────────────────────────────
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: mode === "dark" ? "#858585" : "#616161",
            fontSize: "0.8rem",
          },
        },
      },
      // ── TextField (wraps all the above) ─────────────────────────────────
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      // ── Dialog content — allow overflow so shrunk labels aren't clipped ──
      MuiDialogContent: {
        styleOverrides: {
          root: {
            overflow: "visible",
            paddingTop: "16px !important",
          },
        },
      },
    },
  };
};

// context for color mode
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  // Initialize mode from localStorage or default to "dark"
  const [mode, setMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem("adminThemeMode");
      return savedMode || "dark";
    } catch (error) {
      console.warn("Could not access localStorage, using default theme:", error);
      return "dark";
    }
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const newMode = prev === "light" ? "dark" : "light";
          // Persist the new mode to localStorage
          try {
            localStorage.setItem("adminThemeMode", newMode);
          } catch (error) {
            console.warn("Could not save theme to localStorage:", error);
          }
          return newMode;
        });
      },
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};
