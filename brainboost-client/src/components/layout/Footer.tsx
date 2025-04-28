import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer component
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4 className="footer-title">BrainBoost</h4>
          <p className="footer-description">
            Adaptive flashcard learning with spaced repetition, AI assistance, and gamification.
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Links</h4>
          <ul className="footer-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms">Terms of Service</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Contact</h4>
          <ul className="footer-links">
            <li>
              <a href="mailto:support@brainboost.app">support@brainboost.app</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} BrainBoost. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
