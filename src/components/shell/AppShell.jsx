import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppState } from '../../state/AppStateContext';
import { useLayout } from '../../hooks/useViewport';
import { SurfaceMode } from '../ui/SurfaceMode';
import GovBar from './GovBar';
import TopNav from './TopNav';
import SideNav from './SideNav';
import TabBar from './TabBar';
import Toast from '../ui/Toast';

import Home from '../../screens/Home';
import Nis from '../../screens/Nis';
import Mops from '../../screens/Mops';
import Gpl from '../../screens/Gpl';
import Vault from '../../screens/Vault';
import Wallet from '../../screens/Wallet';
import Services from '../../screens/Services';
import Calendar from '../../screens/Calendar';
import Applications from '../../screens/Applications';

import EidApplicationFlow from '../../overlays/eid/EidApplicationFlow';
import ApplyFlow from '../../overlays/apply/ApplyFlow';
import OtpGate from '../../overlays/security/OtpGate';
import NisRegistrationFlow from '../../overlays/nisReg/NisRegistrationFlow';
import BenefitClaimFlow from '../../overlays/benefit/BenefitClaimFlow';
import GplPayBill from '../../overlays/gpl/GplPayBill';
import GplUsage from '../../overlays/gpl/GplUsage';
import GplOutage from '../../overlays/gpl/GplOutage';
import GplClaims from '../../overlays/gpl/GplClaims';
import OnboardingFlow from '../../overlays/onboarding/OnboardingFlow';
import EmployerRegistrationFlow from '../../overlays/onboarding/EmployerRegistrationFlow';
import ContributionsHistory from '../../overlays/nisRecords/ContributionsHistory';
import ContributionReview from '../../overlays/nisRecords/ContributionReview';
import EmployerInfo from '../../overlays/nisRecords/EmployerInfo';
import RefundRequest from '../../overlays/nisRecords/RefundRequest';
import AppealForm from '../../overlays/nisRecords/AppealForm';
import Tracking from '../../overlays/tracking/Tracking';
import AppointmentDetail from '../../overlays/tracking/AppointmentDetail';
import IdvFlow from '../../overlays/idv/IdvFlow';
import BankLinkFlow from '../../overlays/bank/BankLinkFlow';
import AskGov from '../../overlays/askgov/AskGov';
import SupportSheet from '../../overlays/askgov/SupportSheet';
import PaymentsHistory from '../../overlays/payments/PaymentsHistory';
import NisCard from '../../overlays/cards/NisCard';
import EidCard from '../../overlays/cards/EidCard';
import ProfileSheet from '../../overlays/profile/ProfileSheet';
import PersonalInfoPage from '../../overlays/profile/PersonalInfoPage';
import SecuritySheet from '../../overlays/profile/SecuritySheet';
import AccessibilitySheet from '../../overlays/profile/AccessibilitySheet';
import CompleteProfileFlow from '../../overlays/profile/CompleteProfileFlow';
import NotificationsSheet from '../../overlays/profile/NotificationsSheet';
import RegionSheet from '../../overlays/profile/RegionSheet';
import CategoryDrillDown from '../../overlays/services/CategoryDrillDown';
import PushBanner from './PushBanner';
import ServiceView from '../../overlays/service/ServiceView';
import ServiceApply from '../../overlays/service/ServiceApply';
import ServiceTrack from '../../overlays/service/ServiceTrack';
import GroLookup from '../../overlays/gro/GroLookup';
import GroCertificate from '../../overlays/gro/GroCertificate';
import WelcomeCarousel from '../../overlays/welcome/WelcomeCarousel';
import TourSheet from '../../overlays/welcome/TourSheet';
import AddAgencyDiscoverySheet from '../../overlays/welcome/AddAgencyDiscoverySheet';

const GOVBAR_HEIGHT = 34;
const TOPNAV_HEIGHT = 64;

/**
 * A routed flow, rendered as the page it now is.
 *
 * The component itself is unchanged — it still reads its arguments through
 * `getPayload`, which the provider fills in from the URL. All this does is tell
 * the container underneath it that it is a page and not a dialog.
 */
function FlowPage({ children }) {
  return <SurfaceMode mode="page">{children}</SurfaceMode>;
}

/** Every address in the application. */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Agencies and services. The drill-down is listed before the
          single-segment service route so `/services/category/x` is not read as
          a service whose id is "category". */}
      <Route path="/services" element={<Services />} />
      <Route path="/services/category/:id" element={<FlowPage><CategoryDrillDown /></FlowPage>} />
      <Route path="/services/:serviceId" element={<FlowPage><ServiceView /></FlowPage>} />
      <Route path="/services/:serviceId/apply" element={<FlowPage><ServiceApply /></FlowPage>} />
      <Route path="/services/:serviceId/lookup" element={<FlowPage><GroLookup /></FlowPage>} />

      {/* Applications, and the tracker for one of them. */}
      <Route path="/applications" element={<Applications />} />
      <Route path="/applications/:group/:id" element={<FlowPage><ServiceTrack /></FlowPage>} />
      <Route path="/certificates/:requestId" element={<FlowPage><GroCertificate /></FlowPage>} />

      <Route path="/schedule" element={<Calendar />} />
      <Route path="/vault" element={<Vault />} />
      <Route path="/wallet" element={<Wallet />} />

      {/* Agency hubs. */}
      <Route path="/agencies/nis" element={<Nis />} />
      <Route path="/agencies/gpl" element={<Gpl />} />
      <Route path="/agencies/mops" element={<Mops />} />

      {/* Anything unrecognised goes home rather than showing a dead page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** The sheets and flows that are still layered over the page. */
function LayeredFlows() {
  return (
    <>
      <PushBanner />

      <EidApplicationFlow />
      <ApplyFlow />
      <NisRegistrationFlow />
      <BenefitClaimFlow />
      <GplPayBill />
      <GplUsage />
      <GplOutage />
      <GplClaims />
      <OnboardingFlow />
      <EmployerRegistrationFlow />
      <ContributionsHistory />
      <ContributionReview />
      <EmployerInfo />
      <RefundRequest />
      <AppealForm />
      <Tracking />
      <AppointmentDetail />
      <IdvFlow />
      <BankLinkFlow />
      <SupportSheet />
      <PaymentsHistory />
      <NisCard />
      <EidCard />
      <WelcomeCarousel />
      <TourSheet />
      <AddAgencyDiscoverySheet />
      <PersonalInfoPage />
      <ProfileSheet />
      <SecuritySheet />
      <AccessibilitySheet />
      <CompleteProfileFlow />
      <NotificationsSheet />
      <RegionSheet />

      {/* Sits above every flow — gates sensitive submissions behind a code. */}
      <OtpGate />
    </>
  );
}

const ASSISTANT_PREF_KEY = 'myguyana.assistant.v1';

export default function AppShell() {
  const { isOpen, openOverlay, closeOverlay } = useAppState();
  const layout = useLayout();
  const { isWeb, gutter, contentMaxWidth, frameMaxWidth } = layout;

  const assistantOpen = isOpen('askGov');
  const toggleAssistant = () => {
    if (assistantOpen) {
      closeOverlay('askGov');
      try { localStorage.setItem(ASSISTANT_PREF_KEY, 'closed'); } catch { /* ignore */ }
    } else {
      openOverlay('askGov');
      try { localStorage.setItem(ASSISTANT_PREF_KEY, 'open'); } catch { /* ignore */ }
    }
  };

  // On a wide screen the assistant is a column of the layout, not something
  // summoned — so it starts open, once, unless the citizen has closed it before.
  const openedOnce = useRef(false);
  useEffect(() => {
    if (openedOnce.current || !layout.canDock) return;
    openedOnce.current = true;
    let pref = null;
    try { pref = localStorage.getItem(ASSISTANT_PREF_KEY); } catch { /* ignore */ }
    if (pref !== 'closed') openOverlay('askGov');
  }, [layout.canDock, openOverlay]);

  // The assistant sits beside the page, in the same row as the navigation and
  // the content, so the page gives up the width rather than hiding under it.
  // Below the width where both fit it goes back to covering the page.
  const docked = isWeb && layout.canDock && assistantOpen;

  // One inset, published to the subtree. Anything that needs to bleed past the
  // content column reads it rather than hardcoding the phone's 20px and landing
  // a few pixels out at every other size.
  const shellVars = { '--shell-gutter': `${gutter}px` };

  // --- phone --------------------------------------------------------------
  if (!isWeb) {
    return (
      <div style={{
        ...shellVars,
        width: '100%', maxWidth: frameMaxWidth ?? 'none', height: '100dvh', margin: '0 auto',
        position: 'relative', background: 'var(--bg-page)', overflow: 'hidden',
        boxShadow: '0 0 40px rgba(9,26,43,0.08)',
      }}>
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: 96 }}>
          <div style={{ padding: `${gutter}px ${gutter}px 8px` }}>
            <AppRoutes />
          </div>
        </div>
        <TabBar />
        <Toast />
        <LayeredFlows />
        <AskGov />
      </div>
    );
  }

  // --- web ----------------------------------------------------------------
  return (
    <div style={{
      ...shellVars,
      width: '100%', height: '100dvh',
      display: 'flex', flexDirection: 'column',
      position: 'relative', background: 'var(--bg-page)', overflow: 'hidden',
    }}>
      <GovBar height={GOVBAR_HEIGHT} />
      <TopNav height={TOPNAV_HEIGHT} onToggleAssistant={toggleAssistant} assistantOpen={assistantOpen} />

      {/* Navigation, page, assistant — three columns in one row, so opening the
          assistant narrows the page instead of covering it. */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <SideNav width={layout.sidebarWidth} collapsed={layout.sidebarCollapsed} />

        <main style={{
          flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden',
          scrollbarGutter: 'stable both-edges',
        }}>
          <div style={{
            width: '100%', maxWidth: contentMaxWidth, margin: '0 auto',
            padding: `${gutter}px ${gutter}px ${gutter * 2}px`,
            boxSizing: 'border-box',
          }}>
            <AppRoutes />
          </div>
        </main>

        {docked && <AskGov />}
      </div>

      <Toast />
      <LayeredFlows />
      {/* Not enough room to dock it: the assistant covers the page instead. */}
      {!docked && <AskGov />}
    </div>
  );
}
