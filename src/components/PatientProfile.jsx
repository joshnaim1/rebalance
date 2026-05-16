import { useState } from 'react';
import { getProfile, saveProfile } from '../utils/storage';

export default function PatientProfile({ onNameChange }) {
  const [profile, setProfile] = useState(() => getProfile());
  const [saved, setSaved] = useState(false);

  function handleChange(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
    setSaved(false);
  }

  function handleSave(e) {
    e.preventDefault();
    saveProfile(profile);
    setSaved(true);
    if (onNameChange) onNameChange(profile.name);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl mx-auto space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Patient Name</label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter patient name"
          className="w-full px-4 py-2.5 rounded-lg bg-card border border-card-border
                     text-text-primary placeholder-text-muted focus:outline-none
                     focus:border-balanced transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Stroke Date</label>
        <input
          type="date"
          value={profile.strokeDate}
          onChange={(e) => handleChange('strokeDate', e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-card border border-card-border
                     text-text-primary focus:outline-none focus:border-balanced transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Affected Side</label>
        <div className="flex gap-3">
          {['Left', 'Right', 'Both'].map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => handleChange('affectedSide', side.toLowerCase())}
              className={`flex-1 py-2.5 rounded-lg border font-medium transition-colors ${
                profile.affectedSide === side.toLowerCase()
                  ? 'bg-balanced/10 border-balanced/50 text-balanced'
                  : 'bg-card border-card-border text-text-muted hover:text-text-secondary'
              }`}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Therapy Goals</label>
        <textarea
          value={profile.goals}
          onChange={(e) => handleChange('goals', e.target.value)}
          placeholder="e.g., Stand unassisted for 60 seconds, walk 20 steps without aid"
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg bg-card border border-card-border
                     text-text-primary placeholder-text-muted focus:outline-none
                     focus:border-balanced transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Notes</label>
        <textarea
          value={profile.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg bg-card border border-card-border
                     text-text-primary placeholder-text-muted focus:outline-none
                     focus:border-balanced transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-balanced text-bg font-semibold text-lg
                   hover:bg-balanced/90 transition-colors"
      >
        {saved ? 'Saved!' : 'Save Profile'}
      </button>
    </form>
  );
}
