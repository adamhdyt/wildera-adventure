'use client';

import { useState, type FormEvent } from 'react';

export function LoginForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.get('email'),
          password: data.get('password'),
        }),
      });
      if (!response.ok) {
        setError((await response.json()).message);
        setPending(false);
        return;
      }
      // A document navigation discards any admin content cached for a prior session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/admin/dashboard');
    } catch {
      setError('Koneksi terputus. Periksa koneksi Anda lalu coba lagi.');
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="login-form" aria-busy={pending}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
        maxLength={254}
        aria-describedby={error ? 'login-error' : undefined}
      />
      <label htmlFor="password">Kata sandi</label>
      <div className="password-field">
        <input
          id="password"
          name="password"
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          required
          aria-describedby={error ? 'login-error' : undefined}
        />
        <button
          type="button"
          aria-controls="password"
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? 'Sembunyikan' : 'Tampilkan'}
        </button>
      </div>
      {error && (
        <p id="login-error" role="alert" className="admin-alert">
          {error}
        </p>
      )}
      <button className="admin-primary" type="submit" disabled={pending}>
        {pending ? 'Memeriksa akun…' : 'Masuk'}
      </button>
    </form>
  );
}
