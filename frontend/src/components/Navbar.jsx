import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../utils/api';
import {
  Activity, Menu, X, Bell, ShoppingCart, User, LogOut, LayoutDashboard,
  ChevronDown, Zap, Stethoscope
} from 'lucide-react';
import '../styles/Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unread, setUnread] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) {
      notificationsAPI.getAll()
        .then(r => setUnread(r.data.unread || 0))
        .catch(() => {});
    }
  }, [user, location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const navLinks = [
    { to: '/services', label: 'Services' },
    { to: '/proposer-service', label: 'Proposer', auth: true },
    { to: '/espace-praticien', label: 'Mon espace', praticien: true },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Activity size={22} />
          </div>
          <span className="logo-text">Vita<span>Care</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="navbar-links">
          {navLinks.map(link => {
            if (link.auth && !user) return null;
            if (link.praticien && user?.role !== 'praticien') return null;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${location.pathname.startsWith(link.to) ? 'active' : ''}${link.praticien ? ' nav-link-praticien' : ''}`}
              >
                {link.praticien && <Stethoscope size={14} />}{link.label}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/panier" className="nav-icon-btn" title="Panier">
                <ShoppingCart size={20} />
              </Link>
              <Link to="/mes-reservations" className="nav-icon-btn" title="Notifications" style={{ position: 'relative' }}>
                <Bell size={20} />
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </Link>
              <div className="user-dropdown">
                <button className="user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <div className="user-avatar">
                    {user.prenom?.[0]}{user.nom?.[0]}
                  </div>
                  <span className="user-name">{user.prenom}</span>
                  <ChevronDown size={14} className={dropdownOpen ? 'rotated' : ''} />
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">{user.prenom?.[0]}{user.nom?.[0]}</div>
                      <div>
                        <div className="dropdown-name">{user.prenom} {user.nom}</div>
                        <div className="dropdown-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/tableau-de-bord" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <LayoutDashboard size={16} /> Tableau de bord
                    </Link>
                    <Link to="/mes-reservations" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <Activity size={16} /> Mes réservations
                    </Link>
                    <Link to="/panier" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <ShoppingCart size={16} /> Mon panier
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <LogOut size={16} /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/connexion" className="btn btn-ghost btn-sm">Connexion</Link>
              <Link to="/inscription" className="btn btn-primary btn-sm">
                <Zap size={14} /> Commencer
              </Link>
            </>
          )}
          <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(link => {
            if (link.auth && !user) return null;
            if (link.praticien && user?.role !== 'praticien') return null;
            return (
              <Link key={link.to} to={link.to} className="mobile-link" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            );
          })}
          {user ? (
            <>
              <Link to="/mes-reservations" className="mobile-link" onClick={() => setMenuOpen(false)}>Mes réservations</Link>
              <Link to="/panier" className="mobile-link" onClick={() => setMenuOpen(false)}>Panier</Link>
              <Link to="/tableau-de-bord" className="mobile-link" onClick={() => setMenuOpen(false)}>Tableau de bord</Link>
              <button className="mobile-link" style={{ color: 'var(--danger)', textAlign: 'left' }} onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/connexion" className="mobile-link" onClick={() => setMenuOpen(false)}>Connexion</Link>
              <Link to="/inscription" className="mobile-link" onClick={() => setMenuOpen(false)}>Inscription</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
