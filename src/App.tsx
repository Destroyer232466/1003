/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, FileText, Bell, Users, Plus, Upload, ChevronRight, Newspaper, Activity, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: any, token: string) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-anthracite text-white">Carregando...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-anthracite text-white selection:bg-electric-blue selection:text-white">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login onLogin={handleLogin} />} 
          />
          
          <Route 
            path="/dashboard" 
            element={
              user && user.role === 'user' ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Dashboard user={user} />
                </Layout>
              ) : <Navigate to="/login" />
            } 
          />

          <Route 
            path="/admin" 
            element={
              user && user.role === 'admin' ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Admin user={user} />
                </Layout>
              ) : <Navigate to="/login" />
            } 
          />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

function Layout({ children, user, onLogout }: { children: React.ReactNode, user: any, onLogout: () => void }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token") || "";
      try {
        const res = await fetch("/api/mural", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        // Get last 5 items
        setNotifications(data.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };

    if (user) fetchNotifications();
  }, [user]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tighter italic">1003</h1>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {user.role === 'admin' ? (
            <>
              <Link to="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors" onClick={() => setIsSidebarOpen(false)}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors" onClick={() => setIsSidebarOpen(false)}>
                <LayoutDashboard size={20} />
                <span>Home</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 p-2">
            <div className="w-10 h-10 rounded-full bg-electric-blue flex items-center justify-center font-bold">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => { onLogout(); navigate("/login"); }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-anthracite">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 bg-anthracite/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <LayoutDashboard size={20} />
            </button>
            <h2 className="text-lg font-bold">
              {user.role === 'admin' ? 'Painel Administrativo' : 'Área do Usuário'}
            </h2>
          </div>
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors relative"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-electric-blue rounded-full"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-20 overflow-hidden"
                  >
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                      <h3 className="font-bold text-sm">Notificações</h3>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Recentes</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className="p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 text-electric-blue">
                                {n.type === 'news' ? <Newspaper size={16} /> : n.type === 'activity' ? <Activity size={16} /> : <FileText size={16} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold leading-tight">{n.title}</p>
                                <p className="text-[10px] text-zinc-500 mt-1">
                                  {new Date(n.created_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-zinc-600 text-sm">
                          Nenhuma notificação nova.
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-zinc-800/30 text-center">
                      <button 
                        onClick={() => { setShowNotifications(false); navigate("/dashboard"); }}
                        className="text-[10px] font-bold uppercase tracking-widest text-electric-blue hover:underline"
                      >
                        Ver tudo no Mural
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
