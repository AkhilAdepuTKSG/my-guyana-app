import { AppStateProvider, useAppState } from './state/AppStateContext';
import AppShell from './components/shell/AppShell';
import AuthFlow from './overlays/auth/AuthFlow';
import Toast from './components/ui/Toast';

// The mobile frame both the gate and the shell share, so the app looks the same
// before and after sign-in.
function MobileFrame({ children }) {
  return (
    <div style={{
      width: '100%', maxWidth: 480, height: '100dvh', margin: '0 auto',
      position: 'relative', background: 'var(--bg-page)', overflow: 'hidden',
      boxShadow: '0 0 40px rgba(9,26,43,0.08)',
    }}>
      {children}
    </div>
  );
}

// Until a citizen signs in or registers, the auth flow IS the app. Once the
// session says authenticated, the shell takes over. Signing out flips it back.
function Root() {
  const { isAuthenticated } = useAppState();
  if (isAuthenticated) return <AppShell />;
  return (
    <MobileFrame>
      <AuthFlow gate />
      <Toast />
    </MobileFrame>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Root />
    </AppStateProvider>
  );
}
