import { redirect } from 'next/navigation';
import { getAdmin } from '../../../lib/admin-session';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  if (await getAdmin()) redirect('/admin/dashboard');
  return (
    <main className="admin-login">
      <div className="login-intro">
        <p className="admin-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Wildera Logo" />
          <span>Wildera Adventure</span>
        </p>
        <p className="login-context">Ruang kerja admin</p>
        <h1>
          Persiapan perjalanan
          <br />
          dimulai di sini.
        </h1>
        <p>
          Masuk dengan akun tim untuk mengakses pengelolaan perjalanan Wildera.
        </p>
      </div>
      <section className="login-panel" aria-labelledby="login-heading">
        <h2 id="login-heading">Masuk ke admin</h2>
        <p>Gunakan email dan kata sandi akun Anda.</p>
        <LoginForm />
        <p className="login-help">
          Belum memiliki akses? Hubungi pengelola akun tim Wildera.
        </p>
      </section>
    </main>
  );
}
