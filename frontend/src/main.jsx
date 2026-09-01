import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Login from "./pages/Login.jsx";
import StudentQuiz from "./pages/StudentQuiz.jsx";
import MasteryMap from "./pages/MasteryMap.jsx";
import QuizHistory from "./pages/QuizHistory.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import Research from "./pages/Research.jsx";
import { Navbar, RequireAuth } from "./components.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/quiz" element={<RequireAuth role="student"><StudentQuiz /></RequireAuth>} />
      <Route path="/mastery" element={<RequireAuth role="student"><MasteryMap /></RequireAuth>} />
      <Route path="/history" element={<RequireAuth role="student"><QuizHistory /></RequireAuth>} />
      <Route path="/teacher" element={<RequireAuth role="teacher"><TeacherDashboard /></RequireAuth>} />
      <Route path="/research" element={<RequireAuth role="teacher"><Research /></RequireAuth>} />
    </Routes>
  </BrowserRouter>
);
