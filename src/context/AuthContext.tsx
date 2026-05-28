import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  setProfile: React.Dispatch<React.SetStateAction<any | null>>;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  simulateLogin: (email: string, role: 'Admin' | 'Member') => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  setProfile: () => {},
  loading: true,
  isAdmin: false,
  logout: async () => {},
  simulateLogin: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load existing simulation session from localStorage if present
  useEffect(() => {
    const cachedUser = localStorage.getItem('saccoswift_sim_user');
    const cachedProfile = localStorage.getItem('saccoswift_sim_profile');
    if (cachedUser && cachedProfile) {
      const parsedUser = JSON.parse(cachedUser);
      const parsedProfile = JSON.parse(cachedProfile);
      setUser(parsedUser);
      setProfile(parsedProfile);
      setIsAdmin(parsedUser.email === 'JohnKamau106@gmail.com' || parsedProfile.role === 'Admin');
      setLoading(false);
    }
  }, []);

  const simulateLogin = (email: string, role: 'Admin' | 'Member') => {
    const isChairman = email.toLowerCase() === 'johnkamau106@gmail.com' || role === 'Admin';
    const emailVal = isChairman ? 'JohnKamau106@gmail.com' : email || 'member@saccoswift.co.ke';
    const fullName = isChairman ? 'John Kamau (Sacco Chairman)' : 'Sacco Demo Member';
    const memberId = isChairman ? 'SS-2026-0001' : 'SS-2026-9912';

    const simUserObj = {
      uid: 'sim-user-id',
      email: emailVal,
      displayName: fullName,
      simulated: true,
    };

    const simProfileObj = {
      uid: 'sim-user-id',
      fullName,
      email: emailVal,
      phoneNumber: '0712345678',
      memberNumber: memberId,
      savingsBalance: 32000,
      loanBalance: 0,
      role: isChairman ? 'Admin' : 'Member',
      simulated: true,
    };

    // Initialize local lists if not present to simulate dynamic entries
    if (!localStorage.getItem('saccoswift_sim_transactions')) {
      localStorage.setItem('saccoswift_sim_transactions', JSON.stringify([
        {
          id: 'TX-INIT',
          type: 'deposit',
          amount: 32000,
          description: 'Initial Shares & Savings deposit',
          timestamp: new Date().toISOString(),
        }
      ]));
    }

    if (!localStorage.getItem('saccoswift_sim_loans')) {
      localStorage.setItem('saccoswift_sim_loans', JSON.stringify([]));
    }

    localStorage.setItem('saccoswift_sim_user', JSON.stringify(simUserObj));
    localStorage.setItem('saccoswift_sim_profile', JSON.stringify(simProfileObj));

    setUser(simUserObj);
    setProfile(simProfileObj);
    setIsAdmin(isChairman);
    setLoading(false);
  };

  const logout = async () => {
    localStorage.removeItem('saccoswift_sim_user');
    localStorage.removeItem('saccoswift_sim_profile');
    try {
      await auth.signOut();
    } catch (e) {
      // Ignored if offline/unsaved
    }
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If we are under active local simulation, respect it and skip Firebase listeners
      const cachedUser = localStorage.getItem('saccoswift_sim_user');
      if (cachedUser) {
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Setup real-time snapshot listener on the profile document
        unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            setProfile(userDoc.data());
          }
        }, (error) => {
          console.error("Error listening to profile:", error);
        });

        try {
          // Check admin status
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          setIsAdmin(adminDoc.exists() || firebaseUser.email === 'JohnKamau106@gmail.com');
        } catch (error) {
          console.error("Error setting admin status:", error);
        }
      } else {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      setProfile,
      loading,
      isAdmin,
      logout,
      simulateLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
