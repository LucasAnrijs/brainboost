import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUserProfile, selectUserLoading, fetchUserProfile } from '../app/store/slices/user.slice';
import { AppDispatch } from '../app/store/store';

/**
 * User profile page
 */
const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector(selectUserProfile);
  const isLoading = useSelector(selectUserLoading);

  // Fetch user profile if not available
  useEffect(() => {
    if (!profile) {
      dispatch(fetchUserProfile());
    }
  }, [profile, dispatch]);

  if (isLoading) {
    return <div className="loading-spinner">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="error-message">Failed to load profile</div>;
  }

  return (
    <div className="profile-page">
      <header className="page-header">
        <h1>User Profile</h1>
      </header>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="form-group">
            <label>Name</label>
            <div className="field-value">{profile.name}</div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <div className="field-value">{profile.email}</div>
          </div>
          <div className="form-group">
            <label>Member Since</label>
            <div className="field-value">
              {new Date(profile.createdAt).toLocaleDateString()}
            </div>
          </div>
          <button className="btn btn-primary">Edit Profile</button>
        </div>

        <div className="profile-section">
          <h2>Preferences</h2>
          <div className="form-group">
            <label>Theme</label>
            <div className="field-value">{profile.preferences?.theme || 'Light'}</div>
          </div>
          <div className="form-group">
            <label>Daily Study Goal</label>
            <div className="field-value">
              {profile.preferences?.studyGoal || 20} cards
            </div>
          </div>
          <div className="form-group">
            <label>Email Notifications</label>
            <div className="field-value">
              {profile.preferences?.emailNotifications ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          <button className="btn btn-primary">Edit Preferences</button>
        </div>

        <div className="profile-section">
          <h2>Account Security</h2>
          <button className="btn btn-secondary">Change Password</button>
          <button className="btn btn-danger">Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
