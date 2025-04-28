import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { register, selectIsAuthenticated, selectAuthLoading, selectAuthError } from '../../app/store/slices/auth.slice';
import { AppDispatch } from '../../app/store/store';

/**
 * Registration validation schema
 */
const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name is too short')
    .max(50, 'Name is too long')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  terms: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
});

/**
 * Registration page component
 */
const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  /**
   * Handle registration form submission
   */
  const handleSubmit = async (values: { name: string; email: string; password: string }) => {
    try {
      await dispatch(register(values)).unwrap();
      // Successful registration will trigger redirect via useEffect
    } catch (err) {
      // Error handling is done via Redux state
      console.error('Registration failed:', err);
    }
  };
  
  return (
    <div className="auth-page register-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Create an Account</h1>
          <p>Join BrainBoost and start learning more effectively</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <Formik
          initialValues={{ name: '', email: '', password: '', confirmPassword: '', terms: false }}
          validationSchema={RegisterSchema}
          onSubmit={(values) => {
            // Extract only the fields needed for registration
            const { name, email, password } = values;
            handleSubmit({ name, email, password });
          }}
        >
          {({ isSubmitting }) => (
            <Form className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <Field
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  className="form-control"
                />
                <ErrorMessage name="name" component="div" className="form-error" />
              </div>
              
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
                  placeholder="Create a password"
                  className="form-control"
                />
                <ErrorMessage name="password" component="div" className="form-error" />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <Field
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  className="form-control"
                />
                <ErrorMessage name="confirmPassword" component="div" className="form-error" />
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <Field type="checkbox" name="terms" className="form-checkbox" />
                  <span className="checkbox-text">
                    I accept the{' '}
                    <Link to="/terms" className="terms-link">
                      Terms and Conditions
                    </Link>
                  </span>
                </label>
                <ErrorMessage name="terms" component="div" className="form-error" />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting || isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </Form>
          )}
        </Formik>
        
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
