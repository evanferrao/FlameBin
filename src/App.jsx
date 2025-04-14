// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Editor from "./components/Editor";

function App() {
  return (
    <Router>
      <h1>🔥 FlameBin</h1>
      <Routes>
        <Route path="/" element={<Editor />} />
        <Route path="/:id" element={<Editor />} />
      </Routes>
    </Router>
  );
}

export default App;
