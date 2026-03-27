import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      return setError('As senhas não coincidem.');
    }
    try {
      setError('');
      setLoading(true);
      await signUp(email, password);
      navigate('/');
    } catch (err) {
      setError('Falha ao criar conta. Talvez o email já esteja em uso ou a senha é muito fraca.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-top-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-500/20 text-white mb-4">
            <UserPlus size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-100">Criar Conta</h1>
          <p className="text-gray-500 mt-2 text-sm text-center">Comece a controlar seu dinheiro como um pro</p>
        </div>

        <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/40 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1.5 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1.5 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                placeholder="Mínimo de 6 caracteres"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Confirmar Senha</label>
              <input
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full mt-1.5 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                placeholder="Repita a senha"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              Criar minha conta
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Já possui cadastro?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
