import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { CheckSquare, ArrowRight, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/20 mb-6">
            <CheckSquare size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Continue your productive journey with TaskFlow.</p>
        </div>

        <div className="glass p-10 bg-slate-900/40 border border-white/5 relative shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
               {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="email" 
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Secure Passphrase</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="password" 
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 transition-all active:scale-95 uppercase tracking-widest text-xs">
              Sign In to Workspace <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account? 
              <Link to="/register" className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Create Account</Link>
            </p>
          </div>
        </div>
        
        <p className="mt-10 text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.2em]">
          Powered by Advanced Task Tracker V3
        </p>
      </div>
    </div>
  );
}
