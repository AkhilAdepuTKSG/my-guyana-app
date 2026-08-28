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
import { buildVaultInventory, matchRequirement, candidatesFor, groupBySection } from '../lib/vaultInventory';

/**
 * @param {boolean} [active] re-read the Vault whenever this turns true
 * @returns {{
 *   inventory: import('../lib/vaultInventory').VaultItem[],
 *   storedDocs: import('../data/types').VaultDocument[],
 *   loading: boolean,
 *   reload: () => void,
 *   sections: {cards: import('../lib/vaultInventory').VaultItem[], records: import('../lib/vaultInventory').VaultItem[]},
 *   candidatesFor: (field: import('../data/types').DocumentDef) => import('../lib/vaultInventory').VaultItem[],
 *   find: (field: import('../data/types').DocumentDef) => import('../lib/vaultInventory').VaultItem|null,
 *   holds: (field: import('../data/types').DocumentDef) => boolean
 * }}
 */
export function useVault(active = true) {
  const { persona, user, vaultDocs } = useAppState();
  const userId = useUserId();

  // Documents a service filed against this account. Everything else is derived
  // from the government record, so it needs no fetch.
  //
  // `active` is in the dependency list on purpose. The flows that use this are
  // mounted for the life of the app and only render when their overlay opens,
  // so a fetch that ran once at start-up would never see a document filed
  // afterwards. Flipping active on re-reads the Vault.
  const stored = useApi(
    () => listDocuments(userId),
    [userId, active],
    { enabled: !!userId && active, initial: [] }
  );
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
    sections: groupBySection(inventory),
    loading: stored.loading,
    reload: stored.reload,
    // Everything a field will accept, type-filtered — the picker renders this
    // list and nothing else.
    candidatesFor: (field) => candidatesFor(inventory, field),
    find: (field) => matchRequirement(inventory, field),
    holds: (field) => candidatesFor(inventory, field).length > 0,
  }), [inventory, storedDocs, stored.loading, stored.reload]);
}

export default useVault;
