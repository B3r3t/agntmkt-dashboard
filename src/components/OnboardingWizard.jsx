import React, { useEffect, useMemo, useRef, useState } from 'react';

const scoringOptions = [
  'Job Title & Seniority',
  'Company Size',
  'Industry Match',
  'Budget / Buying Power',
  'Intent Signals',
  'Existing Product Usage',
];

const integrationOptions = [
  'HubSpot CRM',
  'Salesforce',
  'Slack Notifications',
  'Zapier Automations',
  'Webhooks',
];

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    companyWebsite: '',
    industry: '',
    companySize: '',
    primaryGoal: '',
    idealCustomerProfile: '',
    scoringFocus: [],
    scoringNotes: '',
    crm: '',
    integrationSelections: [],
    notificationEmail: '',
  });
  const [errors, setErrors] = useState({});

  const fieldRefs = useMemo(
    () => ({
      companyName: useRef(null),
      industry: useRef(null),
      companySize: useRef(null),
      primaryGoal: useRef(null),
      idealCustomerProfile: useRef(null),
      scoringFocus: useRef(null),
      scoringNotes: useRef(null),
      crm: useRef(null),
      notificationEmail: useRef(null),
    }),
    []
  );

  useEffect(() => {
    setErrors({});
  }, [step]);

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleCheckboxToggle = (field, value) => {
    setFormData((prev) => {
      const current = new Set(prev[field]);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }

      return {
        ...prev,
        [field]: Array.from(current),
      };
    });
  };

  const scrollToError = (errorKeys) => {
    if (!errorKeys.length) return;
    const firstErrorKey = errorKeys[0];
    const ref = fieldRefs[firstErrorKey];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof ref.current.focus === 'function') {
        ref.current.focus({ preventScroll: true });
      }
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.companyName.trim()) newErrors.companyName = 'Please enter your company name.';
      if (!formData.industry) newErrors.industry = 'Select the industry that best matches your organization.';
      if (!formData.companySize) newErrors.companySize = 'Choose a company size so we can tailor recommendations.';
      if (!formData.primaryGoal.trim()) newErrors.primaryGoal = 'Let us know your primary goal for using AgentMarket.';
    }

    if (currentStep === 2) {
      if (!formData.idealCustomerProfile.trim()) {
        newErrors.idealCustomerProfile = 'Describe who you typically sell to.';
      }

      if (!formData.scoringFocus.length) {
        newErrors.scoringFocus = 'Pick at least one factor to include in your scoring model.';
      }

      if (!formData.scoringNotes.trim()) {
        newErrors.scoringNotes = 'Add context so our AI understands how you qualify leads.';
      }
    }

    if (currentStep === 3) {
      if (!formData.crm) {
        newErrors.crm = 'Let us know which CRM you currently rely on.';
      }

      if (!formData.notificationEmail.trim()) {
        newErrors.notificationEmail = 'Provide an email so we can send workflow updates.';
      }
    }

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length) {
      setErrors(newErrors);
      scrollToError(errorKeys);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(3, prev + 1));
    }
  };

  const handlePrevious = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateStep(step)) {
      // TODO: Wire up onboarding submission.
      console.log('Onboarding complete', formData);
    }
  };

  const renderError = (field) =>
    errors[field] ? (
      <p className="mt-2 text-sm text-red-600" id={`${field}-error`}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">Onboarding</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Welcome! Let's get you set up.</h1>
          <p className="mt-2 text-base text-gray-600 sm:w-3/4">
            We just need a few details to personalize your AgentMarket experience. You can update any of this
            information later.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/80 bg-white/95 shadow-xl backdrop-blur-sm"
        >
          <div className="rounded-t-3xl border-b border-gray-100 bg-gray-50/80 px-4 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                  Step {step} of 3
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">
                  {step === 1 && 'Tell us about your company'}
                  {step === 2 && 'Configure your lead scoring preferences'}
                  {step === 3 && 'Connect your workflow'}
                </h2>
              </div>
              <div className="flex flex-1 items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">{Math.round((step / 3) * 100)}% complete</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyName"
                    ref={fieldRefs.companyName}
                    type="text"
                    autoComplete="organization"
                    value={formData.companyName}
                    onChange={handleInputChange('companyName')}
                    aria-invalid={Boolean(errors.companyName)}
                    aria-describedby={errors.companyName ? 'companyName-error' : undefined}
                    className={`mt-2 block w-full rounded-xl border px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 sm:text-sm ${
                      errors.companyName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Acme Inc."
                  />
                  {renderError('companyName')}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                      Company Website
                    </label>
                    <input
                      id="companyWebsite"
                      type="url"
                      autoComplete="url"
                      value={formData.companyWebsite}
                      onChange={handleInputChange('companyWebsite')}
                      className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 sm:text-sm"
                      placeholder="https://acme.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="industry"
                      ref={fieldRefs.industry}
                      value={formData.industry}
                      onChange={handleInputChange('industry')}
                      aria-invalid={Boolean(errors.industry)}
                      aria-describedby={errors.industry ? 'industry-error' : undefined}
                      className={`mt-2 block w-full rounded-xl border px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 sm:text-sm ${
                        errors.industry ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="" disabled hidden>
                        Select an industry
                      </option>
                      <option value="technology">Technology</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="other">Other</option>
                    </select>
                    {renderError('industry')}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                      Company Size <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="companySize"
                      ref={fieldRefs.companySize}
                      value={formData.companySize}
                      onChange={handleInputChange('companySize')}
                      aria-invalid={Boolean(errors.companySize)}
                      aria-describedby={errors.companySize ? 'companySize-error' : undefined}
                      className={`mt-2 block w-full rounded-xl border px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 sm:text-sm ${
                        errors.companySize ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="" disabled hidden>
                        Select range
                      </option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                    {renderError('companySize')}
                  </div>

                  <div>
                    <label htmlFor="primaryGoal" className="block text-sm font-medium text-gray-700">
                      Primary Goal <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="primaryGoal"
                      ref={fieldRefs.primaryGoal}
                      type="text"
                      value={formData.primaryGoal}
                      onChange={handleInputChange('primaryGoal')}
                      aria-invalid={Boolean(errors.primaryGoal)}
                      aria-describedby={errors.primaryGoal ? 'primaryGoal-error' : undefined}
                      className={`mt-2 block w-full rounded-xl border px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 sm:text-sm ${
                        errors.primaryGoal ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                      placeholder="e.g. Identify enterprise leads faster"
                    />
                    {renderError('primaryGoal')}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="idealCustomerProfile" className="block text-sm font-medium text-gray-700">
                    Who is your ideal customer? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="idealCustomerProfile"
                    ref={fieldRefs.idealCustomerProfile}
                    value={formData.idealCustomerProfile}
                    onChange={handleInputChange('idealCustomerProfile')}
                    rows={4}
                    aria-invalid={Boolean(errors.idealCustomerProfile)}
                    aria-describedby={errors.idealCustomerProfile ? 'idealCustomerProfile-error' : undefined}
                    className={`mt-2 block w-full rounded-xl border px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 sm:text-sm ${
                      errors.idealCustomerProfile ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Share job titles, industries, regions or account traits that signal a great fit."
                  />
                  {renderError('idealCustomerProfile')}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Which signals should influence scoring? <span className="text-red-500">*</span>
                  </p>
                  <div
                    ref={fieldRefs.scoringFocus}
                    className={`mt-3 grid gap-3 sm:grid-cols-2 ${errors.scoringFocus ? 'rounded-xl border border-red-300 p-3' : ''}`}
                  >
                    {scoringOptions.map((option) => {
                      const checked = formData.scoringFocus.includes(option);
                      return (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-center rounded-xl border px-3 py-3 text-sm transition shadow-sm ${
                            checked
                              ? 'border-orange-200 bg-orange-50/80 text-orange-700'
                              : 'border-gray-200 bg-white hover:border-orange-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mr-3 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            checked={checked}
                            onChange={() => handleCheckboxToggle('scoringFocus', option)}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                  {renderError('scoringFocus')}
                </div>

                <div>
                  <label htmlFor="scoringNotes" className="block text-sm font-medium text-gray-700">
                    Any other context our AI should know? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="scoringNotes"
                    ref={fieldRefs.scoringNotes}
                    value={formData.scoringNotes}
                    onChange={handleInputChange('scoringNotes')}
                    rows={4}
                    aria-invalid={Boolean(errors.scoringNotes)}
                    aria-describedby={errors.scoringNotes ? 'scoringNotes-error' : undefined}
                    className={`mt-2 block w-full rounded-xl border px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 sm:text-sm ${
                      errors.scoringNotes ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Share playbooks, deal breakers, or manual checks you do today."
                  />
                  {renderError('scoringNotes')}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="crm" className="block text-sm font-medium text-gray-700">
                    Which CRM do you currently use? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="crm"
                    ref={fieldRefs.crm}
                    value={formData.crm}
                    onChange={handleInputChange('crm')}
                    aria-invalid={Boolean(errors.crm)}
                    aria-describedby={errors.crm ? 'crm-error' : undefined}
                    className={`mt-2 block w-full rounded-xl border px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 sm:text-sm ${
                      errors.crm ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="" disabled hidden>
                      Select CRM
                    </option>
                    <option value="hubspot">HubSpot</option>
                    <option value="salesforce">Salesforce</option>
                    <option value="pipedrive">Pipedrive</option>
                    <option value="close">Close.io</option>
                    <option value="none">We do not use a CRM yet</option>
                  </select>
                  {renderError('crm')}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Where should we send qualified lead alerts?</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {integrationOptions.map((option) => {
                      const selected = formData.integrationSelections.includes(option);
                      return (
                        <button
                          type="button"
                          key={option}
                          onClick={() => handleCheckboxToggle('integrationSelections', option)}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition sm:text-base ${
                            selected
                              ? 'border-orange-300 bg-orange-50/70 text-orange-700 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-orange-200'
                          }`}
                        >
                          <span>{option}</span>
                          <span
                            className={`ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                              selected
                                ? 'border-orange-400 bg-orange-100 text-orange-600'
                                : 'border-gray-200 bg-gray-100 text-gray-400'
                            }`}
                          >
                            {selected ? '✓' : '+'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="notificationEmail" className="block text-sm font-medium text-gray-700">
                    Notification Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="notificationEmail"
                    ref={fieldRefs.notificationEmail}
                    type="email"
                    autoComplete="email"
                    value={formData.notificationEmail}
                    onChange={handleInputChange('notificationEmail')}
                    aria-invalid={Boolean(errors.notificationEmail)}
                    aria-describedby={errors.notificationEmail ? 'notificationEmail-error' : undefined}
                    className={`mt-2 block w-full rounded-xl border px-4 py-3 text-base shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 sm:text-sm ${
                      errors.notificationEmail ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="team@acme.com"
                  />
                  {renderError('notificationEmail')}
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-orange-50/80 to-white p-5 text-sm text-orange-800">
                  <h3 className="text-base font-semibold text-orange-600">What happens next?</h3>
                  <ul className="mt-3 space-y-2 list-disc list-inside">
                    <li>We configure lead scoring with the inputs you provided.</li>
                    <li>You will receive a confirmation email within a few minutes.</li>
                    <li>Our team will follow up if we need additional details.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 rounded-b-3xl border-t border-gray-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                className={`inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                  step === 1 ? 'pointer-events-none opacity-0' : ''
                }`}
              >
                Previous
              </button>

              <button
                type={step === 3 ? 'submit' : 'button'}
                onClick={step === 3 ? undefined : handleNext}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:from-orange-600 hover:to-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                {step === 3 ? 'Finish setup' : 'Save & continue'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
