import { useState, useEffect, useRef, useCallback } from 'react';
import { saveProfile, getProfile } from '../utils/storage';
import ReBalanceLogo from './ReBalanceLogo';

const STEPS = ['Welcome', 'Name', 'Affected Side', 'Goals', 'Ready'];

export default function GettingStartedWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [affectedSide, setAffectedSide] = useState('');
  const [goals, setGoals] = useState('');
  const dialogRef = useRef(null);
  const headingId = 'wizard-heading';

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function handleKeyDown(e) {
      if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll(focusableSelector);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element on mount
    const focusable = dialog.querySelectorAll(focusableSelector);
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [step]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleComplete = useCallback(() => {
    const profile = getProfile();
    const updatedProfile = {
      ...profile,
      name: name || profile.name,
      affectedSide: affectedSide || profile.affectedSide,
      goals: goals || profile.goals,
    };
    saveProfile(updatedProfile);
    onComplete(updatedProfile.name);
  }, [name, affectedSide, goals, onComplete]);

  const renderStepContent = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-4">
            <ReBalanceLogo className="h-24 w-24 md:h-28 md:w-28 mx-auto" zoom={5} />
            <p className="text-lg text-text-secondary">
              Welcome to ReBalance! Let&apos;s get you set up for your balance therapy journey.
            </p>
            <p className="text-text-secondary">
              This will only take a moment.
            </p>
          </div>
        );
      case 1: // Name
        return (
          <div className="space-y-4">
            <label htmlFor="wizard-name" className="block text-sm font-medium text-text-secondary">
              What should we call you?
            </label>
            <input
              id="wizard-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg bg-card border border-card-border
                         text-text-primary placeholder:text-text-muted
                         focus:outline-none focus:ring-2 focus:ring-balanced"
            />
          </div>
        );
      case 2: // Affected Side
        return (
          <div className="space-y-4">
            <p className="text-sm font-medium text-text-secondary">
              Which side is affected?
            </p>
            <div className="flex gap-4 justify-center">
              {['left', 'right', 'both'].map((side) => (
                <button
                  key={side}
                  onClick={() => setAffectedSide(side)}
                  className={`px-6 py-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    affectedSide === side
                      ? 'bg-balanced/20 border-balanced text-balanced'
                      : 'bg-card border-card-border text-text-secondary hover:border-text-muted'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        );
      case 3: // Goals
        return (
          <div className="space-y-4">
            <label htmlFor="wizard-goals" className="block text-sm font-medium text-text-secondary">
              What are your therapy goals?
            </label>
            <textarea
              id="wizard-goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g., Stand for 60 seconds, Walk 20 steps..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-card border border-card-border
                         text-text-primary placeholder:text-text-muted
                         focus:outline-none focus:ring-2 focus:ring-balanced resize-none"
            />
          </div>
        );
      case 4: // Ready
        return (
          <div className="text-center space-y-4">
            <p className="text-lg text-text-secondary">
              You&apos;re all set{name ? `, ${name}` : ''}! 🎉
            </p>
            <p className="text-text-secondary">
              Connect your balance board to get started, or try Demo Mode to explore.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="bg-card border border-card-border rounded-2xl shadow-xl
                   w-full max-w-md mx-4 p-8 space-y-6"
      >
        {/* Progress indicator */}
        <p className="text-xs text-text-secondary text-center">
          Step {step + 1} of {STEPS.length}
        </p>

        {/* Heading */}
        <h2 id={headingId} className="text-xl font-bold text-center">
          {STEPS[step]}
        </h2>

        {/* Step content */}
        {renderStepContent()}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="px-4 py-2.5 text-sm rounded-lg border border-card-border text-text-secondary
                       hover:text-text-primary transition-colors min-h-11
                       disabled:opacity-0 disabled:pointer-events-none"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 text-sm font-medium rounded-lg min-h-11
                         bg-balanced text-bg hover:bg-balanced/90 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2.5 text-sm font-medium rounded-lg min-h-11
                         bg-balanced text-bg hover:bg-balanced/90 transition-colors"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
