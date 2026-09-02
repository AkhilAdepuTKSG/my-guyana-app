import { BrowserRouter } from 'react-router-dom';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import AppShell from './components/shell/AppShell';
import AuthFlow from './overlays/auth/AuthFlow';
import Toast from './components/ui/Toast';
import { useIsDesktop } from './hooks/useViewport';

// The frame the sign-in gate sits in.
//
// On the web it is the whole page: the flow renders a split screen of its own
// (AuthWebLayout), so wrapping it in a card would put a page inside a card. On
// a phone it is the same 480px frame the shell uses, so the app looks the same
// before and after signing in.
function AuthFrame({ children }) {
  const isDesktop = useIsDesktop();

  // The web layout is the whole page — a split screen with the hero on one side
  // and the flow on the other (see AuthWebLayout). The phone keeps the frame.
  if (isDesktop) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: 'var(--surface-1)' }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100dvh', margin: '0 auto',
      position: 'relative', background: 'var(--bg-page)', overflow: 'hidden',
      maxWidth: 480, boxShadow: '0 0 40px rgba(9,26,43,0.08)',
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
    <AuthFrame>
      <AuthFlow gate />
      <Toast />
    </AuthFrame>
  );
}

export default function App() {
  return (
    // The router wraps the provider, not the other way around: the provider
    // derives where the citizen is from the URL, so it has to be able to read
    // the location and to navigate.
    <BrowserRouter>
      <AppStateProvider>
        <Root />
      </AppStateProvider>
    </BrowserRouter>
  );
}
