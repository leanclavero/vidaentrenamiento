import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import JoinEdition from './pages/JoinEdition';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Ediciones from './pages/Ediciones';
import Team from './pages/Team';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: 'var(--text-main)', padding: '2rem' }}>Cargando sesión...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Placeholder components for other routes
const Placeholder = ({ title }) => (
  <div className="card">
    <h4>{title}</h4>
    <p>Esta sección está en construcción.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/join/:id_edicion" element={<JoinEdition />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="editions" element={<Ediciones />} />
            <Route path="team" element={<Team />} />
            <Route path="goals" element={<Placeholder title="Gestión de Metas" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
