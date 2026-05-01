import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineXMark, HiOutlineChevronUpDown, HiOutlinePlus } from "react-icons/hi2";
import { useRoom } from "../../../../context/RoomContext";
import "./AddExpenseSheet.css";

const COLOR_PALETTE = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#06b6d4", "#6366f1",
  "#f97316", "#14b8a6", "#a855f7", "#64748b",
];

export default function AddExpenseSheet({ roomId, members, categories, initialData, currentUserId, onClose, onSuccess }) {
  const { addExpense, createCategory } = useRoom();

  const [totalAmount, setTotalAmount] = useState(initialData?.amount || "");
  const [paidBy, setPaidBy] = useState(initialData?.paidBy || currentUserId || (members?.[0]?._id || ""));
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const [dateTime, setDateTime] = useState(now.toISOString().slice(0, 16));
  const [submitting, setSubmitting] = useState(false);

  // Category
  const [selectedCategory, setSelectedCategory] = useState(
    categories?.find(c => c._id === initialData?.categoryId) || categories?.[0] || null
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Members for split
  const [splitAll, setSplitAll] = useState(initialData ? false : true);
  const [selectedMembers, setSelectedMembers] = useState(initialData?.splitAmong || []);

  // New category creation dialog
  const [newCatDialog, setNewCatDialog] = useState({ open: false, name: "" });
  const [newCatColor, setNewCatColor] = useState(COLOR_PALETTE[0]);

  useEffect(() => {
    // Only initialize selectedMembers to all on first mount if not a settlement
    if (members && members.length > 0 && selectedMembers.length === 0 && !initialData) {
      setSelectedMembers(members.map(m => m._id));
    }
  }, [members, initialData]);

  const isInitialLoad = useRef(true);

  // When category changes, load its defaultMembers
  useEffect(() => {
    // Never override split members if it is a settlement
    if (initialData?.isSettlement) return;

    if (isInitialLoad.current && initialData) {
      isInitialLoad.current = false;
      return;
    }
    isInitialLoad.current = false;

    if (selectedCategory?.defaultMembers?.length > 0) {
      const ids = selectedCategory.defaultMembers.map(m =>
        typeof m === "object" ? m._id : m
      );
      setSelectedMembers(ids);
      setSplitAll(ids.length === members.length);
    } else {
      setSelectedMembers(members.map(m => m._id));
      setSplitAll(true);
    }
  }, [selectedCategory, members, initialData]);

  useEffect(() => {
    if (dropdownOpen && searchRef.current) searchRef.current.focus();
  }, [dropdownOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCategories = (categories || []).filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const showCreateNew = searchQuery.trim() && !(categories || []).some(c =>
    c.name.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        const newList = prev.filter(id => id !== memberId);
        setSplitAll(false);
        return newList;
      } else {
        const newList = [...prev, memberId];
        setSplitAll(newList.length === members.length);
        return newList;
      }
    });
  };

  const toggleAll = () => {
    if (splitAll) {
      setSelectedMembers([]);
      setSplitAll(false);
    } else {
      setSelectedMembers(members.map(m => m._id));
      setSplitAll(true);
    }
  };

  const handleCreateNewCategory = async () => {
    try {
      const cat = await createCategory({
        roomId,
        name: newCatDialog.name,
        color: newCatColor,
        defaultMembers: selectedMembers,
      });
      setSelectedCategory(cat);
      setNewCatDialog({ open: false, name: "" });
      setSearchQuery("");
    } catch { }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !totalAmount || !paidBy || !dateTime || selectedMembers.length === 0) return;

    try {
      setSubmitting(true);
      await addExpense({
        roomId,
        title: selectedCategory.name,
        totalAmount: Number(Number(totalAmount).toFixed(2)),
        paidBy,
        splitAmong: splitAll ? [] : selectedMembers,
        categoryId: selectedCategory._id,
        isSettlement: initialData?.isSettlement || false,
        date: new Date(dateTime),
      });
      onSuccess();
    } catch { } 
    finally { setSubmitting(false); }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div className="sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="sheet-content" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="sheet-header">
              <h2>{initialData?.isSettlement ? "Record Settlement" : "Add Expense"}</h2>
              <button className="close-btn" onClick={onClose}><HiOutlineXMark size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Amount */}
              <div className="form-group">
                <label className="form-label">How much?</label>
                <div className="amount-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" step="0.01" min="0.01" className="glass-input amount-input" autoFocus required />
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <div className="custom-dropdown" ref={dropdownRef}>
                  <button type="button" className={`dropdown-trigger ${dropdownOpen ? "open" : ""}`} onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <div className="selected-cat">
                      {selectedCategory && (
                        <>
                          <span className="cat-color-badge" style={{ background: selectedCategory.color }}></span>
                          {selectedCategory.name}
                        </>
                      )}
                      {!selectedCategory && <span style={{ color: "#6b7280" }}>Select category...</span>}
                    </div>
                    <HiOutlineChevronUpDown size={18} color="#9ca3af" />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div className="dropdown-menu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                        <div className="dropdown-search">
                          <input ref={searchRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search or type new..." />
                        </div>
                        {filteredCategories.map(cat => (
                          <button key={cat._id} type="button" className={`dropdown-option ${selectedCategory?._id === cat._id ? "active" : ""}`} onClick={() => { setSelectedCategory(cat); setDropdownOpen(false); setSearchQuery(""); }}>
                            <span className="cat-color-badge" style={{ background: cat.color }}></span>
                            {cat.name}
                          </button>
                        ))}
                        {showCreateNew && (
                          <button type="button" className="dropdown-option create-new" onClick={() => { setNewCatDialog({ open: true, name: searchQuery.trim() }); setDropdownOpen(false); }}>
                            <span className="opt-emoji"><HiOutlinePlus size={18} /></span>
                            Create "{searchQuery.trim()}"
                          </button>
                        )}
                        {filteredCategories.length === 0 && !showCreateNew && <div className="dropdown-empty">No categories found</div>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Dynamic Split/Payer logic depending on mode */}
              {initialData?.isSettlement ? (
                <div className="form-group">
                  <label className="form-label">Transfer Details</label>
                  <div className="settlement-users-row" style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: "1px solid var(--border-light)" }}>
                    <div className="user-node debtor">
                      <div className="avatar">
                        {members?.find(m => m._id === paidBy)?.avatarUrl ? (
                          <img src={members.find(m => m._id === paidBy).avatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                        ) : (
                          members?.find(m => m._id === paidBy)?.name?.charAt(0)
                        )}
                      </div>
                      <span>{members?.find(m => m._id === paidBy)?.name}</span>
                    </div>
                    <div className="transfer-path"></div>
                    <div className="user-node creditor">
                      <div className="avatar">
                        {members?.find(m => m._id === selectedMembers[0])?.avatarUrl ? (
                          <img src={members.find(m => m._id === selectedMembers[0]).avatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                        ) : (
                          members?.find(m => m._id === selectedMembers[0])?.name?.charAt(0)
                        )}
                      </div>
                      <span>{members?.find(m => m._id === selectedMembers[0])?.name}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Split Among */}
                  <div className="form-group">
                    <label className="form-label">Paid for whom?</label>
                    <div className="member-chips">
                      <button type="button" className={`member-chip all-chip ${splitAll ? "active" : ""}`} onClick={toggleAll}>
                        All
                      </button>
                      {members.map(m => (
                        <button
                          key={m._id}
                          type="button"
                          className={`member-chip ${selectedMembers.includes(m._id) ? "active" : ""}`}
                          onClick={() => toggleMember(m._id)}
                        >
                          <span className="chip-avatar">
                            {m.avatarUrl ? (
                              <img src={m.avatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                            ) : (
                              m.name?.charAt(0)
                            )}
                          </span>
                          {m.name?.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paid By */}
                  <div className="form-group">
                    <label className="form-label">Paid By</label>
                    <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="glass-input">
                      {members.map(m => (
                        <option key={m._id} value={m._id} style={{ background: "#1f2937" }}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Date/Time (Moved below) */}
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="glass-input" required />
              </div>

              <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={submitting || !selectedCategory || selectedMembers.length === 0} className="submit-btn">
                {submitting ? "Saving..." : (initialData?.isSettlement ? "Record Settlement" : "Save Expense")}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* New Category Creation Dialog */}
      {newCatDialog.open && (
        <motion.div className="glass-dialog-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNewCatDialog({ open: false, name: "" })}>
          <motion.div className="glass-dialog" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}>
            <div className="glass-dialog-icon info" style={{ background: `${newCatColor}20`, color: newCatColor }}>
              +
            </div>
            <h3>New Category</h3>
            <p>Create "{newCatDialog.name}" — pick a color for it:</p>

            <div className="color-picker-grid">
              {COLOR_PALETTE.map(c => (
                <button key={c} type="button" className={`color-swatch ${newCatColor === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setNewCatColor(c)}></button>
              ))}
            </div>

            <div className="glass-dialog-actions">
              <motion.button whileTap={{ scale: 0.97 }} className="glass-dialog-btn cancel" onClick={() => setNewCatDialog({ open: false, name: "" })}>Cancel</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} className="glass-dialog-btn confirm" onClick={handleCreateNewCategory}>Create</motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
