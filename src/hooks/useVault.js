// The citizen's Vault, as every application form sees it.
//
// One hook, one inventory, one matcher — so "attach it from my Vault" behaves
// identically in the seeded services and in the older bespoke flows, and a
// document that is visible on the Vault screen is always attachable from a
// form. Before this each flow looked at a different subset and disagreed.

import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { useApi, useUserId } from './useApi';
import { listDocuments } from '../api/vault';
import { buildCards, buildRecords } from '../lib/vaultRecords';
import { buildVaultInventory, matchRequirement } from '../lib/vaultInventory';

/**
 * @returns {{
 *   inventory: import('../lib/vaultInventory').VaultItem[],
 *   storedDocs: import('../data/types').VaultDocument[],
 *   loading: boolean,
 *   reload: () => void,
 *   find: (doc: import('../data/types').DocumentDef) => import('../lib/vaultInventory').VaultItem|null,
 *   holds: (doc: import('../data/types').DocumentDef) => boolean
 * }}
 */
export function useVault() {
  const { persona, user, vaultDocs } = useAppState();
  const userId = useUserId();

  // Documents a service filed against this account. Everything else is derived
  // from the government record, so it needs no fetch.
  const stored = useApi(() => listDocuments(userId), [userId], { enabled: !!userId, initial: [] });
  // Stable identity while the data hasn't changed, so the memos below hold.
  const storedDocs = useMemo(() => stored.data || [], [stored.data]);

  const inventory = useMemo(
    () => buildVaultInventory({
      persona,
      cards: buildCards(persona, user),
      records: buildRecords(persona, user),
      vaultDocs,
      storedDocs,
    }),
    [persona, user, vaultDocs, storedDocs]
  );

  return useMemo(() => ({
    inventory,
    storedDocs,
    loading: stored.loading,
    reload: stored.reload,
    find: (doc) => matchRequirement(inventory, doc),
    holds: (doc) => !!matchRequirement(inventory, doc),
  }), [inventory, storedDocs, stored.loading, stored.reload]);
}

export default useVault;
