import React from 'react';
import { useSelector } from 'react-redux';
import { selectUserProfile } from '../app/store/slices/user.slice';

/**
 * Dashboard page
 * Shows user's study progress, due cards, recent activity
 */
const Dashboard: React.FC = () => {
  const userProfile = useSelector(selectUserProfile);

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="welcome-message">
          Welcome back, {userProfile?.name || 'User'}!
        </p>
      </header>

      <div className="dashboard-summary">
        <div className="dashboard-card">
          <h2>Study Progress</h2>
          <div className="placeholder-content">
            <p>Progress visualization will go here</p>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Due Today</h2>
          <div className="placeholder-content">
            <p>Cards due for review will go here</p>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Recent Activity</h2>
          <div className="placeholder-content">
            <p>Recent study activity will go here</p>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Streak Status</h2>
          <div className="placeholder-content">
            <p>Streak information will go here</p>
          </div>
        </div>
      </div>

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-container">
          <button className="action-button">Start Studying</button>
          <button className="action-button">Create New Deck</button>
          <button className="action-button">Import Content</button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
