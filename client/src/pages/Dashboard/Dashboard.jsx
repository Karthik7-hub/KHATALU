import { useCallback, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineClipboardDocument,
  HiOutlinePlus,
  HiOutlineArrowRightStartOnRectangle,
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { useRoom } from "../../context/RoomContext";

// Modular Components
import SummaryCard from "./components/SummaryCard/SummaryCard";
import ExpenseTimeline from "./components/ExpenseTimeline/ExpenseTimeline";
import AddExpenseSheet from "./components/AddExpenseSheet/AddExpenseSheet";
import ExpenseDetailSheet from "./components/ExpenseDetailSheet/ExpenseDetailSheet";
import SettlementsSheet from "./components/SettlementsSheet/SettlementsSheet";
import ViewToggle from "./components/ViewToggle/ViewToggle";
import CategoryView from "./components/CategoryView/CategoryView";
import GlassDialog from "../../components/GlassDialog/GlassDialog";

import "./Dashboard.css";

export default function Dashboard() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dashboard, loading, fetchDashboard, leaveRoom, deleteExpense } = useRoom();

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [initialSettleData, setInitialSettleData] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [view, setView] = useState("all"); // "all" | "categories"

  const loadDashboard = useCallback(() => {
    if (roomId) fetchDashboard(roomId);
  }, [roomId, fetchDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !dashboard) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)' }}
        />
      </div>
    );
  }

  if (!dashboard) return <div className="dashboard-page">Could not load room.</div>;

  const { roomDetails, expenses, categories = [], balances, totalExpenses, perHead } = dashboard;
  const adminIdStr = roomDetails.adminId?.toString() || roomDetails.adminId?._id?.toString();
  const isAdmin = adminIdStr === user?._id?.toString();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomDetails.joinCode);
    toast.success("Join code copied!", { style: { background: '#1f2937', color: '#fff' } });
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(roomId);
      navigate("/rooms");
    } catch { }
  };

  const handleDeleteExpense = async (expenseId) => {
    await deleteExpense(expenseId);
    loadDashboard();
  };

  return (
    <div className="dashboard-page">
      {/* Background mesh */}
      <div className="bg-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="dashboard-content">
        
        {/* Navigation Bar */}
        <motion.div 
          className="dashboard-nav"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="nav-left">
            <button onClick={() => navigate("/rooms")} className="icon-btn">
              <HiOutlineArrowLeft size={18} />
            </button>
            <div className="nav-title-group">
              <h1 className="room-title">{roomDetails.roomName}</h1>
              <div className="join-code-badge" onClick={handleCopyCode} title="Copy code">
                {roomDetails.joinCode} <HiOutlineClipboardDocument size={12} />
              </div>
            </div>
          </div>

          <div className="nav-actions">
            {!isAdmin && (
              <button onClick={() => setShowLeaveConfirm(true)} className="icon-btn danger">
                <HiOutlineArrowRightStartOnRectangle size={18} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Action Bar: Toggle + Log Button */}
        <motion.div 
          className="dashboard-action-bar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ViewToggle view={view} onViewChange={setView} />

          <motion.button 
            className="fab-btn"
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExpenseModal(true)}
          >
            <HiOutlinePlus size={18} />
            <span className="fab-text">Add Expense</span>
          </motion.button>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {view === "all" ? (
            <motion.div
              key="all-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="dashboard-grid">
                <ExpenseTimeline 
                  expenses={expenses} 
                  onExpenseClick={setSelectedExpense}
                />
                
                <SummaryCard 
                  totalExpenses={totalExpenses}
                  perHead={perHead}
                  membersCount={roomDetails.members.length}
                  balances={balances}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="categories-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CategoryView
                categories={categories}
                expenses={expenses}
                members={roomDetails.members}
                currentUserId={user?._id}
                onExpenseClick={setSelectedExpense}
                onRecordSettlement={(tx) => {
                  setInitialSettleData({
                    amount: tx.amount,
                    paidBy: tx.from._id,
                    splitAmong: [tx.to._id],
                    isSettlement: true,
                    categoryId: tx.categoryId,
                  });
                  setShowExpenseModal(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showExpenseModal && (
          <AddExpenseSheet
            roomId={roomId}
            members={roomDetails.members}
            categories={categories}
            initialData={initialSettleData}
            currentUserId={user?._id}
            onClose={() => {
              setShowExpenseModal(false);
              setInitialSettleData(null);
            }}
            onSuccess={() => {
              setShowExpenseModal(false);
              setInitialSettleData(null);
              loadDashboard();
            }}
          />
        )}

        {selectedExpense && (
          <ExpenseDetailSheet
            expense={selectedExpense}
            members={roomDetails.members}
            isAdmin={isAdmin}
            currentUserId={user?._id}
            onClose={() => setSelectedExpense(null)}
            onDelete={handleDeleteExpense}
          />
        )}
      </AnimatePresence>

      <GlassDialog
        open={showLeaveConfirm}
        icon="danger"
        title="Leave Room"
        message="You won't be able to see expenses or settlements until you rejoin."
        confirmText="Leave"
        cancelText="Stay"
        danger={true}
        onConfirm={handleLeaveRoom}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
