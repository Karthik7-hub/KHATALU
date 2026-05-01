import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineXMark, HiOutlineCalendar, HiOutlineUser, HiOutlineClock, HiOutlineTrash, HiOutlineUsers } from "react-icons/hi2";
import GlassDialog from "../../../../components/GlassDialog/GlassDialog";
import "./ExpenseDetailSheet.css";

export default function ExpenseDetailSheet({ expense, members, isAdmin, currentUserId, onClose, onDelete }) {
  if (!expense) return null;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const isCreatorOrAdmin = isAdmin || expense.addedBy?._id === currentUserId;

  const formatFullDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine who this was paid for
  const splitAmongList = expense.splitAmong && expense.splitAmong.length > 0
    ? expense.splitAmong
    : members || [];
  const isEveryone = !expense.splitAmong || expense.splitAmong.length === 0;

  // Per-person share
  const perPerson = splitAmongList.length > 0
    ? expense.totalAmount / splitAmongList.length
    : expense.totalAmount;

  return (
    <AnimatePresence>
      <motion.div 
        className="detail-sheet-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="detail-sheet-content"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="detail-sheet-handle"></div>
          
          <div className="detail-header">
            <div className="detail-title-group">
              <span className="detail-label" style={{ color: "var(--accent)" }}>
                {expense.isSettlement ? "Settlement Details" : "Expense Details"}
              </span>
              <h2 className="detail-title">{expense.title}</h2>
              <div className="detail-amount">
                ₹{Number(expense.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <button className="close-btn" onClick={onClose} style={{ flexShrink: 0 }}>
              <HiOutlineXMark size={20} />
            </button>
          </div>

          <div className="detail-card">
            <div className="detail-row">
              <div className="detail-icon"><HiOutlineUser size={20} /></div>
              <div className="detail-info">
                <span className="detail-label">{expense.isSettlement ? "Transferred From" : "Paid By"}</span>
                <span className="detail-value">{expense.paidBy?.name || "Unknown"}</span>
              </div>
            </div>

            {/* Paid For */}
            <div className="detail-row">
              <div className="detail-icon" style={{ color: "#10b981" }}><HiOutlineUsers size={20} /></div>
              <div className="detail-info">
                <span className="detail-label">{expense.isSettlement ? "Transferred To" : "Paid For"}</span>
                {isEveryone ? (
                  <span className="detail-value">Everyone</span>
                ) : (
                  <div className="detail-chips-row">
                    {splitAmongList.map(m => (
                      <span key={m._id || m} className="detail-member-chip">
                        {m.name || "Unknown"}
                      </span>
                    ))}
                  </div>
                )}
                <span className="detail-share">
                  ₹{Number(perPerson).toLocaleString("en-IN", { minimumFractionDigits: 2 })} per person
                </span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon"><HiOutlineCalendar size={20} /></div>
              <div className="detail-info">
                <span className="detail-label">Payment Date & Time</span>
                <span className="detail-value">{formatFullDate(expense.date || expense.createdAt)}</span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon" style={{ color: "var(--text-secondary)" }}><HiOutlineClock size={20} /></div>
              <div className="detail-info">
                <span className="detail-label">Logged By</span>
                <span className="detail-value" style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  {expense.addedBy?.name || "Someone"} on {new Date(expense.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-actions">
            {isCreatorOrAdmin && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="detail-btn detail-btn-danger"
                onClick={() => setConfirmDelete(true)}
              >
                <HiOutlineTrash size={20} />
                Delete Record
              </motion.button>
            )}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="detail-btn detail-btn-primary"
              onClick={onClose}
            >
              Close
            </motion.button>
          </div>

        </motion.div>
      </motion.div>

      <GlassDialog
        open={confirmDelete}
        icon="danger"
        title={expense.isSettlement ? "Delete Settlement" : "Delete Expense"}
        message={`Permanently delete this ${expense.isSettlement ? "settlement" : "expense"} for ₹${Number(expense.totalAmount).toLocaleString("en-IN")}? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep"
        danger={true}
        onConfirm={() => {
          onDelete(expense._id);
          onClose();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </AnimatePresence>
  );
}
