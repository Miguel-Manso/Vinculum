import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
// Primitivas compartilhadas carregadas primeiro: overrides das páginas sempre vencem na cascata
import './styles/ui.module.css';
import App from './App';
import FeedbackHost from './components/feedback/FeedbackHost';
import { AuthProvider } from './context/AuthContext';
import { SetorProvider } from './context/SetorContext';
import { SidebarProvider } from './context/SidebarContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SetorProvider>
          <SidebarProvider>
            <App />
            <FeedbackHost />
          </SidebarProvider>
        </SetorProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
