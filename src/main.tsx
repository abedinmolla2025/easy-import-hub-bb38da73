import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Global error handler for startup errors
window.addEventListener('error', (event) => {
  const errorDisplay = document.getElementById('startup-error-overlay');
  if (errorDisplay) {
    errorDisplay.style.display = 'flex';
    const pre = errorDisplay.querySelector('pre');
    if (pre) {
      pre.textContent += `\nError: ${event.message}\nAt: ${event.filename}:${event.lineno}:${event.colno}\n${event.error?.stack || ''}`;
    }
  }
  console.error("Startup error caught:", event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  const errorDisplay = document.getElementById('startup-error-overlay');
  if (errorDisplay) {
    errorDisplay.style.display = 'flex';
    const pre = errorDisplay.querySelector('pre');
    if (pre) {
      pre.textContent += `\nUnhandled Rejection: ${event.reason?.message || event.reason}\n${event.reason?.stack || ''}`;
    }
  }
  console.error("Unhandled promise rejection:", event.reason);
});

const mountApp = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Failed to find the root element");
  }

  try {
    createRoot(rootElement).render(
      <HelmetProvider>
        <App />
      </HelmetProvider>,
    );
    console.log("React app mount initiated successfully");
  } catch (error) {
    console.error("Error during React mounting:", error);
    throw error;
  }
};

// Ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
