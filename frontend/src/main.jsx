import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--vexor-card)",
            border: "1px solid var(--vexor-border)",
            color: "var(--vexor-text)"
          }
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);
