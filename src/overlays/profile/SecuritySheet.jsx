import Sheet from '../../components/ui/Sheet';
import { useAppState } from '../../state/AppStateContext';
import BiometricSettings from './BiometricSettings';

// "Sign-in & security" from the profile's quick access: the account password
// (a pending field until one exists) and Face ID for this device.
export default function SecuritySheet() {
  const { isOpen, closeOverlay } = useAppState();
  return (
    <Sheet open={isOpen('security')} onClose={() => closeOverlay('security')} title="Sign-in & security">
      <BiometricSettings showHeading={false} />
    </Sheet>
  );
}
