import { AppStateProvider } from './state/AppStateContext';
import AppShell from './components/shell/AppShell';

export default function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  );
}
