import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Enquanto verifica a sessão com o Supabase, exibe tela de carregamento escurecida
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-violet-500/20 text-white animate-pulse">
          G
        </div>
        <p className="text-gray-500 text-sm animate-pulse">Verificando acesso...</p>
      </div>
    );
  }

  // Se não tem usuário logado, joga para a tela de login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se tem usuário, libera o acesso às rotas filhas (Dashboard, etc)
  return <Outlet />;
}
