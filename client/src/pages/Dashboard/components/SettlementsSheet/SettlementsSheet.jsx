import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineXMark } from "react-icons/hi2";
import "./SettlementsSheet.css";

export default function SettlementsSheet({ settlements: minimizedSettlements, expenses, members, currentUserId, onClose, onRecordSettlement }) {
  const [isSimplified, setIsSimplified] = useState(true);

  // Helper to get user details
  const getUser = (userId) => members.find((m) => m._id === userId) || { name: "Unknown" };

  // Calculate strict peer-to-peer (unsimplified) debts based on literal expenses
  const unsimplifiedSettlements = useMemo(() => {
    if (!expenses || expenses.length === 0 || members.length === 0) return [];

    const pairs = {}; // "debtorId-creditorId" -> amount
    const memCount = members.length;

    expenses.forEach(exp => {
      const perHead = exp.totalAmount / memCount;
      const creditorId = typeof exp.paidBy === "object" ? exp.paidBy._id : exp.paidBy;
      
      if (!creditorId) return;

      members.forEach(m => {
        const debtorId = m._id;
        if (debtorId !== creditorId) {
          const pair1 = `${debtorId}-${creditorId}`;
          const pair2 = `${creditorId}-${debtorId}`;
          
          if (pairs[pair2]) {
             // Net against existing reverse debt
             if (pairs[pair2] > perHead) {
               pairs[pair2] -= perHead;
             } else {
               pairs[pair1] = perHead - pairs[pair2];
               delete pairs[pair2];
             }
          } else {
             pairs[pair1] = (pairs[pair1] || 0) + perHead;
          }
        }
      });
    });

    return Object.keys(pairs).map(key => {
      const [from, to] = key.split('-');
      return { from, to, amount: Number(pairs[key].toFixed(2)) };
    }).filter(tx => tx.amount > 0.01);
  }, [expenses, members]);

  // Choose which list to render
  const activeSettlements = isSimplified ? minimizedSettlements : unsimplifiedSettlements;

  return (
    <AnimatePresence>
      <motion.div 
        className="settlement-sheet-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="settlement-sheet-content"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="settlement-sheet-handle"></div>
          
          <div className="settlement-header">
            <h2 className="settlement-title">How to Settle Up</h2>
            <button className="close-btn" onClick={onClose} style={{ flexShrink: 0 }}>
              <HiOutlineXMark size={20} />
            </button>
          </div>

          <div className="simplify-toggle-container">
            <div className="simplify-info">
              <span className="simplify-label">Simplified Debts</span>
              <span className="simplify-desc">Minimizes the number of transfers needed</span>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isSimplified} 
                onChange={() => setIsSimplified(!isSimplified)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settlements-list">
            {activeSettlements.length === 0 ? (
              <div className="no-settlements">
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎉</div>
                Everyone is perfectly settled up!
              </div>
            ) : (
              activeSettlements.map((tx, idx) => {
                const debtor = getUser(tx.from);
                const creditor = getUser(tx.to);
                
                // Emphasize if the current user is involved
                const isMe = tx.from === currentUserId || tx.to === currentUserId;

                return (
                  <motion.div 
                    key={idx}
                    className="settlement-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    style={{ borderColor: isMe ? "rgba(59, 130, 246, 0.4)" : "" }}
                  >
                    <div className="settlement-users-row">
                      <div className="user-node debtor">
                        <div className="avatar">{debtor.name.charAt(0)}</div>
                        <span>{tx.from === currentUserId ? "You" : debtor.name}</span>
                      </div>

                      <div className="transfer-path"></div>

                      <div className="user-node creditor">
                        <div className="avatar">{creditor.name.charAt(0)}</div>
                        <span>{tx.to === currentUserId ? "You" : creditor.name}</span>
                      </div>
                    </div>

                    <div className="settlement-amount-row">
                      <span className="amount-display">
                        ₹{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="action-btn"
                        onClick={() => onRecordSettlement && onRecordSettlement(tx)}
                      >
                        Record Settle
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
