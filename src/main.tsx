import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Global error handler for startup errors
const showError = (message: string, stack?: string) => {
  const errorDisplay = document.getElementById('startup-error-overlay');
  if (errorDisplay) {
    errorDisplay.style.display = 'flex';
    const pre = errorDisplay.querySelector('pre');
    if (pre) {
      pre.textContent += `\n[${new Date().toISOString()}] ${message}\n${stack || ''}\n`;
    }
  }
  console.error("Critical Startup Error:", message, stack);
};

window.addEventListener('error', (event) => {
  showError(`Runtime Error: ${event.message}`, event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  showError(`Promise Rejection: ${event.reason?.message || event.reason}`, event.reason?.stack);
});

const mountApp = () => {
  console.log("Checking for root element...");
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    const msg = "FAILED: #root element not found in DOM.";
    showError(msg);
    throw new Error(msg);
  }

  try {
    console.log("Starting React render...");
    const root = createRoot(rootElement);
    root.render(
      <HelmetProvider>
        <App />
      </HelmetProvider>,
    );
    console.log("React render call completed.");
    
    // Safety check: if after 5 seconds #root is still empty, something is wrong with the provider tree
    setTimeout(() => {
      if (rootElement.innerHTML === "" || rootElement.innerHTML === "<!-- react-empty -->") {
        showError("App mounted but #root remains empty after 5s. Possible deadlock in Provider tree.");
      }
    }, 5000);

  } catch (error: any) {
    showError(`Mount Error: ${error.message}`, error.stack);
    throw error;
  }
};

// Ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
