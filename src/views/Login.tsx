import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Card, Button, Input } from '../components/UI';
import { LogIn, Fingerprint, User, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError('Invalid email or password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand/5 via-white to-white">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-brand rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-brand/20">
             <LogIn size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tighter">Welcome Back</h1>
            <p className="text-zinc-400 font-medium text-sm">Login to your account</p>
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              icon={Mail}
              placeholder="Member Email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              icon={Lock}
              placeholder="Password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <div className="flex justify-end">
              <button type="button" className="text-xs font-black text-brand uppercase tracking-tighter hover:underline">
                Forgot Password?
              </button>
            </div>

            {error && <p className="text-xs text-rose-600 font-bold text-center bg-rose-50 p-3 rounded-xl">{error}</p>}

            <Button className="w-full mt-4 h-16 text-lg" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Login'}
            </Button>
          </form>

          <div className="relative py-4">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
             <div className="relative flex justify-center text-[10px] uppercase font-black text-zinc-300 tracking-widest bg-white px-4">or</div>
          </div>

          <Button variant="outline" className="w-full py-4 border-2 active:scale-95 transition-transform">
             <div className="flex items-center gap-3">
                <Fingerprint className="text-brand" size={20} />
                <span className="text-zinc-600">Login with Fingerprint</span>
             </div>
          </Button>

          <div className="text-center pt-8">
            <p className="text-sm text-zinc-500 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand font-black hover:underline uppercase tracking-tighter">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
