// Tiny external store so the region choice picked in RegionSheet is
// reflected back on ProfileSheet's "Region" row without needing to touch
// the shared AppStateContext (which has no region field of its own).
import { useSyncExternalStore } from 'react';
import { REGIONS } from '../../state/mockData';

let regionId = 'r4';
const listeners = new Set();

export function getRegionId() {
  return regionId;
}

export function setRegionId(id) {
  regionId = id;
  listeners.forEach((listen) => listen());
}

function subscribe(listen) {
  listeners.add(listen);
  return () => listeners.delete(listen);
}

export function useRegionId() {
  return useSyncExternalStore(subscribe, getRegionId);
}

export function useRegionName() {
  const id = useRegionId();
  return REGIONS.find((r) => r.id === id)?.name || REGIONS[0].name;
}
