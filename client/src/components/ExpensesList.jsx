import { useState } from "react";
import { HiOutlineTrash, HiOutlineCalendarDays } from "react-icons/hi2";
import { useRoom } from "../context/RoomContext";
import ConfirmModal from "./ConfirmModal";

export default function ExpensesList({ expenses, currentUserId, adminId, roomId, onRefresh }) {
  const { deleteExpense } = useRoom();
  const [deletingExpense, setDeletingExpense] = useState(null);

  const adminIdStr = adminId?._id?.toString() || adminId?.toString();
  const isCurrentUserAdmin = currentUserId === adminIdStr;

  const handleDelete = async () => {
    if (!deletingExpense) return;
    try {
      await deleteExpense(deletingExpense._id);
      setDeletingExpense(null);
      onRefresh();
    } catch {
      // handled in context
    }
  };

  const canDelete = (expense) => {
    const addedById = expense.addedBy?._id?.toString() || expense.addedBy?.toString();
    return addedById === currentUserId || isCurrentUserAdmin;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3>Recent Expenses</h3>
        <span className="text-muted text-xs">{expenses.length} total</span>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-secondary text-sm">No expenses yet</p>
          <p className="text-muted text-xs mt-1">Add one to get started!</p>
        </div>
      ) : (
        <div className="list-container">
          {expenses.map((expense) => {
            const paidByName = expense.paidBy?.name || "Unknown";
            const splitCount = expense.splitAmong?.length || 0;

            return (
              <div key={expense._id} className="list-row group" style={{ position: "relative" }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="icon-box icon-accent" style={{ fontWeight: "bold" }}>
                    ${Number(expense.totalAmount).toFixed(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm truncate mb-1">{expense.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-secondary text-xs">Paid by {paidByName}</span>
                      <span className="text-muted text-xs">•</span>
                      <span className="text-secondary text-xs">Split {splitCount} way{splitCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div style={{ textAlign: "right", marginRight: "8px" }}>
                    <p className="amount text-sm mb-1">${Number(expense.totalAmount).toFixed(2)}</p>
                    <div className="flex items-center gap-1 justify-end text-muted text-xs">
                      <HiOutlineCalendarDays size={12} />
                      {formatDate(expense.date || expense.createdAt)}
                    </div>
                  </div>

                  {canDelete(expense) && (
                    <button
                      onClick={() => setDeletingExpense(expense)}
                      className="btn btn-ghost text-danger action-btn"
                      style={{ padding: "6px" }}
                      title="Delete expense"
                    >
                      <HiOutlineTrash size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deletingExpense && (
        <ConfirmModal
          title="Delete Expense"
          message={`Are you sure you want to delete "${deletingExpense.title}" ($${Number(deletingExpense.totalAmount).toFixed(2)})?`}
          confirmText="Delete"
          confirmColor="btn-danger"
          onConfirm={handleDelete}
          onCancel={() => setDeletingExpense(null)}
        />
      )}
    </div>
  );
}
