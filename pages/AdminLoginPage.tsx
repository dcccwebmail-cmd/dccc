import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/firebase';
import ThemeToggle from '../components/ThemeToggle';

interface AdminLoginPageProps {
  // onLogin is now handled by the Firebase state listener in AdminPage
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
        setError("Firebase is not initialized. Please check your configuration and internet connection.");
        setLoading(false);
        return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
      // No need to navigate; the onAuthStateChanged listener in AdminPage will handle the redirect.
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          break;
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 bg-card-bg p-8 rounded-lg shadow-lg border border-border-color relative">
        <div className="absolute top-4 right-4">
            <ThemeToggle />
        </div>
        <img src="https://dhakacollegeculturalclub.com/logo.png" className="h-12 mx-auto mb-6" alt="DCCC Logo" />
        <h1 className="text-2xl font-bold text-center text-text-primary mb-6">Admin Panel Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full px-4 py-2 border border-border-color rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              required
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border border-border-color rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full mt-4 bg-accent text-accent-text font-bold py-2 px-4 rounded-md hover:bg-accent-hover transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <Link to="/" className="block text-center mt-6 text-sm text-text-secondary hover:text-accent transition-colors">
          &larr; Back to Main Site
        </Link>
      </div>
    </div>
  );
};

export default AdminLoginPage;