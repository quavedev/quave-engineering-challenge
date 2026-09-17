import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PayoutDashboard } from './PayoutDashboard';
import './style.css';

createRoot(document.getElementById('root')!).render(<StrictMode><PayoutDashboard /></StrictMode>);
