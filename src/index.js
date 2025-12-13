// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css"; // optional - your Tailwind or custom CSS

createRoot(document.getElementById("root")).render(<App />);
    