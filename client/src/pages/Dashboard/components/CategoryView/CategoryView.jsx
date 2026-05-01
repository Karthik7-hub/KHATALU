import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineArrowLeft, HiOutlineChevronRight, HiOutlineArrowsRightLeft } from "react-icons/hi2";
import ExpenseTimeline from "../ExpenseTimeline/ExpenseTimeline";
import "./CategoryView.css";

/**
 * Per-category settlement calculator.
 */
function calcCatBalances(catExpenses, members) {
  if (!members?.length || !catExpenses.length) return { balances: [], transactions: [] };

  const paid = {}, owed = {};
  members.forEach(m => { paid[m._id] = 0; owed[m._id] = 0; });

  catExpenses.forEach(exp => {
    const amt = Number(exp.totalAmount) || 0;
    const payerId = exp.paidBy?._id || exp.paidBy;
    if (paid[payerId] !== undefined) paid[payerId] += amt;

    const splitIds = exp.splitAmong?.length
      ? exp.splitAmong.map(m => (typeof m === "object" ? m._id : m))
      : members.map(m => m._id);
    const pp = amt / splitIds.length;
    splitIds.forEach(id => { if (owed[id] !== undefined) owed[id] += pp; });
  });

  const balances = members.map(m => ({
    ...m, paid: paid[m._id], owes: owed[m._id],
    balance: (paid[m._id] || 0) - (owed[m._id] || 0),
  }));

  // Greedy settlement
  const debtors = balances.filter(b => b.balance < -0.01).map(b => ({ ...b, amt: Math.abs(b.balance) }));
  const creditors = balances.filter(b => b.balance > 0.01).map(b => ({ ...b, amt: b.balance }));
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);
  const txns = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const a = Math.min(debtors[i].amt, creditors[j].amt);
    if (a > 0.005) txns.push({ from: debtors[i], to: creditors[j], amount: Number(a.toFixed(2)) });
    debtors[i].amt -= a; creditors[j].amt -= a;
    if (debtors[i].amt < 0.01) i++;
    if (creditors[j].amt < 0.01) j++;
  }
  return { balances, transactions: txns };
}

export default function CategoryView({ categories, expenses, members, currentUserId, onExpenseClick, onRecordSettlement }) {
  const [selectedCat, setSelectedCat] = useState(null);
  const [detailTab, setDetailTab] = useState("expenses"); // "expenses" | "settlements"

  // Pre-calculate stats AND mini-settlements for every category (for the cards)
  const catData = useMemo(() => {
    const data = {};
    categories.forEach(cat => {
      const catExpenses = expenses.filter(e => e.title === cat.name);
      const total = catExpenses.reduce((s, e) => s + (e.isSettlement ? 0 : e.totalAmount), 0);
      const { balances, transactions } = calcCatBalances(catExpenses, members);
      data[cat.name] = { count: catExpenses.length, total, balances, transactions, expenses: catExpenses };
    });
    return data;
  }, [categories, expenses, members]);

  const currentData = selectedCat ? catData[selectedCat.name] : null;

  return (
    <div className="catview">
      <AnimatePresence mode="wait">
        {!selectedCat ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="cat-cards-grid">
              {categories.map((cat, i) => {
                const d = catData[cat.name] || { count: 0, total: 0, balances: [], transactions: [] };
                const settled = d.transactions.length === 0 && d.count > 0;
                return (
                  <motion.button
                    key={cat._id}
                    className="cat-card"
                    onClick={() => setSelectedCat(cat)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ y: -4 }}
                  >
                    {/* Color gradient overlay */}
                    <div className="cat-card-glow" style={{ background: `linear-gradient(135deg, ${cat.color}18, transparent 70%)` }}></div>
                    <div className="cat-card-accent" style={{ background: cat.color }}></div>

                    <div className="cat-card-body">
                      <div className="cat-card-top">
                        <span className="cat-card-name">{cat.name}</span>
                        <HiOutlineChevronRight size={14} className="cat-card-arrow" />
                      </div>

                      <div className="cat-card-amount">
                        ₹{Number(d.total).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>

                      <div className="cat-card-footer">
                        <span className="cat-card-pills">{d.count} bill{d.count !== 1 ? "s" : ""}</span>
                        {d.count > 0 && (
                          <span className={`cat-card-status ${settled ? "settled" : "pending"}`}>
                            {settled ? "Settled" : `${d.transactions.length} transfer${d.transactions.length !== 1 ? "s" : ""}`}
                          </span>
                        )}
                      </div>

                      {/* Mini member balance bar */}
                      {d.balances.length > 0 && d.count > 0 && (
                        <div className="cat-card-members">
                          {d.balances.map(b => (
                            <div key={b._id} className="cat-mini-member" title={`${b.name}: ${b.balance >= 0 ? "+" : ""}₹${b.balance.toFixed(0)}`}>
                              <span className="cat-mini-avatar" style={{
                                background: b.balance > 0.01 ? `linear-gradient(135deg, ${cat.color}, ${cat.color}90)` : b.balance < -0.01 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'
                              }}>
                                {b.avatarUrl ? (
                                  <img src={b.avatarUrl} alt={b.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                                ) : (
                                  b.name?.charAt(0)
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {categories.length === 0 && (
              <div className="cat-empty">
                <div className="cat-empty-icon">+</div>
                <p>No categories yet</p>
                <span>Log your first bill to get started</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Detail Header */}
            <div className="cat-detail-header" style={{ borderTopColor: selectedCat.color }}>
              <button className="cat-detail-back" onClick={() => { setSelectedCat(null); setDetailTab("expenses"); }}>
                <HiOutlineArrowLeft size={16} />
              </button>
              <div className="cat-detail-info">
                <div className="cat-detail-color" style={{ background: selectedCat.color }}></div>
                <div>
                  <div className="cat-detail-name">{selectedCat.name}</div>
                  <div className="cat-detail-meta">
                    {currentData?.count || 0} transaction{(currentData?.count || 0) !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <div className="cat-detail-total">
                ₹{Number(currentData?.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* View Toggle */}
            <div className="cat-detail-tabs">
              <button 
                className={detailTab === "expenses" ? "active" : ""} 
                onClick={() => setDetailTab("expenses")}
              >
                Expenses
              </button>
              <button 
                className={detailTab === "settlements" ? "active" : ""} 
                onClick={() => setDetailTab("settlements")}
              >
                Settlements
              </button>
            </div>

            {/* Tab Contents */}
            {detailTab === "expenses" ? (
              <>
                {/* Filtered timeline (Expenses only) */}
                {currentData?.expenses.filter(e => !e.isSettlement).length > 0 ? (
                  <ExpenseTimeline expenses={currentData.expenses.filter(e => !e.isSettlement)} onExpenseClick={onExpenseClick} />
                ) : (
                  <div className="cat-empty">
                    <p>No expenses yet</p>
                    <span>Log a bill under {selectedCat.name} to see it here</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Settlement Summary Card */}
                {currentData?.balances.length > 0 && currentData.count > 0 && (
                  <motion.div
                    className="cat-settle-card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="cat-settle-card-header">
                      <HiOutlineArrowsRightLeft size={14} />
                      <span>Current Balances</span>
                    </div>

                    {/* Member balances */}
                    <div className="cat-member-list">
                      {currentData.balances.map((b, idx) => {
                        const isPos = b.balance > 0.01;
                        const isNeg = b.balance < -0.01;
                        return (
                          <motion.div
                            key={b._id}
                            className="cat-member-row"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + idx * 0.06 }}
                          >
                            <div className="cat-member-info">
                              <div className="cat-member-avatar" style={{
                                background: isPos ? `linear-gradient(135deg, ${selectedCat.color}, ${selectedCat.color}90)` : isNeg ? 'linear-gradient(135deg, #ef4444, #dc262690)' : 'rgba(255,255,255,0.08)'
                              }}>
                                {b.avatarUrl ? (
                                  <img src={b.avatarUrl} alt={b.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                                ) : (
                                  b.name?.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="cat-member-name">{b.name}</div>
                                <div className="cat-member-paid">Paid ₹{Number(b.paid).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</div>
                              </div>
                            </div>
                            <span className={`cat-member-balance ${isPos ? "pos" : isNeg ? "neg" : "zero"}`}>
                              {isPos ? `Gets ₹${Math.abs(b.balance).toLocaleString("en-IN", { minimumFractionDigits: 0 })}` :
                               isNeg ? `Owes ₹${Math.abs(b.balance).toLocaleString("en-IN", { minimumFractionDigits: 0 })}` :
                               "Settled"}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Transfer arrows */}
                    {currentData.transactions.length > 0 && (
                      <div className="cat-transfers">
                        <div className="cat-transfers-label">Required Transfers</div>
                        {currentData.transactions.map((txn, i) => (
                          <div key={i} className="cat-transfer-row">
                            <div className="cat-t-visual">
                              <span className="cat-t-from">{txn.from.name}</span>
                              <div className="cat-t-arrow">
                                <div className="cat-t-line"></div>
                                <span>₹{txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
                                <div className="cat-t-line"></div>
                              </div>
                              <span className="cat-t-to">{txn.to.name}</span>
                            </div>
                            {currentUserId === txn.to._id && (
                              <motion.button 
                                whileTap={{ scale: 0.95 }}
                                className="cat-confirm-btn"
                                onClick={() => onRecordSettlement && onRecordSettlement({ ...txn, categoryId: selectedCat._id })}
                              >
                                Confirm Received
                              </motion.button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Past Settlements Timeline */}
                {currentData?.expenses.filter(e => e.isSettlement).length > 0 && (
                  <div className="cat-past-settlements">
                    <h3 className="cat-past-title">Past Settlements</h3>
                    <ExpenseTimeline expenses={currentData.expenses.filter(e => e.isSettlement)} onExpenseClick={onExpenseClick} />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
