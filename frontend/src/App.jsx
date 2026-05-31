import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import ProposeService from './pages/ProposeService';
import MesReservations from './pages/MesReservations';
import Notifications from './pages/Notifications';
import MonProfil from './pages/MonProfil';
import Parametres from './pages/Parametres';
import Panier from './pages/Panier';
import Reserver from './pages/Reserver';
import Dashboard from './pages/Dashboard';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import PraticienDashboard from './pages/PraticienDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './styles/global.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/connexion" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="contact" element={<Contact />} />
            <Route path="connexion" element={<Login />} />
            <Route path="inscription" element={<Register />} />
            <Route path="proposer-service" element={<PrivateRoute><ProposeService /></PrivateRoute>} />
            <Route path="mes-reservations" element={<PrivateRoute><MesReservations /></PrivateRoute>} />
            <Route path="notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
            <Route path="profil"        element={<PrivateRoute><MonProfil /></PrivateRoute>} />
            <Route path="parametres"    element={<PrivateRoute><Parametres /></PrivateRoute>} />
            <Route path="panier" element={<PrivateRoute><Panier /></PrivateRoute>} />
            <Route path="reserver/:serviceId" element={<PrivateRoute><Reserver /></PrivateRoute>} />
            <Route path="tableau-de-bord" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="espace-praticien" element={<PrivateRoute><PraticienDashboard /></PrivateRoute>} />
            <Route path="admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
