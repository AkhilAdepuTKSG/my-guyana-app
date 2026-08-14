import * as icons from 'lucide-react';
import { HelpCircle } from 'lucide-react';

function toPascalCase(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

// Usage: <Icon name="shield-check" size={20} color="var(--fg-2)" />
// `name` matches lucide's kebab-case icon names (same convention the
// prototype used with data-lucide="...").
export default function Icon({ name, size = 20, color, strokeWidth = 2, className, style }) {
  const Cmp = icons[toPascalCase(name)] || HelpCircle;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} className={className} style={style} />;
}
