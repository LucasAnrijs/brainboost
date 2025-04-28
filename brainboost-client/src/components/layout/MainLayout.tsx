import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

/**
 * Main application layout with header, sidebar, and footer
 */
const MainLayout: React.FC = () => {
  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <Sidebar />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
