import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '../modules/app/ui.store';

export default function ToastStack() {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);

  return (
    <div className="toast-stack">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, translateX: 40, scale: 0.96 }}
            animate={{ opacity: 1, translateX: 0, scale: 1 }}
            exit={{ opacity: 0, translateX: 40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={() => dismissToast(toast.id)}
            role="status"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
