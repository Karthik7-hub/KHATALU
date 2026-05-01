import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineClock } from "react-icons/hi2";
import "./ExpenseTimeline.css";

export default function ExpenseTimeline({ expenses, onExpenseClick, title = "Recent Transactions", hideHeader = false }) {
  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="timeline-container">
      {!hideHeader && (
        <div className="timeline-header">
          <HiOutlineClock size={24} color="var(--accent)" />
          {title}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {expenses.length === 0 ? (
          <motion.div 
            className="empty-timeline"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ fontSize: "2rem", opacity: 0.5 }}>🧾</div>
            <p>No expenses logged yet. Add one to get started!</p>
          </motion.div>
        ) : (
          expenses.map((expense, index) => {
            return (
              <motion.div
                key={expense._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onExpenseClick(expense)}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="timeline-item"
              >
                <div className={`timeline-left ${expense.isSettlement ? "is-settlement" : ""}`}>
                  <span className="timeline-date">
                    {formatDisplayDate(expense.date || expense.createdAt)}
                    {expense.isSettlement && <span className="settlement-badge">Settlement</span>}
                  </span>
                  
                  <div className="timeline-info">
                    <span className="timeline-payer">{expense.paidBy?.name || "Unknown"}</span>
                    <span>{expense.isSettlement ? "transferred to" : "paid for"}</span>
                    <span className="timeline-title">{expense.title}</span>
                  </div>

                  <div className="timeline-meta">
                    Added at {formatTime(expense.createdAt)} by {expense.addedBy?.name || "Someone"}
                  </div>
                </div>

                <div className={`timeline-right ${expense.isSettlement ? "is-settlement" : ""}`}>
                  <span className="timeline-amount">
                    ₹{Number(expense.totalAmount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}
