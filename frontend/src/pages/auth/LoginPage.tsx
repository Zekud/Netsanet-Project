// LoginPage — the entry point for all users, both survivors and staff.
// Sends an OTP to the user's email address via the backend.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormData {
  email: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { requestOtp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      await requestOtp(data.email);
      // Pass email to verify page via state
      navigate('/login/verify', { state: { email: data.email } });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-left">
          <h1 className="font-serif text-3xl text-teal-900 mb-2">Netsanet</h1>
          <p className="text-base text-gray-500 leading-relaxed">
            A safe and private place to get support. Sign in to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-dark"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address',
                },
              })}
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-gray-500 transition-colors duration-150 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                errors.email ? 'border-critical' : 'border-gray-200'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-critical">{errors.email.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-critical">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending code...
              </>
            ) : (
              'Continue with Email'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
          We'll send a one-time code to your email.
          <br />
          No password needed — your safety comes first.
        </p>
      </div>
    </div>
  );
}
