import '../styles/globals.css';
import type { AppProps } from 'next/app';

// App

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
export default MyApp;
