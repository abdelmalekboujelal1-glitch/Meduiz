import React, { useState } from 'react';
import { Stethoscope, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          name,
          niveau: 'Externat',
          premium: false,
        });

        if (profileError) {
            // If profile creation fails, it might be because of RLS or trigger. 
            // But usually we should handle it. 
            // For now, let's assume it works or log it.
            console.error("Profile creation error:", profileError);
            
            // If table doesn't exist (PGRST205), we can still allow login but user profile won't be saved
            if (profileError.code === 'PGRST205') {
                console.warn("Profiles table not found. Skipping profile creation.");
            } else {
                // For other errors, we might want to show it to the user or just log it
                // setError("Erreur lors de la création du profil");
            }
        }
        
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-med-bg flex items-center justify-center p-4 z-50 transition-colors duration-300">
      <div className="w-full max-w-[380px] bg-med-card border border-med-border rounded-2xl p-8 shadow-2xl transition-colors duration-300">
        <div className="flex flex-col items-center mb-6">
          <Stethoscope size={48} className="text-med-accent mb-4" />
          <h1 className="text-2xl font-bold text-med-text mb-1">MedUiz</h1>
          <p className="text-med-text-muted text-[13px] text-center">
            Assistant médical pour étudiants algériens
          </p>
        </div>

        <div className="h-px w-full bg-med-border mb-6" />

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-3">
          {isRegistering && (
            <input
              type="text"
              placeholder="Prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-med-input border border-med-border rounded-[10px] px-3.5 py-3 text-med-text placeholder-med-text-dim focus:outline-none focus:border-med-accent transition-colors"
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-med-input border border-med-border rounded-[10px] px-3.5 py-3 text-med-text placeholder-med-text-dim focus:outline-none focus:border-med-accent transition-colors"
            required
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-med-input border border-med-border rounded-[10px] px-3.5 py-3 text-med-text placeholder-med-text-dim focus:outline-none focus:border-med-accent transition-colors"
            required
          />

          {error && (
            <div className="text-med-danger text-xs text-center mt-2 flex items-center justify-center gap-1">
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-med-accent text-med-bg font-bold rounded-[10px] py-3.5 mt-2 hover:bg-med-accent-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement...' : (isRegistering ? "S'inscrire" : 'Se connecter')}
          </button>
        </form>

        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError(null);
          }}
          className="w-full bg-transparent border border-med-border text-med-text-muted font-semibold rounded-[10px] py-3.5 mt-3 hover:bg-med-border transition-colors"
        >
          {isRegistering ? 'Déjà un compte ? Se connecter' : 'Créer un compte'}
        </button>
      </div>
    </div>
  );
}
