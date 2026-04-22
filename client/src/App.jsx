import React from "react";
import { Routes, Route } from "react-router-dom";
import MainScreen from "./screens/MainScreen";
import StudentScreen from "./screens/StudentScreen";

export default function App() {
  return (
    <Routes>
      <Route path="/main" element={<MainScreen />} />
      <Route path="*" element={<StudentScreen />} />
    </Routes>
  );
}
