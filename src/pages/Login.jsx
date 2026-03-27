import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError('Falha no login. Verifique suas credenciais.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-top-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-3xl font-bold shadow-lg shadow-violet-500/20 text-white mb-4">
            G
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            GranaIA
          </h1>
          <p className="text-gray-500 mt-2 text-sm text-center">Entre para gerenciar suas finanças com IA</p>
        </div>

        <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/40 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1.5 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Senha</label>
                <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Esqueceu a senha?</Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1.5 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-fuchsia-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Entrar no GranaIA
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Ainda não tem uma conta?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Crie agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
