// The app half of the Full journey band. Kept out of the page component so the
// step ladder — which must stay monotonic and degrade cleanly on an old cached
// payload — can be tested.

export interface JourneyStage {
  label: string;
  value: number;
  note: string;
  accent?: boolean;
}

/** The funnel fields the app band reads. Wizard steps are optional: a payload
 *  cached before they shipped has none, and inventing zeros there would read as
 *  "nobody described a job" rather than "not measured yet". */
export interface AppFunnelSource {
  signups: number;
  startedTrial: number;
  describedJob?: number;
  addedCustomer?: number;
  addedMaterials?: number;
  reachedPreview?: number;
  sentQuote: number;
  paying: number;
}

/**
 * Signup → paying, with the quote wizard opened up in the middle.
 *
 * The trial starts when the quote builder is opened (createNewQuote calls
 * startTrialIfNeeded), so this step and "opened the builder" are the same
 * moment — everything between it and "Sent a quote" is a screen in the
 * wizard, which is what makes that stretch readable at all.
 *
 * It is deliberately NOT called "Started a trial". That label read as an
 * activation milestone, and it isn't one: the 2026-08 audit found 28 of 157
 * first quotes were throwaways (explicit "Test"/"ABC" customers, $0 totals, or
 * no customer name and no contact details at all), and NONE of those 28 users
 * ever paid — against 5% of the users whose first quote was real work. Reading
 * it as activation overstated the funnel by roughly a fifth.
 *
 * "Sent a quote" is the activation gate. analyticsService.ts has said so since
 * the July audit: sending IS the activation event, and only ~24% of
 * quote-creators have ever sent one.
 */
export function buildAppStages(source: AppFunnelSource | null | undefined): JourneyStage[] {
  if (!source) return [];

  const wizard: JourneyStage[] =
    source.describedJob === undefined
      ? []
      : [
          { label: 'Described the job', value: source.describedJob, note: 'first draft saved' },
          { label: 'Added a customer', value: source.addedCustomer ?? 0, note: 'customer details filled in' },
          { label: 'Added materials', value: source.addedMaterials ?? 0, note: 'materials list done' },
          { label: 'Reached the preview', value: source.reachedPreview ?? 0, note: 'finished, ready to send' },
        ];

  return [
    { label: 'Signed up', value: source.signups, note: 'account created' },
    { label: 'Made a first quote', value: source.startedTrial, note: 'opened the builder — starts the trial clock, not proof of value' },
    ...wizard,
    { label: 'Sent a quote', value: source.sentQuote, note: 'went to a customer' },
    { label: 'Paying', value: source.paying, note: 'billed subscription', accent: true },
  ];
}

/** True once the payload carries the wizard breakdown. */
export function hasWizardDetail(source: AppFunnelSource | null | undefined): boolean {
  return !!source && source.describedJob !== undefined;
}
