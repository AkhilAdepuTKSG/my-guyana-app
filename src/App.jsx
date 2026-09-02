import { BrowserRouter } from 'react-router-dom';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import AppShell from './components/shell/AppShell';
import AuthFlow from './overlays/auth/AuthFlow';
import Toast from './components/ui/Toast';
import { useIsDesktop } from './hooks/useViewport';

// The frame the sign-in gate sits in.
//
// Signing in is a single column of content at any width, so on a wide screen it
// stays a column — centred as a card on the page background rather than
// stretched across the monitor. The shell has its own frame (AppShell), which
// is where the sidebar layout lives.
function AuthFrame({ children }) {
  const isDesktop = useIsDesktop();
  return (
    <div style={{
      width: '100%', height: '100dvh', margin: '0 auto',
      display: isDesktop ? 'flex' : 'block',
      alignItems: 'center', justifyContent: 'center',
      background: isDesktop ? 'var(--surface-2)' : 'var(--bg-page)',
      padding: isDesktop ? 32 : 0,
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        height: isDesktop ? 'min(760px, 100%)' : '100%',
        margin: '0 auto', position: 'relative',
        background: 'var(--bg-page)', overflow: 'hidden',
        borderRadius: isDesktop ? 'var(--radius-xl)' : 0,
        boxShadow: isDesktop ? '0 24px 64px rgba(9,26,43,0.18)' : '0 0 40px rgba(9,26,43,0.08)',
      }}>
        {children}
      </div>
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
