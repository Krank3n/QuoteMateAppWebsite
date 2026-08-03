import { describe, it, expect } from 'vitest';
import { buildAppStages, hasWizardDetail, type AppFunnelSource } from './journeyStages';

const full: AppFunnelSource = {
  signups: 134,
  startedTrial: 82,
  describedJob: 61,
  addedCustomer: 54,
  addedMaterials: 38,
  reachedPreview: 30,
  sentQuote: 22,
  paying: 2,
};

describe('buildAppStages', () => {
  it('opens the trial→sent stretch into the wizard screens', () => {
    expect(buildAppStages(full).map((s) => s.label)).toEqual([
      'Signed up',
      'Started a trial',
      'Described the job',
      'Added a customer',
      'Added materials',
      'Reached the preview',
      'Sent a quote',
      'Paying',
    ]);
  });

  it('never rises from one step to the next, so "lost here" is never negative', () => {
    const values = buildAppStages(full).map((s) => s.value);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
  });

  it('keeps the four original steps intact', () => {
    const stages = buildAppStages(full);
    expect(stages[0].value).toBe(134);
    expect(stages[1].value).toBe(82);
    expect(stages[stages.length - 2].value).toBe(22);
    expect(stages[stages.length - 1]).toMatchObject({ value: 2, accent: true });
  });

  // A payload cached before the wizard steps shipped has no such fields.
  // Rendering zeros there would show a funnel that collapses to nothing.
  it('falls back to the four-step ladder on an old cached payload', () => {
    const { describedJob, addedCustomer, addedMaterials, reachedPreview, ...legacy } = full;
    expect(buildAppStages(legacy).map((s) => s.label)).toEqual([
      'Signed up',
      'Started a trial',
      'Sent a quote',
      'Paying',
    ]);
    expect(hasWizardDetail(legacy)).toBe(false);
    expect(hasWizardDetail(full)).toBe(true);
  });

  it('treats a partially populated payload as measured, defaulting the gaps to zero', () => {
    const partial = { ...full, addedMaterials: undefined, reachedPreview: undefined };
    const stages = buildAppStages(partial);
    expect(stages.find((s) => s.label === 'Added materials')?.value).toBe(0);
    expect(stages).toHaveLength(8);
  });

  it('returns nothing without a source', () => {
    expect(buildAppStages(null)).toEqual([]);
    expect(hasWizardDetail(null)).toBe(false);
  });
});
