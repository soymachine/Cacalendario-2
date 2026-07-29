// Deterministic color assignment for patient tags.
// Shared between the web /medics dashboard and the native doctor app.

const TAG_PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'];
const TAG_COLORS: Record<string, string> = {};

export function tagColor(tag: string): string {
  if (!TAG_COLORS[tag]) {
    let h = 0;
    for (const c of tag) h = (h * 31 + c.charCodeAt(0)) % TAG_PALETTE.length;
    TAG_COLORS[tag] = TAG_PALETTE[h];
  }
  return TAG_COLORS[tag];
}
