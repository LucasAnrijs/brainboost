import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import authService from '../../app/services/auth.service';

/**
 * Forgot password validation schema
 */
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required')
});

/**
 * Forgot password page component
 */
const ForgotPassword: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Handle forgot password form submission
   */
  const handleSubmit = async (values: { email: string }) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      await authService.forgotPassword(values.email);
      
      setSuccessMessage(
        'Password reset instructions have been sent to your email'
      );
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || 'Failed to send reset instructions'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page forgot-password-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Forgot Password</h1>
          <p>Enter your email to receive password reset instructions</p>
        </div>

        {successMessage && (
          <div className="auth-success">
            <p>{successMessage}</p>
            <p>
              <Link to="/login" className="btn btn-link">
                Return to Login
              </Link>
            </p>
          </div>
        )}

        {!successMessage && (
          <>
            {errorMessage && <div className="auth-error">{errorMessage}</div>}

            <Formik
              initialValues={{ email: '' }}
              validationSchema={ForgotPasswordSchema}
              onSubmit={handleSubmit}
            >
              {() => (
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

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                  </button>
                </Form>
              )}
            </Formik>

            <div className="auth-footer">
              <p>
                Remembered your password?{' '}
                <Link to="/login" className="auth-link">
                  Log in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
