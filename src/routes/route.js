import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "../../src/assets/css/style.css";
import AudioRecorder from "../pages/AudioRecorder";
import VideoRecorder from "../pages/VideoRecorder";
import { NavBar } from "../components/Navbar/Navbar";

export default function Routers() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/audio" />} />
        <Route path="/audio" element={<AudioRecorder />} />
        <Route path="/video" element={<VideoRecorder />} />
      </Routes>
    </Router>
  );
}
