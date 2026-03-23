import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

const Dashboard = () => {
  const { user, profile, logout } = useAuth();
  return (
    <div className="dashboard-layout">
      <nav className="navbar">
        <h1>Entrenamiento Coaching</h1>
        <button onClick={logout} className="btn btn-secondary">Salir</button>
      </nav>
      <main className="main-content">
        <h2>Bienvenido {profile?.nombre || user?.email}</h2>
        <p>Tu rol temporalmente no está asignado o eres un participante base.</p>
      </main>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando sesión...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
