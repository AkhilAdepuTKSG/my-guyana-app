import Sheet from '../../components/ui/Sheet';
import ListRow from '../../components/ui/ListRow';
import { useAppState } from '../../state/AppStateContext';

export default function SupportSheet() {
  const { isOpen, closeOverlay, openOverlay, navigate, showToast } = useAppState();
  const open = isOpen('support');

  function goAskGov() {
    closeOverlay('support');
    openOverlay('askGov');
  }

  function callHelpline() {
    closeOverlay('support');
    showToast('Calling the My Guyana helpline · 231-0300');
  }

  function visitCentre() {
    closeOverlay('support');
    navigate('services');
  }

  return (
    <Sheet open={open} onClose={() => closeOverlay('support')} title="Get support">
      <p className="ds-small" style={{ margin: '0 0 6px', color: 'var(--fg-3)' }}>
        Get help fast — chat with Ask Gov, call a helpline, or find a service centre near you.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <ListRow
          icon="sparkles"
          title="Ask Gov chat"
          subtitle="Get an instant answer from the government assistant"
          onClick={goAskGov}
        />
        <ListRow
          icon="phone"
          title="Call a helpline"
          subtitle="Speak with someone at the national helpline"
          onClick={callHelpline}
        />
        <ListRow
          icon="map-pin"
          title="Visit a service centre"
          subtitle="Find an office near you"
          onClick={visitCentre}
        />
      </div>
    </Sheet>
  );
}
