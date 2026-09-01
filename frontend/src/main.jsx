import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import StudentQuiz from "./pages/StudentQuiz.jsx";
import MasteryMap from "./pages/MasteryMap.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/quiz" element={<StudentQuiz />} />
      <Route path="/mastery" element={<MasteryMap />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
    </Routes>
  </BrowserRouter>
);
