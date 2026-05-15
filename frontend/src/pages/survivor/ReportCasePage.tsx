// ReportCasePage — survivor submits an incident report.
// Uses React Hook Form, calls POST /api/v1/cases, shows confirmation with case number.
// Fully localized: en + am via reportCase namespace.
// Uses semantic tokens + Lucide icons.

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Home, FolderOpen, Sparkles, Send } from 'lucide-react';
import api from '../../lib/api';

interface ReportFormData {
  title: string; description: string; incident_date?: string;
  location_text?: string; is_anonymous: boolean; category_hint?: string;
}
interface CreatedCase {
  id: string; case_number: string; title: string; status: string;
  category: string; urgency_level: string; ai_summary: string;
}

export default function ReportCasePage() {
  const { t } = useTranslation('reportCase');
  const [createdCase, setCreatedCase] = useState<CreatedCase | null>(null);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ReportFormData>({ defaultValues: { is_anonymous: false } });
  const isAnonymous = watch('is_anonymous');

  const categoryHints = [
    { value: 'legal', label: t('form.category.legal') },
    { value: 'medical', label: t('form.category.medical') },
    { value: 'shelter', label: t('form.category.shelter') },
    { value: 'counseling', label: t('form.category.counseling') },
    { value: 'other', label: t('form.category.other') },
  ];

  const submitMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const response = await api.post('/cases', {
        title: data.title, description: data.description,
        incident_date: data.incident_date || undefined,
        location_text: data.location_text || undefined,
        is_anonymous: data.is_anonymous,
      });
      return response.data;
    },
    onSuccess: (response) => { if (response.success) setCreatedCase(response.data as CreatedCase); },
  });

  const onSubmit = (data: ReportFormData) => submitMutation.mutate(data);

  // Confirmation Screen
  if (createdCase) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-fade-in-up">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-2xl text-heading mb-2">{t('confirmation.title')}</h2>
        <p className="text-muted max-w-md mb-6 leading-relaxed">{t('confirmation.body')}</p>
        <div className="mb-6 rounded-2xl border border-border bg-surface px-6 py-4 shadow-sm">
          <p className="text-xs text-muted mb-1">{t('confirmation.caseNumberLabel')}</p>
          <p className="font-mono text-xl font-medium text-primary">{createdCase.case_number}</p>
        </div>
        {createdCase.ai_summary && (
          <div className="mb-6 max-w-md rounded-xl bg-primary-soft border border-primary-muted px-4 py-3 text-left">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold text-primary">{t('confirmation.aiNoted')}</p>
            </div>
            <p className="text-sm text-heading leading-relaxed">{createdCase.ai_summary}</p>
          </div>
        )}
        <div className="flex gap-3">
          <Link to="/safe-space/home" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-fg transition-all hover:bg-primary-hover active:scale-[0.98]">
            <Home className="h-4 w-4" /> {t('confirmation.goHome')}
          </Link>
          <Link to="/safe-space/cases" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-heading transition-all hover:bg-inset">
            <FolderOpen className="h-4 w-4" /> {t('confirmation.viewCases')}
          </Link>
        </div>
      </div>
    );
  }

  // Loading State
  if (submitMutation.isPending) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-fade-in">
        <div className="mb-5 relative h-16 w-16">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary-soft opacity-40" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-primary-soft" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          </div>
        </div>
        <h2 className="font-heading text-xl text-heading mb-2">{t('loading.title')}</h2>
        <p className="text-sm text-muted max-w-sm leading-relaxed">{t('loading.subtitle')}</p>
      </div>
    );
  }

  // Report Form
  const inputClasses = (hasError: boolean) =>
    `w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-heading placeholder:text-placeholder transition-all duration-200 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 ${hasError ? 'border-danger' : 'border-border'}`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-heading sm:text-3xl mb-2">{t('header.title')}</h1>
        <p className="text-muted leading-relaxed">{t('header.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Anonymous toggle */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" {...register('is_anonymous')}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary" />
            <div>
              <p className="text-sm font-medium text-heading">{t('form.anonymous.label')}</p>
              <p className="text-xs text-muted mt-0.5">
                {isAnonymous ? t('form.anonymous.on') : t('form.anonymous.off')}
              </p>
            </div>
          </label>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="case-title" className="mb-1.5 block text-sm font-medium text-heading">{t('form.title.label')}</label>
          <input id="case-title" type="text" placeholder={t('form.title.placeholder')}
            {...register('title', { required: t('form.title.required'), minLength: { value: 3, message: t('form.title.minLength') }, maxLength: { value: 200, message: t('form.title.maxLength') } })}
            className={inputClasses(!!errors.title)} />
          {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="case-description" className="mb-1.5 block text-sm font-medium text-heading">{t('form.description.label')}</label>
          <textarea id="case-description" rows={6} placeholder={t('form.description.placeholder')}
            {...register('description', { required: t('form.description.required'), minLength: { value: 10, message: t('form.description.minLength') } })}
            className={`${inputClasses(!!errors.description)} resize-y`} />
          {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
        </div>

        {/* Category Hint */}
        <div>
          <p className="mb-2 text-sm font-medium text-heading">{t('form.category.heading')}</p>
          <p className="mb-3 text-xs text-muted">{t('form.category.hint')}</p>
          <div className="flex flex-wrap gap-2">
            {categoryHints.map((hint) => (
              <label key={hint.value} className="cursor-pointer">
                <input type="radio" value={hint.value} {...register('category_hint')} className="peer sr-only" />
                <span className="inline-block rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-muted transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary hover:bg-inset">
                  {hint.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date + Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="incident-date" className="mb-1.5 block text-sm font-medium text-heading">
              {t('form.date.label')} <span className="ml-1 text-xs font-normal text-muted">{t('form.date.optional')}</span>
            </label>
            <input id="incident-date" type="date" {...register('incident_date')} className={inputClasses(false)} />
          </div>
          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-heading">
              {t('form.location.label')} <span className="ml-1 text-xs font-normal text-muted">{t('form.location.optional')}</span>
            </label>
            <input id="location" type="text" placeholder={t('form.location.placeholder')} {...register('location_text')} className={inputClasses(false)} />
          </div>
        </div>

        {submitMutation.isError && (
          <div className="rounded-xl bg-danger-soft border border-danger/20 px-4 py-3 text-sm text-danger">{t('form.error')}</div>
        )}

        <button type="submit" disabled={submitMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-fg transition-all duration-200 hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md w-full sm:w-auto">
          <Send className="h-4 w-4" /> {t('form.submit')}
        </button>

        <p className="text-xs text-muted leading-relaxed">
          {isAnonymous ? t('form.reassurance.anon') : t('form.reassurance.named')}
        </p>
      </form>
    </div>
  );
}
