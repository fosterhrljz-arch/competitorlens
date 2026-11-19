export const SOURCE_METHODS = {
  pasted: 'User-supplied excerpt (URL provided)', fetched: 'Fetched page text',
  manual: 'Manual research note', demo: 'Demo source', legacy: 'Legacy source · collection method unknown',
};
export const sourceMethod = s => s.method || (s.kind === 'Demo' ? 'demo' : s.kind === 'Public page' ? 'legacy' : 'manual');
export const sourceLabel = s => SOURCE_METHODS[sourceMethod(s)] || SOURCE_METHODS.legacy;
export const isDemoSource = s => s.kind === 'Demo' || sourceMethod(s) === 'demo';
