// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

// import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";

const App = () => {
  return (
    <div className="app-wrapper">
      {/* <Navbar /> */}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
