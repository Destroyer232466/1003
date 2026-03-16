import React, { useState } from "react";
import { motion } from "motion/react";
import { login } from "../services/api";
import { LogIn, ShieldCheck } from "lucide-react";

export default function Login({ onLogin }: { onLogin: (user: any, token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError("Credenciais inválidas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black tracking-tighter italic mb-2">1003</h1>
          <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Acesso Restrito</p>
        </div>

        <div className="card-brutalist">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 focus:border-electric-blue outline-none transition-colors"
                placeholder="exemplo@1003.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg p-3 focus:border-electric-blue outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm font-bold">{error}</p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-electric flex items-center justify-center gap-2 py-4"
            >
              {loading ? "Autenticando..." : (
                <>
                  <LogIn size={20} />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-zinc-600">
          <ShieldCheck size={16} />
          <span className="text-[10px] uppercase font-bold tracking-widest">Conexão Segura SSL/TLS</span>
        </div>
      </motion.div>
    </div>
  );
}
