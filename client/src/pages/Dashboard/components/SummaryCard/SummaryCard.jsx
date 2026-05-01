import { motion } from "framer-motion";
import { HiOutlineArrowsRightLeft } from "react-icons/hi2";
import "./SummaryCard.css";

export default function SummaryCard({ totalExpenses, perHead, membersCount, balances, onViewSettlements }) {
  return (
    <motion.div 
      className="summary-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="summary-header">
        <span className="summary-title">Total Spent</span>
      </div>
      
      <div className="summary-total">
        ₹{Number(totalExpenses).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">Members</span>
          <span className="stat-value">{membersCount}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Per Head</span>
          <span className="stat-value">₹{Number(perHead).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="balances-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span className="summary-title" style={{ fontSize: "0.75rem", margin: 0 }}>Current Balances</span>
          <button 
            onClick={onViewSettlements}
            className="btn btn-secondary"
            style={{ padding: "4px 10px", fontSize: "0.75rem", background: "rgba(255,255,255,0.05)" }}
          >
            <HiOutlineArrowsRightLeft size={14} style={{ marginRight: "4px", display: "inline-block", verticalAlign: "middle" }} />
            <span style={{ verticalAlign: "middle" }}>Transfers</span>
          </button>
        </div>
        
        {balances?.map((b, index) => {
          const isPositive = b.balance > 0.01;
          const isNegative = b.balance < -0.01;
          const absVal = Math.abs(b.balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          let statusText = "Settled";
          let colorClass = "settled";

          if (isPositive) {
            statusText = `Gets ₹${absVal}`;
            colorClass = "gets";
          } else if (isNegative) {
            statusText = `Owes ₹${absVal}`;
            colorClass = "owes";
          }

          return (
            <motion.div 
              key={b.userId} 
              className="balance-item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (index * 0.1) }}
            >
              <div className="user-info">
                <div className="user-avatar" style={{
                  background: isPositive ? 'linear-gradient(135deg, var(--accent), #6366f1)' : isNegative ? 'linear-gradient(135deg, var(--danger), #ef444490)' : 'rgba(255,255,255,0.08)'
                }}>
                  {b.avatarUrl ? (
                    <img src={b.avatarUrl} alt={b.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    b.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="user-name">{b.name}</span>
              </div>
              <span className={`balance-amount ${colorClass}`}>
                {statusText}
              </span>
            </motion.div>
          );
        })}
      </div>

    </motion.div>
  );
}
