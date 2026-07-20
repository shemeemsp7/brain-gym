// backend/pages/_app.js
import * as React from "react";
import PropTypes from "prop-types";
import Head from "next/head";
import { Inter } from "next/font/google";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SessionProvider } from "next-auth/react";
import { PRODUCT_NAME } from "../src/config";
import "../styles/App.css";
import "../styles/GamePage.css";
import "../styles/LoginPage.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

// Custom blue theme with UX improvements
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb", // deep blue
      contrastText: "#fff"
    },
    secondary: {
      main: "#0ea5e9", // sky blue
      contrastText: "#fff"
    },
    info: {
      main: "#3b82f6", // blue-500
      contrastText: "#fff"
    },
    success: {
      main: "#22c55e",
      contrastText: "#fff"
    },
    warning: {
      main: "#f59e42",
      contrastText: "#fff"
    },
    error: {
      main: "#ef4444",
      contrastText: "#fff"
    },
    background: {
      default: "#f8fafc",
      paper: "#fff"
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b"
    }
  },
  typography: {
    fontFamily: `${inter.style.fontFamily}, 'Roboto', 'Helvetica Neue', Arial, sans-serif`,
    fontWeightBold: 700,
    fontWeightMedium: 600,
    fontWeightRegular: 400,
    h2: {
      fontWeight: 700,
      fontSize: "2rem"
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "1rem"
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginBottom: 8,
          boxShadow: "0 2px 8px #2563eb22"
        }
      }
    }
  }
});

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <React.Fragment>
      <Head>
        <title>{`${PRODUCT_NAME} — Logic Ascendarium`}</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta name="description" content="Train your programming logic with AI-generated challenges, earn karate belts, and learn to spot bugs in AI-written code." />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <SessionProvider session={session}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </SessionProvider>
    </React.Fragment>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
};