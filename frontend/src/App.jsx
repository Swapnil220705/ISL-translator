// src/App.jsx
import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LearnISL from "./pages/LearnISL";
import "./App.css";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app">
      {/* 🧭 NAVBAR (Visible on all pages) */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Samvaad</h1>
            <p>Bridging Silence with Understanding</p>
          </div>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen((s) => !s)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <div className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
            <Link to="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link to="/learn" onClick={() => setMenuOpen(false)}>
              Learn ISL
            </Link>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
              How It Works
            </a>
            <a href="#recent" onClick={() => setMenuOpen(false)}>
              Recent
            </a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* 🔀 ROUTING SECTION */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<LearnISL />} />
      </Routes>
    </div>
  );
}
