import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingChat from '../chat/FloatingChat';
import './Layout.css';

/**
 * Layout component that wraps the entire application
 * Includes the Navbar and Footer components
 */
const Layout = () => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <FloatingChat />
    </div>
  );
};

export default Layout; 