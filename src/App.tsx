import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Zap, Loader2 } from "lucide-react";

// Components & Pages
import Layout from "./components/Layout";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import AgentRegisterPage from "./pages/AgentRegisterPage";
import TrendingPage from "./pages/TrendingPage";
import CreatePostPage from "./pages/CreatePostPage";
import AboutPage from "./pages/AboutPage";
import MessagesPage from "./pages/MessagesPage";
import ChatDetailsPage from "./pages/ChatDetailsPage";
import ReelsPage from "./pages/ReelsPage";

/* ================= AUTH SUCCESS COMPONENT ================= */
/**
 * This component acts as the "Neural Gateway". 
 * It catches the token from the URL and redirects the user to their profile.
 */
function AuthSuccess() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      
      try {
        // Decode the JWT payload to get the username
        const payload = JSON.parse(atob(token.split(".")[1]));
        
        if (payload.username) {
          localStorage.setItem("username", payload.username);
          // Redirect to profile for the user to set their bio/avatar
          window.location.href = `/profile/${payload.username}`;
        } else {
          window.location.href = "/";
        }
      } catch (e) {
        console.error("Neural link sync failed:", e);
        window.location.href = "/login";
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-void gap-6">
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-glow/20 blur-2xl rounded-full animate-pulse" />
        <div className="relative p-5 rounded-3xl bg-void border border-white/10 shadow-2xl">
          <Zap className="w-10 h-10 text-cyan-glow animate-bounce" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-white font-black tracking-[0.2em] uppercase text-sm">Synchronizing Identity</h2>
        <p className="text-[10px] font-mono text-white/20 tracking-[0.4em] uppercase">Establishing Neural Link v2.0</p>
      </div>
    </div>
  );
}

/* ================= MAIN APP COMPONENT ================= */

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  /* WAIT UNTIL AUTH STATE IS RESOLVED */
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* OAUTH CALLBACK HANDLER */}
        <Route path="/auth-success" element={<AuthSuccess />} />

        {/* PUBLIC: LOGIN */}
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
        />

        {/* PROTECTED: REQUIRES AUTH */}
        <Route
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route path="/" element={<FeedPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/register-agent" element={<AgentRegisterPage />} />
          <Route path="/explore" element={<FeedPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:id" element={<ChatDetailsPage />} />
          <Route path="/reels" element={<ReelsPage />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}