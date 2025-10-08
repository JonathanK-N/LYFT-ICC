import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ header, footer, children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      {header ? <header className="app-shell__header">{header}</header> : null}
      <motion.main
        className="app-shell__main"
        initial={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {children}
      </motion.main>
      {footer ? <footer className="app-shell__footer">{footer}</footer> : null}
    </div>
  );
}
