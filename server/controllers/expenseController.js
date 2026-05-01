import Expense from "../models/Expense.js";
import Room from "../models/Room.js";
import Activity from "../models/Activity.js";

/**
 * POST /api/expense
 * Adds a new ledger expense to a room. Only room members can add expenses.
 */
export const addExpense = async (req, res) => {
  try {
    const {
      roomId,
      title = "Expense",
      totalAmount,
      paidBy,
      splitAmong,
      categoryId,
      date,
    } = req.body;

    // ─── Validate required fields ──────────────────────────────────────
    if (!roomId || !title || !totalAmount || !paidBy) {
      return res.status(400).json({ error: "All fields are required: roomId, title, totalAmount, paidBy" });
    }

    if (typeof totalAmount !== "number" || totalAmount <= 0) {
      return res.status(400).json({ error: "totalAmount must be a positive number" });
    }

    // ─── Verify room and membership ────────────────────────────────────
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const memberIds = room.members.map((m) => m.toString());

    // Requester must be a member
    if (!memberIds.includes(req.user._id.toString())) {
      return res.status(403).json({ error: "You are not a member of this room" });
    }

    // paidBy must be a member
    if (!memberIds.includes(paidBy.toString())) {
      return res.status(400).json({ error: "paidBy user must be a room member" });
    }

    // Validate splitAmong if provided
    if (splitAmong && splitAmong.length > 0) {
      const invalidMembers = splitAmong.filter(id => !memberIds.includes(id.toString()));
      if (invalidMembers.length > 0) {
        return res.status(400).json({ error: "splitAmong contains non-members" });
      }
    }

    // ─── Validate amount ───────────────────────────────────────────
    const roundedAmount = Number(Number(totalAmount).toFixed(2));

    // ─── Create expense ────────────────────────────────────────────────
    const expense = await Expense.create({
      roomId,
      addedBy: req.user._id,
      title: title.trim(),
      totalAmount: roundedAmount,
      paidBy,
      splitAmong: splitAmong || [],
      categoryId: categoryId || undefined,
      isSettlement: Boolean(req.body.isSettlement),
      date: date || new Date(),
    });

    // Log activity
    await Activity.create({
      roomId,
      userId: req.user._id,
      action: "added_expense",
      description: `${req.user.name} added "${title}" — $${roundedAmount.toFixed(2)}`,
      metadata: { expenseId: expense._id },
    });

    return res.status(201).json({
      expenseId: expense._id,
      message: "Expense added successfully",
    });
  } catch (error) {
    console.error("Add expense error:", error.message);
    return res.status(500).json({ error: "Failed to add expense" });
  }
};

/**
 * DELETE /api/expense/:expenseId
 * Deletes an expense. Only the expense creator or room admin can delete.
 */
export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId).populate("addedBy", "name");
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const room = await Room.findById(expense.roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Authorization: only the creator or room admin can delete
    const isCreator = expense.addedBy._id.toString() === req.user._id.toString();
    const isAdmin = room.adminId.toString() === req.user._id.toString();

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        error: "Only the expense creator or room admin can delete this expense",
      });
    }

    // Verify requester is still a room member
    const isMember = room.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this room" });
    }

    const expenseTitle = expense.title;
    const expenseAmount = expense.totalAmount;

    await Expense.findByIdAndDelete(expenseId);

    // Log activity
    await Activity.create({
      roomId: room._id,
      userId: req.user._id,
      action: "deleted_expense",
      description: `${req.user.name} deleted "${expenseTitle}" — $${expenseAmount.toFixed(2)}`,
    });

    return res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete expense error:", error.message);
    return res.status(500).json({ error: "Failed to delete expense" });
  }
};
