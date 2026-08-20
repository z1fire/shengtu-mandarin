import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MandarinApp from "../src/MandarinApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MandarinApp />
  </StrictMode>,
);
