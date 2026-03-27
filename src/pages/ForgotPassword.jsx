import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Instruções de recuperação foram enviadas para seu e-mail.');
    } catch (err) {
      setError('Falha ao redefinir a senha. Verifique se o e-mail está correto.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-top-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-3xl font-bold shadow-lg shadow-black/50 text-gray-400 mb-4 border border-gray-700/50">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-100">Recuperar Senha</h1>
          <p className="text-gray-500 mt-2 text-sm text-center">Enviaremos um link para redefinir sua senha</p>
        </div>

        <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/40 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {message && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
              <CheckCircle2 size={18} className="shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">E-mail Cadastrado</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1.5 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-gray-500/50 focus:ring-1 focus:ring-gray-500/50 transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-3.5 mt-4 rounded-xl bg-gray-200 text-gray-900 text-sm font-bold shadow-lg hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar Recuperação'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <Link to="/login" className="text-gray-400 hover:text-white font-medium transition-colors flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
