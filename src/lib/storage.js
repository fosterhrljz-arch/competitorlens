// Synchronous persistence keeps editor transitions conditional on verified durability.
export function persistVerified(storage, key, state) {
  const serialized = JSON.stringify(state);
  storage.setItem(key, serialized);
  if (storage.getItem(key) !== serialized) throw new Error('Storage did not confirm the complete save. Your changes remain unsaved.');
  return { bytes: serialized.length * 2, verifiedAt: new Date().toISOString() };
}
export function workspaceSize(state) { return JSON.stringify(state).length * 2; }
export function storageCapacity(state) {
  const bytes = workspaceSize(state);
  return { bytes, warning: bytes >= 3_000_000, megabytes: (bytes / 1_000_000).toFixed(1) };
}
