import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import logo from './assets/logo-poste.png';
import Chatbot from './Chatbot'; // Import du chatbot

// URL de base du backend
const backendURL = 'https://poste-tunisienne.onrender.com';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('login');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.querySelector('.login-box')?.classList.add('fade-in');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (attempts <= 1) {
      setError("Veuillez réessayer plus tard.");
      return;
    }
    try {
      const res = await axios.post(`${backendURL}/login`, { username, password });
      setRole(res.data.role);
      setStep('otp');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur');
      setAttempts(prev => prev - 1);
    }
  };

  const handleOtpValidation = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${backendURL}/verify-otp`, { username, code: otp });
      if (res.status === 200) {
        if (role === 'guichetier') navigate('/guichetier');
        else if (role === 'chefagence') navigate('/chef-agence');
        else if (role === 'arriereguichet') navigate('/arriere-guichet');
        else navigate('/'); // fallback si rôle inconnu
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la vérification OTP');
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="login-box">
          <div className="logo-section">
            <img src={logo} alt="Poste Tunisienne" className="logo" />
          </div>
          <div className="form-section">
            {step === 'login' ? (
              <>
                <h2>Connexion</h2>
                {error && <p className="error" role="alert">⚠️ {error}</p>}
                <form onSubmit={handleSubmit}>
                  <div className="input-group">
                    <label htmlFor="username" className="sr-only">Nom d'utilisateur</label>
                    <span className="icon" aria-hidden="true">👤</span>
                    <input
                      id="username"
                      type="text"
                      placeholder="Nom d'utilisateur"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="password" className="sr-only">Mot de passe</label>
                    <span className="icon" aria-hidden="true">🔒</span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Cacher mot de passe' : 'Afficher mot de passe'}
                      style={{ cursor: 'pointer' }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <button type="submit">Se connecter</button>
                  <p className="attempts">Essais restants : {attempts}</p>
                </form>
              </>
            ) : (
              <>
                <h2>Vérification OTP</h2>
                {error && <p className="error" role="alert">⚠️ {error}</p>}
                <form onSubmit={handleOtpValidation}>
                  <div className="input-group">
                    <label htmlFor="otp" className="sr-only">Code OTP</label>
                    <span className="icon" aria-hidden="true">🔐</span>
                    <input
                      id="otp"
                      type="text"
                      placeholder="Code OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit">Valider OTP</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <footer className="login-footer">© 2025 Poste Tunisienne – Tous droits réservés.</footer>
      <Chatbot />
    </>
  );
}

export default Login;
