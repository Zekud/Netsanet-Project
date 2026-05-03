// ReportCasePage — survivor submits an incident report.
// Uses React Hook Form, calls POST /api/v1/cases, shows confirmation with case number.

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import QuickExitButton from '../../components/ui/QuickExitButton';

// ─── Types ────────────────────────────────────────────────────

interface ReportFormData {
  title: string;
  description: string;
  incident_date?: string;
  location_text?: string;
  is_anonymous: boolean;
  category_hint?: string;
}

interface CreatedCase {
  id: string;
  case_number: string;
  title: string;
  status: string;
  category: string;
  urgency_level: string;
  ai_summary: string;
}

// ─── Category options (human-friendly wording) ────────────────

const categoryHints = [
  { value: 'legal', label: 'Legal Help' },
  { value: 'medical', label: 'Medical Support' },
  { value: 'shelter', label: 'A Safe Place to Stay' },
  { value: 'counseling', label: 'Someone to Talk To' },
  { value: 'other', label: 'Not Sure' },
];

// ─── Component ────────────────────────────────────────────────

export default function ReportCasePage() {
  const [createdCase, setCreatedCase] = useState<CreatedCase | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ReportFormData>({
    defaultValues: {
      is_anonymous: false,
    },
  });

  const isAnonymous = watch('is_anonymous');

  const submitMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const response = await api.post('/cases', {
        title: data.title,
        description: data.description,
        incident_date: data.incident_date || undefined,
        location_text: data.location_text || undefined,
        is_anonymous: data.is_anonymous,
      });
      return response.data;
    },
    onSuccess: (response) => {
      if (response.success) {
        setCreatedCase(response.data as CreatedCase);
      }
    },
  });

  const onSubmit = (data: ReportFormData) => {
    submitMutation.mutate(data);
  };

  // ─── Confirmation Screen ──────────────────────────────────

  if (createdCase) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <QuickExitButton />

        {/* Success icon */}
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
          <svg className="h-7 w-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="font-serif text-2xl text-dark mb-2">
          Your report has been received
        </h2>
        <p className="text-gray-500 max-w-md mb-6 leading-relaxed">
          A case manager will review your report and reach out to help.
          You can track the status of your case at any time.
        </p>

        {/* Case number */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Your Case Number</p>
          <p className="font-mono text-xl font-medium text-teal-700">
            {createdCase.case_number}
          </p>
        </div>

        {/* AI Summary */}
        {createdCase.ai_summary && (
          <div className="mb-6 max-w-md rounded-lg bg-teal-50 px-4 py-3 text-left">
            <p className="text-xs font-medium text-teal-700 mb-1">What we noted</p>
            <p className="text-sm text-teal-900 leading-relaxed">{createdCase.ai_summary}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to="/safe-space/home"
            className="rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-teal-700"
          >
            Go to Home
          </Link>
          <Link
            to="/safe-space/cases"
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-dark transition-colors duration-150 hover:bg-gray-100"
          >
            View My Cases
          </Link>
        </div>
      </div>
    );
  }

  // ─── Submission Loading State ─────────────────────────────

  if (submitMutation.isPending) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <QuickExitButton />

        <div className="mb-5">
          {/* Calm animated circles */}
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-teal-100 opacity-40" />
            <div className="absolute inset-2 animate-pulse rounded-full bg-teal-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
            </div>
          </div>
        </div>

        <h2 className="font-serif text-xl text-dark mb-2">
          We're reviewing your case securely...
        </h2>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          This takes just a moment. Your information is encrypted and private.
        </p>
      </div>
    );
  }

  // ─── Report Form ──────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl">
      <QuickExitButton />

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-dark sm:text-3xl mb-2">
          Tell us what happened
        </h1>
        <p className="text-gray-500 leading-relaxed">
          Share as much or as little as you're comfortable with.
          Everything you write here is confidential.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Anonymous toggle */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              {...register('is_anonymous')}
              className="mt-0.5 h-4 w-4 rounded border-gray-200 text-teal-500 focus:ring-teal-500"
            />
            <div>
              <p className="text-sm font-medium text-dark">
                Stay anonymous
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isAnonymous
                  ? 'Your identity will be hidden from case workers reviewing your report.'
                  : 'Your name may be visible to the case worker assigned to help you.'}
              </p>
            </div>
          </label>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="case-title" className="mb-1.5 block text-sm font-medium text-dark">
            Brief title for your case
          </label>
          <input
            id="case-title"
            type="text"
            placeholder="e.g. I need legal protection from my partner"
            {...register('title', {
              required: 'A brief title helps us understand your situation',
              minLength: { value: 3, message: 'Title must be at least 3 characters' },
              maxLength: { value: 200, message: 'Title must be under 200 characters' },
            })}
            className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-gray-500 transition-colors duration-150 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 ${
              errors.title ? 'border-critical' : 'border-gray-200'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-critical">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="case-description" className="mb-1.5 block text-sm font-medium text-dark">
            What happened?
          </label>
          <textarea
            id="case-description"
            rows={6}
            placeholder="Describe what happened in your own words. Take your time — there's no rush and no word limit."
            {...register('description', {
              required: 'Please describe your situation so we can help',
              minLength: { value: 10, message: 'Please provide at least a few sentences' },
            })}
            className={`w-full resize-y rounded-lg border bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-gray-500 transition-colors duration-150 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 ${
              errors.description ? 'border-critical' : 'border-gray-200'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-critical">{errors.description.message}</p>
          )}
        </div>

        {/* Category Hint */}
        <div>
          <p className="mb-2 text-sm font-medium text-dark">
            What kind of help do you need most?
          </p>
          <p className="mb-3 text-xs text-gray-500">
            This is optional — our team will assess your needs regardless.
          </p>
          <div className="flex flex-wrap gap-2">
            {categoryHints.map((hint) => (
              <label
                key={hint.value}
                className="cursor-pointer"
              >
                <input
                  type="radio"
                  value={hint.value}
                  {...register('category_hint')}
                  className="peer sr-only"
                />
                <span className="inline-block rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-500 transition-colors duration-150 peer-checked:border-teal-500 peer-checked:bg-teal-50 peer-checked:text-teal-700 hover:bg-gray-100">
                  {hint.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Optional: incident date + location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="incident-date" className="mb-1.5 block text-sm font-medium text-dark">
              When did this happen?
              <span className="ml-1 text-xs font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="incident-date"
              type="date"
              {...register('incident_date')}
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-dark transition-colors duration-150 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-dark">
              Where did this happen?
              <span className="ml-1 text-xs font-normal text-gray-500">(optional)</span>
            </label>
            <input
              id="location"
              type="text"
              placeholder="e.g. Addis Ababa, Bole"
              {...register('location_text')}
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-dark placeholder:text-gray-500 transition-colors duration-150 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Error state */}
        {submitMutation.isError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-critical">
            Something went wrong while submitting your report. Please try again.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full rounded-lg bg-teal-500 px-5 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Send My Report Securely
        </button>

        {/* Reassurance */}
        <p className="text-xs text-gray-500 leading-relaxed">
          Your report is encrypted end-to-end. Only assigned case workers will see your information
          {isAnonymous ? ', and your identity will remain hidden.' : '.'}
        </p>
      </form>
    </div>
  );
}
