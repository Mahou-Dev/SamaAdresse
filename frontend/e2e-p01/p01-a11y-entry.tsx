import { createRoot } from 'react-dom/client';
import '../src/index.css';
import { P01A11yHarness } from './p01-a11y-harness';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<P01A11yHarness />);
}
