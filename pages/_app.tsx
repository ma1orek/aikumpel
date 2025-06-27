import 'bootstrap/dist/css/bootstrap.min.css'
import type { AppProps } from 'next/app'
import '../public/css/bootstrap.min.css';
import '../public/css/animate.css';
import '../public/css/flaticon.css';
import '../public/css/magnific-popup.css';
import '../public/css/owl.carousel.min.css';
import '../public/css/owl.theme.default.min.css';
import '../public/css/style.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}