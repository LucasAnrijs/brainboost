import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 404 Not Found page
 */
const NotFound: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-message">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
