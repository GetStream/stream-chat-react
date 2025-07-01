// pages/_app.js
import '@stream-io/stream-chat-css/dist/css/index.css';
import './App.css';

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
