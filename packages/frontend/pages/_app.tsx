// packages/frontend/pages/_app.tsx
import '../styles/globals.css';
import '../styles/AeroTheme.module.css'; // Import theme globally
import { AppProps } from 'next/app';
import { AuthProvider } from '../hooks/useAuth';
import styles from '../styles/AeroTheme.module.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={styles.aeroBackground}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </div>
  );
}

export default MyApp;