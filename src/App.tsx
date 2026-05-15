import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Calculator from './components/Calculator';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { User, UserRole } from './types';
import { localDb, STORAGE_KEYS } from './lib/localDb';
import { LogIn, Globe } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import SalesHistory from './pages/SalesHistory';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import RemoteScanner from './pages/RemoteScanner';
import { seedInitialData } from './services/seedData';
import { Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// LoginPage for retro
const LoginPage = ({ onLogin, onGoogleLogin }: { onLogin: (u: string, p: string) => void, onGoogleLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = localDb.getAll<User>(STORAGE_KEYS.USERS);
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      onLogin(username, password); // Note: handleLogin in App will refetch or we can pass the user
    } else {
      setError('Invalid Access Credentials');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#008080] p-4 overflow-hidden relative font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="win-outset w-full max-max-w-md p-1 shadow-2xl relative z-10 mx-auto max-w-[360px]"
      >
        <div className="win-header mb-1">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="truncate">System Authentication v1.0</span>
          </div>
          <div className="flex gap-1">
            <div className="w-4 h-4 win-outset flex items-center justify-center text-[10px] pb-0.5">_</div>
            <div className="w-4 h-4 win-outset flex items-center justify-center text-[10px]">X</div>
          </div>
        </div>

        <div className="p-6 bg-[var(--color-win-bg)] space-y-6">
          <div className="flex flex-col items-center mb-6">
            <img src="https://api.dicebear.com/7.x/shapes/svg?seed=flexi&backgroundColor=ffffff" alt="Logo" className="w-16 h-16 win-inset p-1 mb-4" />
            <h1 className="text-2xl font-black text-black font-serif italic">FlexiMart <span className="text-[var(--color-win-blue)] underline">PRO</span></h1>
            <p className="text-[var(--color-win-darker)] font-bold uppercase tracking-widest text-[9px] mt-1">Enterprise Inventory Protocol</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="win-label text-[10px] uppercase block mb-1">Operative Identifier:</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="win-input w-full"
                placeholder="Username"
              />
            </div>
            <div className="space-y-1">
              <label className="win-label text-[10px] uppercase block mb-1">Access Protocol:</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="win-input w-full"
                placeholder="Password"
              />
            </div>
            {error && <p className="text-red-700 text-[10px] font-bold text-center underline italic">{error}</p>}
            
            <div className="flex flex-col gap-2 mt-6">
              <button 
                type="submit"
                className="win-button w-full py-2 uppercase tracking-widest text-xs"
              >
                Initialize Node
              </button>
              
              <div className="flex items-center gap-2 my-2">
                <div className="h-px flex-1 bg-gray-400"></div>
                <span className="text-[9px] font-bold text-gray-500 uppercase">Or Cloud Node</span>
                <div className="h-px flex-1 bg-gray-400"></div>
              </div>

              <button 
                type="button"
                onClick={onGoogleLogin}
                className="win-button w-full py-2 flex items-center justify-center gap-2 bg-[#4285F4] text-white hover:bg-[#357ae8]"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase tracking-widest text-xs">Cloud Access (Google)</span>
              </button>
            </div>
          </form>
          <div className="pt-4 border-t border-[var(--color-win-dark)] flex justify-between items-center opacity-70">
            <p className="text-[9px] font-bold italic tracking-tighter">BUILD: 2026.05.07</p>
            <p className="text-[9px] font-bold italic tracking-tighter">NODE: XP-CORE</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // Tablet range auto-minimize
      if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
        setIsSidebarMinimized(true);
      } else if (window.innerWidth > 1024) {
        setIsSidebarMinimized(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Seed initial products if DB is empty
    seedInitialData();

    // Setup Firebase Auth observer
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create user document in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let userData: User;
        if (userDocSnap.exists()) {
          userData = userDocSnap.data() as User;
        } else {
          // New user from Google Login
          userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Cloud Operative',
            role: firebaseUser.email === 'justinkalaw4@gmail.com' ? 'admin' : 'cashier',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          await setDoc(userDocRef, userData);
        }
        setUser(userData);
      } else {
        // Check local persist check if not using Firebase Auth
        const storedUser = localStorage.getItem('flexi-auth');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  const handleLogin = (u: string, p: string) => {
    const users = localDb.getAll<User>(STORAGE_KEYS.USERS);
    const foundUser = users.find(user => user.username === u && user.password === p);

    if (foundUser) {
      const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
      localDb.update(STORAGE_KEYS.USERS, foundUser.id!, updatedUser);
      setUser(updatedUser);
      localStorage.setItem('flexi-auth', JSON.stringify(updatedUser));
    }
  };

  const handleLogout = async () => {
    if (auth.currentUser) {
      await signOut(auth);
    }
    localStorage.removeItem('flexi-auth');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-win-bg)]">
         <div className="win-outset p-2 flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-[var(--color-win-blue)] border-t-white rounded-full animate-spin"></div>
            <span className="win-label uppercase italic">Loading System...</span>
         </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/remote-scan/:stationId" element={<RemoteScanner />} />
          <Route path="*" element={<LoginPage onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[var(--color-win-bg)] flex transition-all duration-300">
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          isMinimized={isSidebarMinimized}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
        />
        
        <main className={cn(
          "flex-1 pt-12 md:pt-16 h-screen overflow-hidden flex flex-col transition-all duration-300",
          isSidebarMinimized ? "md:ml-16" : "md:ml-60",
          "ml-0"
        )}>
          <Navbar 
            user={user} 
            onToggleCalc={() => setIsCalcOpen(!isCalcOpen)} 
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/sales" element={<SalesHistory />} />
              <Route path="/users" element={<Users />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/remote-scan/:stationId" element={<RemoteScanner />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        <Calculator isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
      </div>
    </Router>
  );
}

export default App;
