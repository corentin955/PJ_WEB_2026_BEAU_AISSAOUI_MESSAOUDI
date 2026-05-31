import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI, reservationsAPI } from '../utils/api';
import {
  Activity, Home, Stethoscope, CalendarCheck, ShoppingCart,
  Bell, User, LogOut, Zap, Menu, Search, HelpCircle, Mail, Settings,
  Moon, Sun, LayoutDashboard, CalendarDays, Layers, Plus, Users,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import '../styles/Layout.css';

export default function Layout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [panierCount, setPanierCount] = useState(0);
  const location = useLocation();

  const fetchCounts = () => {
    if (user) {
      notificationsAPI.getAll()
        .then(r => setUnread(r.data.unread || 0))
        .catch(() => {});
      if (user.role !== 'praticien') {
        reservationsAPI.getPanier()
          .then(r => setPanierCount((r.data.data || []).length))
          .catch(() => {});
      }
    } else {
      setUnread(0);
      setPanierCount(0);
    }
  };

  useEffect(() => { fetchCounts(); }, [user, location]); // eslint-disable-line

  useEffect(() => {
    window.addEventListener('vitacare:notif-update', fetchCounts);
    return () => window.removeEventListener('vitacare:notif-update', fetchCounts);
  }, [user]); // eslint-disable-line

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unread={unread}
        panierCount={panierCount}
      />
      {sidebarOpen && (
        <div
          className="sidebar-overlay open"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="main-area">
        <TopHeader
          onMenuToggle={() => setSidebarOpen(o => !o)}
          unread={unread}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar({ open, onClose, unread, panierCount }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    onClose();
  };

  const isActive = (to) => {
    if (to.includes('?')) {
      const [path, qs] = to.split('?');
      if (location.pathname !== path) return false;
      const params    = new URLSearchParams(qs);
      const locParams = new URLSearchParams(location.search);
      const section    = params.get('section');
      const locSection = locParams.get('section');
      if (section === 'agenda' && !locSection) return true;
      return section === locSection;
    }
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const adminLinks = [
    { to: '/admin?section=stats',        icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/admin?section=utilisateurs', icon: Users,           label: 'Utilisateurs'    },
    { to: '/admin?section=services',     icon: Stethoscope,     label: 'Services'        },
  ];

  const praticienLinks = [
    { to: '/espace-praticien?section=agenda',    icon: CalendarDays,    label: 'Mon Agenda'          },
    { to: '/espace-praticien?section=services',  icon: Layers,          label: 'Mes Services'        },
    { to: '/espace-praticien?section=ajouter',   icon: Plus,            label: 'Ajouter un service'  },
    { to: '/notifications',                      icon: Bell,            label: 'Notifications', badge: unread },
    { to: '/profil',                             icon: User,            label: 'Mon Profil'          },
  ];

  const authLinks = [
    { to: '/',                 icon: Home,          label: 'Accueil' },
    { to: '/services',         icon: Stethoscope,   label: 'Services' },
    { to: '/mes-reservations', icon: CalendarCheck, label: 'Mes Rendez-vous' },
    { to: '/panier',           icon: ShoppingCart,  label: 'Mon Panier',    badge: panierCount },
    { to: '/notifications',    icon: Bell,          label: 'Notifications', badge: unread },
    { to: '/profil',           icon: User,          label: 'Mon Profil' },
    { to: '/parametres',       icon: Settings,      label: 'Parametres' },
  ];

  const publicLinks = [
    { to: '/',         icon: Home,        label: 'Accueil'  },
    { to: '/services', icon: Stethoscope, label: 'Services' },
    { to: '/faq',      icon: HelpCircle,  label: 'FAQ'      },
    { to: '/contact',  icon: Mail,        label: 'Contact'  },
  ];

  const links = user?.role === 'admin'      ? adminLinks
              : user?.role === 'praticien' ? praticienLinks
              : user                       ? authLinks
              : publicLinks;

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <Link to="/" className="sidebar-logo" onClick={onClose}>
        <div className="sidebar-logo-icon">
          <Activity size={20} />
        </div>
        <span className="sidebar-logo-text">
          Vita<span>Care</span>
        </span>
      </Link>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.prenom?.[0]}{user.nom?.[0]}
          </div>
          <div className="sidebar-user-name">{user.prenom} {user.nom}</div>
          <div className="sidebar-user-role">{user.role || 'Sportif'}</div>
        </div>
      )}

      <nav className="sidebar-nav">
        <span className="sidebar-nav-label">Navigation</span>
        {links.map(({ to, icon: Icon, label, badge }) => (
          <Link
            key={label}
            to={to}
            className={`sidebar-link ${isActive(to) ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={17} />
            <span>{label}</span>
            {badge > 0 && (
              <span className="sidebar-link-badge">{badge}</span>
            )}
          </Link>
        ))}
      </nav>

      {user && (
        <div className="sidebar-footer">
          <button className="sidebar-link danger" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Deconnexion</span>
          </button>
        </div>
      )}
    </aside>
  );
}

function TopHeader({ onMenuToggle, unread }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="top-header">
      <button className="sidebar-toggle" onClick={onMenuToggle}>
        <Menu size={20} />
      </button>

      <form className="top-header-search" onSubmit={handleSearch}>
        <Search size={15} className="top-header-search-icon" />
        <input
          className="top-header-search-input"
          placeholder="Rechercher un service, praticien..."
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
        />
      </form>

      <div className="top-header-actions">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        {user ? (
          <>
            {user.role === 'patient' && (
              <Link to="/panier" className="top-header-icon-btn" title="Mon panier">
                <ShoppingCart size={18} />
              </Link>
            )}
            <Link to="/notifications" className="top-header-icon-btn" title="Notifications">
              <Bell size={18} />
              {unread > 0 && (
                <span className="top-header-notif-badge">{unread}</span>
              )}
            </Link>
            <Link to="/profil" className="top-header-user">
              <div className="top-header-user-avatar">
                {user.prenom?.[0]}{user.nom?.[0]}
              </div>
              <span className="top-header-user-name">{user.prenom}</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/connexion" className="btn btn-ghost btn-sm">
              Connexion
            </Link>
            <Link to="/inscription" className="btn btn-primary btn-sm">
              <Zap size={13} /> S'inscrire
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
