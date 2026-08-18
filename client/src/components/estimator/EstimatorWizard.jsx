import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import QuestionField from '../dynamic/QuestionField.jsx';

const STEP = { LOADING: 'loading', LOAD_ERROR: 'load_error', QUESTIONS: 'questions', CONTACT: 'contact', RESULT: 'result' };

function currencyFormat(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(
      amount
    );
  } catch {
    return `$${amount.toLocaleString()}`;
  }
}

export default function EstimatorWizard() {
  const [phase, setPhase] = useState(STEP.LOADING);
  const [config, setConfig] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api
      .getConfig()
      .then((data) => {
        setConfig(data);
        setPhase(STEP.QUESTIONS);
      })
      .catch(() => setPhase(STEP.LOAD_ERROR));
  }, []);

  if (phase === STEP.LOADING) {
    return (
      <div className="max-w-lg mx-auto p-10 text-center text-gray-500">
        <div className="animate-pulse">Loading the estimator…</div>
      </div>
    );
  }

  if (phase === STEP.LOAD_ERROR) {
    return (
      <div className="max-w-lg mx-auto p-10 text-center">
        <p className="text-red-600 font-medium mb-3">We couldn't load the estimator right now.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-brand text-white">
          Try again
        </button>
      </div>
    );
  }

  const questions = config.questions;
  const totalSteps = questions.length + 1; // + contact step
  const currentQuestion = questions[stepIndex];

  function updateAnswer(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateCurrentStep() {
    if (!currentQuestion) return true;
    const value = answers[currentQuestion.key];
    if (currentQuestion.required && (value === undefined || value === '' || value === null)) {
      setErrors((prev) => ({ ...prev, [currentQuestion.key]: 'This is required to continue.' }));
      return false;
    }
    if (currentQuestion.type === 'number') {
      const num = Number(value);
      if (currentQuestion.min != null && num < currentQuestion.min) {
        setErrors((prev) => ({ ...prev, [currentQuestion.key]: `Must be at least ${currentQuestion.min}.` }));
        return false;
      }
      if (currentQuestion.max != null && num > currentQuestion.max) {
        setErrors((prev) => ({ ...prev, [currentQuestion.key]: `Must be at most ${currentQuestion.max}.` }));
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    if (stepIndex < questions.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setPhase(STEP.CONTACT);
    }
  }

  function goBack() {
    if (phase === STEP.CONTACT) {
      setPhase(STEP.QUESTIONS);
      return;
    }
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  function validateContact() {
    const nextErrors = {};
    if (!contact.name.trim()) nextErrors.name = 'Name is required.';
    if (!contact.phone.trim()) nextErrors.phone = 'Phone is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) nextErrors.email = 'Enter a valid email.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateContact()) return;
    setSubmitting(true);
    try {
      const res = await api.submitEstimate({ ...contact, answers });
      setResult(res);
      setPhase(STEP.RESULT);
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        setErrors({ _global: err.message || 'Something went wrong. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const progress = phase === STEP.CONTACT ? totalSteps : stepIndex + 1;

  return (
    <div className="max-w-lg mx-auto p-6 sm:p-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{config.business?.name}</h1>
      <p className="text-gray-500 mb-6">Get a real cost range in under a minute.</p>

      {phase !== STEP.RESULT && (
        <div className="w-full h-2 bg-gray-100 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${(progress / totalSteps) * 100}%` }}
          />
        </div>
      )}

      {phase === STEP.QUESTIONS && currentQuestion && (
        <div className="space-y-6">
          <QuestionField
            question={currentQuestion}
            value={answers[currentQuestion.key]}
            onChange={updateAnswer}
            error={errors[currentQuestion.key]}
          />
          <div className="flex justify-between pt-2">
            <button
              onClick={goBack}
              disabled={stepIndex === 0}
              className="px-5 py-3 rounded-xl text-gray-500 disabled:opacity-0"
            >
              Back
            </button>
            <button onClick={goNext} className="px-6 py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark">
              {stepIndex === questions.length - 1 ? 'Continue' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {phase === STEP.CONTACT && (
        <div className="space-y-5">
          <p className="text-gray-500 -mt-2 mb-2">Last step — where should we send your estimate?</p>
          {errors._global && <p className="text-sm text-red-500">{errors._global}</p>}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-900">Full name</label>
            <input
              value={contact.name}
              onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
              className={`p-4 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand ${
                errors.name ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="Jane Homeowner"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-900">Phone</label>
            <input
              value={contact.phone}
              onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
              className={`p-4 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand ${
                errors.phone ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="+1-614-555-0100"
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-900">Email</label>
            <input
              value={contact.email}
              onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
              className={`p-4 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand ${
                errors.email ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="jane@example.com"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={goBack} className="px-5 py-3 rounded-xl text-gray-500">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-60"
            >
              {submitting ? 'Calculating…' : 'Get my estimate'}
            </button>
          </div>
        </div>
      )}

      {phase === STEP.RESULT && result && (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-2">Your estimated cost range</p>
          <p className="text-4xl font-bold text-brand mb-1">
            {currencyFormat(result.estimate_low, result.currency)} – {currencyFormat(result.estimate_high, result.currency)}
          </p>
          <p className="text-gray-400 text-sm mb-8">Final pricing confirmed after an on-site inspection.</p>
          <p className="text-gray-700">
            Thanks, {contact.name.split(' ')[0]} — someone from {config.business?.name} will reach out to {contact.phone}{' '}
            shortly.
          </p>
        </div>
      )}
    </div>
  );
}
