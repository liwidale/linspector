import type { Finding } from '../../core/types';
import { severityRank, type Ctx } from '../context';
import { el } from '../dom';
import { copyValue, emptyState, iconButton, pill, severityBadge } from '../parts';
import * as icons from '../icons';

const buildFinding = (finding: Finding): HTMLElement =>
  el('div', { class: 'finding' }, [
    el('div', { class: 'finding-head' }, [
      severityBadge(finding.severity),
      el('span', { class: 'finding-title', text: finding.title }),
      el('span', { class: 'finding-cat', text: finding.category }),
      iconButton(icons.copy, 'Copy evidence', () => void copyValue(finding.evidence)),
    ]),
    el('div', { class: 'finding-detail', text: finding.detail }),
    el('div', { class: 'finding-host', text: finding.host }),
    el('pre', { class: 'finding-evidence', text: finding.evidence }),
  ]);

export const renderScanner = (ctx: Ctx, body: HTMLElement): void => {
  const query = ctx.ui.query.toLowerCase();
  const findings = ctx.store
    .getState()
    .findings.filter(
      (finding) =>
        !query ||
        finding.title.toLowerCase().includes(query) ||
        finding.host.toLowerCase().includes(query) ||
        finding.category.includes(query),
    )
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  if (findings.length === 0) {
    body.append(
      emptyState(
        ctx.ui.query ? 'No matches' : 'No findings yet',
        'The passive scanner audits JWT, secrets, stack traces, CORS and security headers as traffic flows.',
      ),
    );
    return;
  }

  const counts = { high: 0, medium: 0, low: 0, info: 0 };
  for (const finding of findings) counts[finding.severity] += 1;

  body.append(
    el('div', { class: 'toolbar' }, [
      el('span', {
        class: 'toolbar-label',
        text: `${counts.high} high · ${counts.medium} medium · ${counts.low} low`,
      }),
      pill('Clear', () => ctx.store.clearFindings(), 'danger'),
    ]),
  );

  for (const finding of findings) body.append(buildFinding(finding));
};
