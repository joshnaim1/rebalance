import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: accessibility-interactive-ui, Property 20: Page Transition Content Availability
 * For any tab change, the incoming content SHALL be present in the DOM and not have
 * aria-hidden="true" or display:none during the transition animation, ensuring assistive
 * technologies can access it immediately regardless of visual animation state.
 *
 * Validates: Requirements 16.3
 */

// Mock useReducedMotion to control animation state
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import PageTransition from '../PageTransition';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Arbitrary: generate pairs of distinct tab keys to simulate tab changes
const tabKeyPairArb = fc
  .tuple(
    fc.constantFrom('balance', 'game', 'sessions', 'progress', 'profile'),
    fc.constantFrom('balance', 'game', 'sessions', 'progress', 'profile')
  )
  .filter(([a, b]) => a !== b);

// Arbitrary: generate a single tab key
const tabKeyArb = fc.constantFrom('balance', 'game', 'sessions', 'progress', 'profile');

// Arbitrary: reduced motion state
const reducedMotionArb = fc.boolean();

describe('Feature: accessibility-interactive-ui, Property 20: Page Transition Content Availability', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('content is always in the DOM and accessible during transition animation', () => {
    fc.assert(
      fc.property(tabKeyPairArb, reducedMotionArb, ([fromKey, toKey], reducedMotion) => {
        useReducedMotion.mockReturnValue(reducedMotion);

        const childContent = `Content for ${toKey}`;

        // First render with the initial key
        const { container, rerender } = render(
          <PageTransition activeKey={fromKey}>
            <div data-testid="tab-content">{`Content for ${fromKey}`}</div>
          </PageTransition>
        );

        // Re-render with the new key (simulating tab change)
        rerender(
          <PageTransition activeKey={toKey}>
            <div data-testid="tab-content">{childContent}</div>
          </PageTransition>
        );

        // The content wrapper div should exist
        const wrapper = container.firstChild;
        expect(wrapper).not.toBeNull();

        // Content should be present in the DOM
        const content = container.querySelector('[data-testid="tab-content"]');
        expect(content).not.toBeNull();
        expect(content.textContent).toBe(childContent);

        // Content should NOT have aria-hidden="true"
        expect(content.getAttribute('aria-hidden')).not.toBe('true');
        expect(wrapper.getAttribute('aria-hidden')).not.toBe('true');

        // Content should NOT have display:none
        const wrapperStyle = wrapper.style;
        expect(wrapperStyle.display).not.toBe('none');

        // Content should NOT have visibility:hidden
        expect(wrapperStyle.visibility).not.toBe('hidden');
      }),
      { numRuns: 100 }
    );
  });

  it('content is immediately available on initial render regardless of animation state', () => {
    fc.assert(
      fc.property(tabKeyArb, reducedMotionArb, (key, reducedMotion) => {
        useReducedMotion.mockReturnValue(reducedMotion);

        const childContent = `Initial content for ${key}`;

        const { container } = render(
          <PageTransition activeKey={key}>
            <div data-testid="tab-content">{childContent}</div>
          </PageTransition>
        );

        // Content should be in the DOM immediately
        const content = container.querySelector('[data-testid="tab-content"]');
        expect(content).not.toBeNull();
        expect(content.textContent).toBe(childContent);

        // Wrapper should not hide content from assistive tech
        const wrapper = container.firstChild;
        expect(wrapper.getAttribute('aria-hidden')).not.toBe('true');
        expect(wrapper.style.display).not.toBe('none');
        expect(wrapper.style.visibility).not.toBe('hidden');
      }),
      { numRuns: 100 }
    );
  });
});
