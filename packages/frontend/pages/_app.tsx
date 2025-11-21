// packages/frontend/pages/_app.tsx
import '../styles/globals.css'; // Only import the new global styles
import { AppProps } from 'next/app';
import { AuthProvider } from '../hooks/useAuth';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;