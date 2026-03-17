import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Briefcase, LogIn } from 'lucide-react';

export const Auth: React.FC = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-10 shadow-xl text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900 mb-2">SalesIntel AI</h1>
        <p className="text-stone-500 mb-10">Research, evaluate, and outreach with AI-powered precision.</p>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-stone-900 text-white rounded-2xl font-semibold hover:bg-stone-800 transition-all active:scale-95"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </button>
        
        <p className="mt-8 text-xs text-stone-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
