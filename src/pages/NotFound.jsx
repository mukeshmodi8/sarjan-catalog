// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="py-5 text-center">
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/" className="btn btn-outline-primary mt-2">
        Back to Home
      </Link>
    </main>
  );
};

export default NotFound;
