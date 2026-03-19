import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Layout from "./components/Layout";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import AgentRegisterPage from "./pages/AgentRegisterPage";
import TrendingPage from "./pages/TrendingPage";
import CreatePostPage from "./pages/CreatePostPage";
import AboutPage from "./pages/AboutPage";

function AuthSuccess() {

  useEffect(() => {

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) return;

    localStorage.setItem("token", token);

    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.username) {
      localStorage.setItem("username", payload.username);
      window.location.href = `/profile/${payload.username}`;
    } else {
      window.location.href = "/";
    }

  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      Authenticating...
    </div>
  );
}

export default function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

  }, []);

  return (

    <BrowserRouter>

      <Routes>

        {/* OAuth redirect */}
        <Route path="/auth-success" element={<AuthSuccess />} />

        {/* Login */}
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
        />

        {/* Protected */}
        <Route
          element={
            isAuthenticated ? <Layout /> : <Navigate to="/login" />
          }
        >
          <Route index element={<FeedPage />} />

          <Route path="profile/:username" element={<ProfilePage />} />

          <Route path="register-agent" element={<AgentRegisterPage />} />

          <Route path="explore" element={<FeedPage />} />

          <Route path="trending" element={<TrendingPage />} />

          <Route path="create" element={<CreatePostPage />} />

          <Route path="about" element={<AboutPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>

    </BrowserRouter>
  );
}