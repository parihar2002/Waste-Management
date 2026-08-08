import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Common Navigation Elements
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Page Components
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import PickupRequestForm from './pages/PickupRequestForm';
import LiveTrackingPage from './pages/LiveTrackingPage';
import Leaderboard from './pages/Leaderboard';
import DriverDashboard from './pages/DriverDashboard';
import RouteOptimization from './pages/RouteOptimization';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import UserManagement from './pages/UserManagement';

// Real-time custom sockets connector
import useSocket from './hooks/useSocket';

function AppContent() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize socket hook globally (handles rewards update, pops confetti)
  useSocket();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Layout wrapper based on authentication status
  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-darkBg dark:text-slate-100 transition-colors duration-300">
        
        {/* Responsive Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        <div className="flex flex-1 flex-col min-w-0">
          
          {/* Global Navbar */}
          <Navbar onMenuClick={toggleSidebar} />

          {/* Page Routing */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <Routes>
              {/* Citizen Roles */}
              <Route 
                path="/citizen-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pickup-request" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <PickupRequestForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/live-tracking" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <LiveTrackingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/leaderboard" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <Leaderboard />
                  </ProtectedRoute>
                } 
              />

              {/* Driver Roles */}
              <Route 
                path="/driver-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <DriverDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/route-optimization" 
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <RouteOptimization />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Roles */}
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/user-management" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />

              {/* Redirect authenticated users who land on login sheets */}
              <Route 
                path="*" 
                element={
                  <Navigate 
                    to={
                      user.role === 'citizen' ? '/citizen-dashboard' :
                      user.role === 'driver' ? '/driver-dashboard' : '/admin-dashboard'
                    } 
                    replace 
                  />
                } 
              />
            </Routes>
          </main>

        </div>
      </div>
    );
  }

  // Unauthenticated sheets (Landing, Login, Register)
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
