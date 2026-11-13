import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import api from '../services/api';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const { token, salvarSessao } = useAuth();
  const navigate = useNavigate();

  // Se já está autenticado, redireciona de forma declarativa e segura para o dashboard
  if (token && token !== 'undefined' && token !== 'null') {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, senha });
      salvarSessao(data.token, data.usuario);
      navigate('/dashboard');
    } catch (err) {
      setErro(err.response?.data?.error || 'Email ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <main className={styles.card}>
        <Logo
          variant="vertical"
          size={60}
          showSubtitle
          subtitleText="Gestão Visual de Processos"
          className={styles.logoHeader}
        />

        <div className={styles.intro}>
          <h1 className={styles.title}>Bem-vindo de volta</h1>
          <p className={styles.subtitle}>Entre com sua conta para acessar seus processos.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              placeholder="seu@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); if (erro) setErro(''); }}
              aria-invalid={!!erro}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="senha">Senha</label>
            <div className={styles.inputWrap}>
              <input
                id="senha"
                className={`${styles.input} ${styles.inputWithAction}`}
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={senha}
                onChange={e => { setSenha(e.target.value); if (erro) setErro(''); }}
                aria-invalid={!!erro}
                required
              />
              <button
                type="button"
                className={styles.inputAction}
                onClick={() => setMostrarSenha(v => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          {erro && (
            <p className={styles.erro} role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="7.5" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12.01" y2="16.5" /></svg>
              <span>{erro}</span>
            </p>
          )}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading && <span className={styles.spinner} aria-hidden="true" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </main>
      <p className={styles.footer}>Vinculum · Processos, etapas e tarefas por setor</p>
    </div>
  );
}
