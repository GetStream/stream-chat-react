// pages/_app.js
import 'stream-chat-react/dist/css/index.css';
import './App.css';

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
