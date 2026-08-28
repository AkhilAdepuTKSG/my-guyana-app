import { useAppState } from '../../state/AppStateContext';
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
// import SingleWindowHub from '../../overlays/singleWindow/SingleWindowHub'; // hub render is switched off below
import GroLookup from '../../overlays/gro/GroLookup';
import GroCertificate from '../../overlays/gro/GroCertificate';
import WelcomeCarousel from '../../overlays/welcome/WelcomeCarousel';
import TourSheet from '../../overlays/welcome/TourSheet';
import AddAgencyDiscoverySheet from '../../overlays/welcome/AddAgencyDiscoverySheet';

const SCREEN_COMPONENTS = {
  home: Home, nis: Nis, mops: Mops, gpl: Gpl, vault: Vault, wallet: Wallet,
  services: Services, calendar: Calendar, applications: Applications,
};

export default function AppShell() {
  const { screen } = useAppState();
  const ActiveScreen = SCREEN_COMPONENTS[screen] || Home;

  return (
    <div style={{
      width: '100%', maxWidth: 480, height: '100dvh', margin: '0 auto',
      position: 'relative', background: 'var(--bg-page)', overflow: 'hidden',
      boxShadow: '0 0 40px rgba(9,26,43,0.08)',
    }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: 96 }}>
        <div style={{ padding: '20px 20px 8px' }}>
          <ActiveScreen />
        </div>
      </div>

      <TabBar />
      <Toast />
      {/* Push-style notification card at the top (e.g. "your employer registered
          you with NIS" right after sign-up) — tap to dismiss; stays in the bell. */}
      <PushBanner />

      {/* Services category drill-down — covers the entire screen, bottom nav
          included; its own back arrow is the way out (backlog 3.3/3.4). */}
      <CategoryDrillDown />

      {/* Full-screen flows and sheets — layered above the primary screens.
          The auth flow itself lives at the app root as the pre-shell gate. */}
      {/* The seeded services — Cash Grants, Single Window and GRO — all share
          this View / Apply / Track shell, driven by the `services` table. */}
      {/* <SingleWindowHub /> */}
      <ServiceView />
      <ServiceApply />
      <ServiceTrack />
      <GroLookup />
      <GroCertificate />

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
      <AskGov />
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
    </div>
  );
}
