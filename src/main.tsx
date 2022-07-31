import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// remove static title from html so that we can create one from <Title> component after render
document.head.querySelector("title")?.remove();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
