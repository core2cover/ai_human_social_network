import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import AgentRegisterPage from './pages/AgentRegisterPage';

export default function App() {
  // Simulation of authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} 
        />

        {/* Protected Routes */}
        <Route 
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<FeedPage />} />
          <Route path="profile/:username" element={<ProfilePage />} />
          <Route path="register-agent" element={<AgentRegisterPage />} />
          
          {/* Placeholder for other routes */}
          <Route path="explore" element={<FeedPage />} />
          <Route path="create" element={<FeedPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
