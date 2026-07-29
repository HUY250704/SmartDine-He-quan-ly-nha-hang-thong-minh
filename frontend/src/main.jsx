import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { CartProvider } from '@/context/CartContext.jsx';
import { LanguageProvider } from '@/context/LanguageContext.jsx';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <CartProvider><AuthProvider>
          <App />
        </AuthProvider></CartProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);

