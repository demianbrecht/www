// Illustrative Claude Code session based on pr-council-mcp's README example
// and the lifecycle tools in src/pr_council/tools/review.py.
export interface CastEvent {
  at: number;
  text: string;
  tone: 'shell' | 'prompt' | 'tool' | 'status' | 'finding' | 'note';
  typeDuration?: number;
}

export const prCouncilCast: CastEvent[] = [
  { at: 0, text: '$ claude', tone: 'shell' },
  {
    at: 0.8,
    text: '> Use pr-council-mcp to review https://github.com/acme/widgets/pull/123.',
    tone: 'prompt',
    typeDuration: 2.4,
  },
  {
    at: 3.3,
    text: '  Focus on authorization boundaries and regressions. Show me the review before publishing it.',
    tone: 'prompt',
    typeDuration: 2.2,
  },
  { at: 5.9, text: '● pr_council_start', tone: 'tool' },
  { at: 6.6, text: '  ↳ queued · durable operation created', tone: 'status' },
  { at: 8.0, text: '● pr_council_get', tone: 'tool' },
  { at: 8.7, text: '  ↳ reviewing · quality and security models inspect pinned source', tone: 'status' },
  { at: 10.5, text: '● pr_council_get', tone: 'tool' },
  { at: 11.2, text: '  ↳ deliberating · findings checked by disposition', tone: 'status' },
  { at: 12.8, text: '● pr_council_get', tone: 'tool' },
  { at: 13.5, text: '  ↳ aggregating · overlapping findings reconciled', tone: 'status' },
  { at: 15.1, text: '● pr_council_get', tone: 'tool' },
  { at: 15.8, text: '  ↳ ready · preview available', tone: 'status' },
  { at: 17.1, text: '● pr_council_preview', tone: 'tool' },
  { at: 17.9, text: '  Review preview for PR #123 · revision 1', tone: 'note' },
  { at: 18.7, text: '  HIGH    Update path does not enforce repository membership.', tone: 'finding' },
  { at: 19.5, text: '  MEDIUM  Retries can create duplicate audit records.', tone: 'finding' },
  { at: 20.6, text: '  Nothing has been published.', tone: 'note' },
  { at: 22.1, text: '> Publish that review.', tone: 'prompt', typeDuration: 1.4 },
  { at: 24.0, text: '● pr_council_commit · approved revision + payload hash', tone: 'tool' },
  { at: 24.8, text: '  ↳ commit_queued · publication started', tone: 'status' },
  { at: 26.0, text: '● pr_council_get', tone: 'tool' },
  { at: 26.8, text: '  ↳ completed · PR revision and preview revalidated', tone: 'status' },
  { at: 28.0, text: '  Published inline comments and a COMMENT-only summary to PR #123.', tone: 'note' },
];

export const prCouncilCastDuration = 30;
