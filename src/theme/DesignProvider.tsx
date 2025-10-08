import type { ReactNode } from 'react';
import { useDesignTokens } from './index';

export function DesignProvider({ children }: { children: ReactNode }) {
  useDesignTokens();
  return <>{children}</>;
}
