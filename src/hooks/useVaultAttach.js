// "Attach from Vault", once, for every service.
//
// The behaviour is the same everywhere and lives here so no service can drift:
//   • nothing of the accepted type in the Vault → say so, and point at upload;
//   • exactly one → attach it without asking, which is the common case;
//   • more than one → offer the choice, listing only documents of an accepted
//     type.
//
// Type is the only thing that decides what is offered. A National ID slot is
// handed National IDs; nothing else can reach it, here or at the endpoints.

import { useCallback, useState } from 'react';
import { useVault } from './useVault';
import { acceptedLabel, attachmentRoutes } from '../data/documentTypes';

/**
 * @param {{
 *   onAttach: (field: import('../data/types').DocumentDef, item: import('../lib/vaultInventory').VaultItem) => void,
 *   showToast: (message: string) => void,
 *   active?: boolean   re-read the Vault when the flow opens
 * }} args
 */
export function useVaultAttach({ onAttach, showToast, active = true }) {
  const vault = useVault(active);
  const [pickerFor, setPickerFor] = useState(null);

  const requestFromVault = useCallback((field) => {
    const candidates = vault.candidatesFor(field);
    if (candidates.length === 0) {
      // Issued documents are never uploaded — the way to get one is to request
      // it from the issuing agency in the Vault.
      showToast(attachmentRoutes(field?.accepts).upload
        ? `No ${acceptedLabel(field?.accepts)} in your Vault yet — upload it and we will keep it there`
        : `No ${acceptedLabel(field?.accepts)} in your Vault yet — request it from ${field?.issuer || 'the issuing agency'} in your Vault`);
      return;
    }
    if (candidates.length === 1) {
      onAttach(field, candidates[0]);
      return;
    }
    setPickerFor(field);
  }, [vault, onAttach, showToast]);

  const pick = useCallback((item) => {
    const field = pickerFor;
    setPickerFor(null);
    if (field) onAttach(field, item);
  }, [pickerFor, onAttach]);

  return {
    vault,
    requestFromVault,
    pickerFor,
    pickerCandidates: pickerFor ? vault.candidatesFor(pickerFor) : [],
    pick,
    closePicker: () => setPickerFor(null),
  };
}

export default useVaultAttach;
