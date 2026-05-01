import { motion, AnimatePresence } from "framer-motion";
import "./GlassDialog.css";

/**
 * A premium liquid glass confirmation/alert dialog.
 *
 * Props:
 *   open       - boolean
 *   icon       - "info" | "warning" | "danger" | "success"
 *   emoji      - optional emoji string for the icon
 *   title      - string
 *   message    - string
 *   confirmText - string (defaults to "Confirm")
 *   cancelText  - string | null (null hides cancel button)
 *   onConfirm  - () => void
 *   onCancel   - () => void
 *   danger     - boolean (makes confirm button red)
 */
export default function GlassDialog({
  open,
  icon = "info",
  emoji,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="glass-dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="glass-dialog"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`glass-dialog-icon ${icon}`}>
              {icon === "info" ? "i" : icon === "warning" ? "!" : icon === "danger" ? "×" : "✓"}
            </div>

            <h3>{title}</h3>
            <p>{message}</p>

            <div className="glass-dialog-actions">
              {cancelText !== null && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="glass-dialog-btn cancel"
                  onClick={onCancel}
                >
                  {cancelText}
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                className={`glass-dialog-btn confirm ${danger ? "danger" : ""}`}
                onClick={onConfirm}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
