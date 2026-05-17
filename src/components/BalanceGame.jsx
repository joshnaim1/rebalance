import { useState } from 'react';
import TargetCaptureGame from './TargetCaptureGame';
import BalanceBirdGame from './BalanceBirdGame';
import DoodleJumpGame from './DoodleJumpGame';

const GAME_TABS = [
  { id: 'training', label: 'Balance Training' },
  { id: 'bird', label: 'Balance Bird' },
  { id: 'doodle', label: 'Balance Jump' },
];

export default function BalanceGame({ balance, onScoreUpdate }) {
  const [activeGame, setActiveGame] = useState('training');

  return (
    <div className="space-y-5">
      <h2 className="sr-only">Balance Game</h2>

      {/* Game sub-tab toggle */}
      <div className="flex items-center gap-1 bg-white border border-[#E8E5E0] rounded-lg p-1 w-fit"
           style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {GAME_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveGame(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeGame === tab.id
                ? 'bg-[#E8F8EF] text-[#1A5C42]'
                : 'text-[#6B7280] hover:text-[#1E293B] hover:bg-[#F9FAFB]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active game */}
      {activeGame === 'training' && (
        <TargetCaptureGame balance={balance} onScoreUpdate={onScoreUpdate} />
      )}
      {activeGame === 'bird' && (
        <BalanceBirdGame balance={balance} onScoreUpdate={onScoreUpdate} />
      )}
      {activeGame === 'doodle' && (
        <DoodleJumpGame balance={balance} onScoreUpdate={onScoreUpdate} />
      )}
    </div>
  );
}
