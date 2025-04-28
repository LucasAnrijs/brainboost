import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { login, selectIsAuthenticated, selectAuthLoading, selectAuthError } from '../../app/store/slices/auth.slice';
import { AppDispatch } from '../../app/store/store';

/**
 * Login validation schema
 */
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
});

/**
 * Login page component
 */
const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  // Get redirect path from URL query params or default to dashboard
  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '/';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);
  
  /**
   * Handle login form submission
   */
  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      await dispatch(login(values)).unwrap();
      // Successful login will trigger redirect via useEffect
    } catch (err) {
      // Error handling is done via Redux state
      console.error('Login failed:', err);
    }
  };
  
  return (
    <div className="auth-page login-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome to BrainBoost</h1>
          <p>Log in to access your flashcards and continue learning</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <Field
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="form-control"
                />
                <ErrorMessage name="email" component="div" className="form-error" />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <Field
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  className="form-control"
                />
                <ErrorMessage name="password" component="div" className="form-error" />
              </div>
              
              <div className="form-footer">
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot password?
                </Link>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting || isLoading}
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>
            </Form>
          )}
        </Formik>
        
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
