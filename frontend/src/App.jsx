import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Login from './components/Auth/Login';
import VideoList from './components/Videos/VideoList';
import VideoPlayer from './components/Videos/VideoPlayer';
import UploadVideo from './components/Videos/UploadVideo';
import MediaLibrary from './components/Media/MediaLibrary';
import Dashboard from './components/Dashboard/Dashboard';
import Loader from './components/Common/Loader';
import AdminUsers from './components/Admin/AdminUsers';
import AdminDashboard from './components/Admin/AdminDashboard';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const hideSidebar = location.pathname === '/admin/users';

  return (
    <div className="min-h-screen bg-dark-50">
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#fff', color: '#1e293b' } }} />
      {!hideSidebar && <Navbar />}
      <main className={isAuthenticated && !hideSidebar ? 'pt-16 md:ml-64 md:pt-0' : 'pt-0'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/videos" element={<PrivateRoute><VideoList /></PrivateRoute>} />
          <Route path="/video/:id" element={<PrivateRoute><VideoPlayer /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><UploadVideo /></PrivateRoute>} />
          <Route path="/media" element={<PrivateRoute><MediaLibrary /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/share-video" element={<Navigate to="/upload" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  </Router>
);

export default App;
