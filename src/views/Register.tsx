import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Card, Button, Input } from '../components/UI';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    memberNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      await updateProfile(user, { displayName: formData.fullName });

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        memberNumber: formData.memberNumber,
        savingsBalance: 0,
        sharesBalance: 0,
        loanBalance: 0,
        isAdmin: false,
        createdAt: serverTimestamp(),
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-50 via-zinc-50 to-zinc-50">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-zinc-900">Join SaccoSwift</h1>
          <p className="text-zinc-500">Start your journey to financial freedom today</p>
        </div>

        <Card className="shadow-2xl shadow-emerald-500/10 border-white/50">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Full Name" 
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
              <Input 
                label="Phone Number" 
                placeholder="0712 345 678"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Member Number" 
                placeholder="SS-2026-XXXX"
                value={formData.memberNumber}
                onChange={(e) => setFormData({...formData, memberNumber: e.target.value})}
                required
              />
              <Input 
                label="Email Address" 
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <Input 
              label="Password" 
              type="password" 
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            
            {error && <p className="text-sm text-rose-600 text-center">{error}</p>}

            <Button className="w-full mt-4" type="submit" disabled={loading}>
              <div className="flex items-center justify-center gap-2">
                {loading ? 'Creating Account...' : (
                  <>
                    <UserPlus size={20} />
                    <span>Register as Member</span>
                  </>
                )}
              </div>
            </Button>
          </form>

          <div className="mt-8 text-center border-t pt-6 border-zinc-100">
            <p className="text-sm text-zinc-500">
              Already a member?{' '}
              <Link to="/login" className="text-emerald-600 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
