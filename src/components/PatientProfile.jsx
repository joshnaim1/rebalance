import { useState } from 'react';
import { getProfile, saveProfile } from '../utils/storage';
import { useReducedMotion } from '../hooks/useReducedMotion';
import FeelingCards, { PAIN_OPTIONS, FATIGUE_OPTIONS, DIZZINESS_OPTIONS, CONFIDENCE_OPTIONS } from './FeelingCards';
import PrivacyBanner from './PrivacyBanner';
import PrivacyPanel from './PrivacyPanel';

const PRONOUN_SUGGESTIONS = ['he/him', 'she/her', 'they/them'];

const QUICK_GOAL_OPTIONS = [
  'Stand 60s',
  'Walk 20 steps',
  'Balance 30s',
  'Climb stairs',
];

function BodySilhouette({ side, isSelected, onClick }) {
  const leftHighlight = side === 'left' || side === 'both';
  const rightHighlight = side === 'right' || side === 'both';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`relative flex-1 flex flex-col items-center gap-2 py-4 rounded-lg transition-colors ${
        isSelected
          ? 'bg-balanced-soft border-2 border-balanced text-balanced-text font-semibold'
          : 'bg-card border border-card-border text-text-secondary font-medium hover:text-text-primary'
      }`}
    >
      {isSelected && (
        <svg className="absolute top-1.5 right-1.5 w-4 h-4 text-balanced-text" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <svg
        aria-hidden="true"
        width="40"
        height="64"
        viewBox="0 0 40 64"
        fill="none"
        className="shrink-0"
      >
        {/* Head */}
        <circle cx="20" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        {/* Body center line */}
        <line x1="20" y1="14" x2="20" y2="38" stroke="currentColor" strokeWidth="1.5" />
        {/* Left arm */}
        <line
          x1="20" y1="20" x2="8" y2="30"
          stroke={leftHighlight ? '#4ADE80' : 'currentColor'}
          strokeWidth={leftHighlight ? '2.5' : '1.5'}
        />
        {/* Right arm */}
        <line
          x1="20" y1="20" x2="32" y2="30"
          stroke={rightHighlight ? '#4ADE80' : 'currentColor'}
          strokeWidth={rightHighlight ? '2.5' : '1.5'}
        />
        {/* Left leg */}
        <line
          x1="20" y1="38" x2="12" y2="58"
          stroke={leftHighlight ? '#4ADE80' : 'currentColor'}
          strokeWidth={leftHighlight ? '2.5' : '1.5'}
        />
        {/* Right leg */}
        <line
          x1="20" y1="38" x2="28" y2="58"
          stroke={rightHighlight ? '#4ADE80' : 'currentColor'}
          strokeWidth={rightHighlight ? '2.5' : '1.5'}
        />
        {/* Highlight fill for affected side */}
        {leftHighlight && (
          <rect x="2" y="14" width="18" height="46" rx="4" fill="#4ADE80" opacity="0.1" />
        )}
        {rightHighlight && (
          <rect x="20" y="14" width="18" height="46" rx="4" fill="#4ADE80" opacity="0.1" />
        )}
      </svg>
      <span>{side === 'both' ? 'Both' : side === 'left' ? 'Left' : 'Right'}</span>
    </button>
  );
}

function SaveConfirmation({ reducedMotion }) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${
        reducedMotion ? '' : 'animate-save-confirm'
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className={`text-balanced ${reducedMotion ? '' : 'animate-checkmark'}`}
      >
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
        <path
          d="M6 10l3 3 5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>All saved! You're all set. ✓</span>
    </span>
  );
}

export default function PatientProfile({ onNameChange }) {
  const [profile, setProfile] = useState(() => getProfile());
  const [saved, setSaved] = useState(false);
  const reducedMotion = useReducedMotion();

  function handleChange(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
    setSaved(false);
  }

  function handleQuickGoalToggle(goal) {
    setProfile((p) => {
      const current = p.quickGoals || [];
      const updated = current.includes(goal)
        ? current.filter((g) => g !== goal)
        : [...current, goal];
      return { ...p, quickGoals: updated };
    });
    setSaved(false);
  }

  function handleFeelingChange(type, value) {
    setProfile((p) => ({
      ...p,
      feelingToday: { ...(p.feelingToday || {}), [type]: value },
    }));
    setSaved(false);
  }

  function handleSave(e) {
    e.preventDefault();
    saveProfile(profile);
    setSaved(true);
    if (onNameChange) onNameChange(profile.preferredName || profile.name);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Privacy Banner - full width at top */}
      <PrivacyBanner />

      {/* Two-column responsive grid: 65%/35% on desktop, single-column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
        {/* Left column: Form sections */}
        <form onSubmit={handleSave} className="space-y-8">
          {/* Identity Section */}
          <section aria-labelledby="identity-heading">
            <h2 id="identity-heading" className="text-lg font-bold text-text-primary mb-4">
              Identity
            </h2>
            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label htmlFor="profile-display-name" className="block text-sm font-medium text-text-secondary mb-1.5">Display name</label>
                <input
                  id="profile-display-name"
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter display name"
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-card-border
                             text-text-primary placeholder:text-text-muted focus:outline-none
                             focus:border-balanced transition-colors"
                />
                <p className="text-xs text-text-secondary mt-1">How you'd like to be addressed during sessions</p>
              </div>

              {/* Preferred Name */}
              <div>
                <label htmlFor="profile-preferred-name" className="block text-sm font-medium text-text-secondary mb-1.5">Name in use</label>
                <input
                  id="profile-preferred-name"
                  type="text"
                  value={profile.preferredName}
                  onChange={(e) => handleChange('preferredName', e.target.value)}
                  placeholder="Preferred name"
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-card-border
                             text-text-primary placeholder:text-text-muted focus:outline-none
                             focus:border-balanced transition-colors"
                />
              </div>

              {/* Pronouns */}
              <div>
                <label htmlFor="profile-pronouns" className="block text-sm font-medium text-text-secondary mb-1.5">Pronouns (optional)</label>
                <input
                  id="profile-pronouns"
                  type="text"
                  value={profile.pronouns}
                  onChange={(e) => handleChange('pronouns', e.target.value)}
                  placeholder="e.g., they/them"
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-card-border
                             text-text-primary placeholder:text-text-muted focus:outline-none
                             focus:border-balanced transition-colors mb-2"
                />
                <p className="text-xs text-text-secondary mt-1 mb-2">Used in session notes and summaries</p>
                <div className="flex gap-2 flex-wrap">
                  {PRONOUN_SUGGESTIONS.map((p) => {
                    const isSelected = profile.pronouns === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleChange('pronouns', p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-full transition-colors min-h-11 ${
                          isSelected
                            ? 'border-2 border-balanced bg-balanced-soft text-balanced-text font-semibold'
                            : 'border border-card-border bg-card text-text-secondary font-medium hover:text-text-primary hover:border-text-secondary'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-4 h-4 text-balanced-text" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Recovery Context Section */}
          <section aria-labelledby="recovery-context-heading">
            <h2 id="recovery-context-heading" className="text-lg font-bold text-text-primary mb-4">
              Recovery Context
            </h2>
            <div className="space-y-4">
              {/* Stroke Date */}
              <div>
                <label htmlFor="profile-stroke-date" className="block text-sm font-medium text-text-secondary mb-1.5">Stroke Date</label>
                <input
                  id="profile-stroke-date"
                  type="date"
                  value={profile.strokeDate}
                  onChange={(e) => handleChange('strokeDate', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-card-border
                             text-text-primary focus:outline-none focus:border-balanced transition-colors"
                />
              </div>

              {/* Affected Side */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Affected Side</label>
                <div className="flex gap-3">
                  {['left', 'right', 'both'].map((side) => (
                    <BodySilhouette
                      key={side}
                      side={side}
                      isSelected={profile.affectedSide === side}
                      onClick={() => handleChange('affectedSide', side)}
                    />
                  ))}
                </div>
              </div>

              {/* Quick-select Goal Cards */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Quick Goals</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {QUICK_GOAL_OPTIONS.map((goal) => {
                    const isSelected = (profile.quickGoals || []).includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleQuickGoalToggle(goal)}
                        className={`relative inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? 'border-2 border-balanced bg-balanced-soft text-balanced-text font-semibold'
                            : 'border border-card-border bg-card text-text-secondary font-medium hover:text-text-primary hover:border-text-secondary'
                        }`}
                      >
                        {isSelected && (
                          <svg className="absolute top-1.5 right-1.5 w-4 h-4 text-balanced-text" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Therapy Goals (free text) */}
              <div>
                <label htmlFor="profile-therapy-goals" className="block text-sm font-medium text-text-secondary mb-1.5">Therapy Goals</label>
                <textarea
                  id="profile-therapy-goals"
                  value={profile.goals}
                  onChange={(e) => handleChange('goals', e.target.value)}
                  placeholder="e.g., Stand unassisted for 60 seconds, walk 20 steps without aid"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-card-border
                             text-text-primary placeholder:text-text-muted focus:outline-none
                             focus:border-balanced transition-colors resize-none"
                />
              </div>
            </div>
          </section>

          {/* Self-Report Section */}
          <section aria-labelledby="self-report-heading">
            <h2 id="self-report-heading" className="text-lg font-bold text-text-primary mb-4">
              Self-Report
            </h2>
            <div className="space-y-4">
              <FeelingCards
                options={PAIN_OPTIONS}
                selected={profile.feelingToday?.pain || null}
                onSelect={(value) => handleFeelingChange('pain', value)}
                label="Pain level"
              />
              <FeelingCards
                options={FATIGUE_OPTIONS}
                selected={profile.feelingToday?.fatigue || null}
                onSelect={(value) => handleFeelingChange('fatigue', value)}
                label="Fatigue level"
              />
              <FeelingCards
                options={DIZZINESS_OPTIONS}
                selected={profile.feelingToday?.dizziness || null}
                onSelect={(value) => handleFeelingChange('dizziness', value)}
                label="Dizziness level"
              />
              <FeelingCards
                options={CONFIDENCE_OPTIONS}
                selected={profile.feelingToday?.confidence || null}
                onSelect={(value) => handleFeelingChange('confidence', value)}
                label="Confidence level"
              />
            </div>
          </section>

          {/* Notes */}
          <div>
            <label htmlFor="profile-notes" className="block text-sm font-medium text-text-secondary mb-1.5">Notes</label>
            <textarea
              id="profile-notes"
              value={profile.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-card-border
                         text-text-primary placeholder:text-text-muted focus:outline-none
                         focus:border-balanced transition-colors resize-none"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-balanced-text text-white font-semibold text-lg
                       hover:bg-balanced-text/90 transition-colors"
          >
            {saved ? <SaveConfirmation reducedMotion={reducedMotion} /> : 'Save Profile'}
          </button>

          {/* Accessible save announcement */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {saved ? 'Profile saved' : ''}
          </div>
        </form>

        {/* Right column: Privacy Panel (sticky sidebar on desktop, below form on mobile) */}
        <aside className="lg:self-start">
          <PrivacyPanel />
        </aside>
      </div>
    </div>
  );
}
