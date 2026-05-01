import Room from "../models/Room.js";
import Expense from "../models/Expense.js";
import Activity from "../models/Activity.js";
import Category from "../models/Category.js";
import { generateJoinCode } from "../utils/generateJoinCode.js";
import { calculateNetBalances, minimizeTransactions } from "../utils/settlement.js";

/**
 * POST /api/room/create
 * Creates a new room. The authenticated user becomes the admin and first member.
 */
export const createRoom = async (req, res) => {
  try {
    const { roomName } = req.body;

    if (!roomName || roomName.trim().length === 0) {
      return res.status(400).json({ error: "Room name is required" });
    }

    if (roomName.trim().length > 50) {
      return res.status(400).json({ error: "Room name cannot exceed 50 characters" });
    }

    const joinCode = await generateJoinCode();

    const room = await Room.create({
      adminId: req.user._id,
      roomName: roomName.trim(),
      joinCode,
      members: [req.user._id],
    });

    // Log activity
    await Activity.create({
      roomId: room._id,
      userId: req.user._id,
      action: "created_room",
      description: `${req.user.name} created the room "${room.roomName}"`,
    });

    return res.status(201).json({
      roomId: room._id,
      joinCode: room.joinCode,
      roomName: room.roomName,
      members: room.members,
    });
  } catch (error) {
    console.error("Create room error:", error.message);
    return res.status(500).json({ error: "Failed to create room" });
  }
};

/**
 * POST /api/room/join
 * Joins an existing room via the 6-character join code.
 */
export const joinRoom = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode || joinCode.trim().length !== 6) {
      return res.status(400).json({ error: "A valid 6-character join code is required" });
    }

    const room = await Room.findOne({ joinCode: joinCode.trim().toUpperCase() });

    if (!room) {
      return res.status(404).json({ error: "Invalid join code. Room not found." });
    }

    // Check if user is already a member
    const isAlreadyMember = room.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(409).json({ error: "You are already a member of this room" });
    }

    // Check member limit (10 max)
    if (room.members.length >= 10) {
      return res.status(400).json({ error: "Room is full (maximum 10 members)" });
    }

    room.members.push(req.user._id);
    await room.save();

    // Log activity
    await Activity.create({
      roomId: room._id,
      userId: req.user._id,
      action: "joined_room",
      description: `${req.user.name} joined the room`,
    });

    const populatedRoom = await Room.findById(room._id).populate(
      "members",
      "name email avatarUrl"
    );

    return res.status(200).json({
      roomId: populatedRoom._id,
      roomName: populatedRoom.roomName,
      members: populatedRoom.members,
    });
  } catch (error) {
    console.error("Join room error:", error.message);
    return res.status(500).json({ error: "Failed to join room" });
  }
};

/**
 * GET /api/room/:roomId/dashboard
 * Returns full room dashboard data: room details, expenses, balances, settlements, and recent activity.
 * Only accessible by room members.
 */
export const getDashboard = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId).populate(
      "members",
      "name email avatarUrl"
    );

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Verify membership
    const isMember = room.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this room" });
    }

    // Fetch all expenses for this room
    const expenses = await Expense.find({ roomId })
      .populate("addedBy", "name email avatarUrl")
      .populate("paidBy", "name email avatarUrl")
      .populate("splitAmong", "name email avatarUrl")
      .sort({ createdAt: -1 });

    // Fetch categories for this room
    const categories = await Category.find({ roomId })
      .populate("defaultMembers", "name email avatarUrl")
      .sort({ createdAt: 1 });

    // Calculate balances and settlements
    const { balances, totalExpenses, perHead } = calculateNetBalances(expenses, room.members);
    const settlements = minimizeTransactions(balances);

    // Fetch recent activities (last 20)
    const activities = await Activity.find({ roomId })
      .populate("userId", "name avatarUrl")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      roomDetails: {
        _id: room._id,
        roomName: room.roomName,
        joinCode: room.joinCode,
        adminId: room.adminId,
        members: room.members,
        createdAt: room.createdAt,
      },
      expenses,
      categories,
      balances,
      totalExpenses,
      perHead,
      settlements,
      activities,
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    return res.status(500).json({ error: "Failed to load dashboard" });
  }
};

/**
 * GET /api/room/my-rooms
 * Returns all rooms the authenticated user is a member of.
 */
export const getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate("members", "name email avatarUrl")
      .populate("adminId", "name email avatarUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({ rooms });
  } catch (error) {
    console.error("Get my rooms error:", error.message);
    return res.status(500).json({ error: "Failed to fetch rooms" });
  }
};

/**
 * POST /api/room/:roomId/leave
 * Lets a user leave a room. Admin cannot leave (must delete room instead).
 */
export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Admin cannot leave
    if (room.adminId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Admin cannot leave the room. Delete the room instead." });
    }

    // Must be a member
    const memberIndex = room.members.findIndex(
      (m) => m.toString() === req.user._id.toString()
    );
    if (memberIndex === -1) {
      return res.status(403).json({ error: "You are not a member of this room" });
    }

    room.members.splice(memberIndex, 1);
    await room.save();

    await Activity.create({
      roomId: room._id,
      userId: req.user._id,
      action: "left_room",
      description: `${req.user.name} left the room`,
    });

    return res.status(200).json({ message: "Successfully left the room" });
  } catch (error) {
    console.error("Leave room error:", error.message);
    return res.status(500).json({ error: "Failed to leave room" });
  }
};

/**
 * DELETE /api/room/:roomId/member/:memberId
 * Admin-only: remove a member from the room.
 */
export const removeMember = async (req, res) => {
  try {
    const { roomId, memberId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Only admin can remove members
    if (room.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the room admin can remove members" });
    }

    // Cannot remove self (admin)
    if (memberId === req.user._id.toString()) {
      return res.status(400).json({ error: "Admin cannot remove themselves" });
    }

    const memberIndex = room.members.findIndex(
      (m) => m.toString() === memberId
    );
    if (memberIndex === -1) {
      return res.status(404).json({ error: "Member not found in this room" });
    }

    room.members.splice(memberIndex, 1);
    await room.save();

    await Activity.create({
      roomId: room._id,
      userId: req.user._id,
      action: "removed_member",
      description: `${req.user.name} removed a member from the room`,
      metadata: { removedMemberId: memberId },
    });

    return res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error.message);
    return res.status(500).json({ error: "Failed to remove member" });
  }
};

/**
 * DELETE /api/room/:roomId
 * Admin-only: delete the entire room and all associated data.
 */
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the room admin can delete the room" });
    }

    // Delete all associated expenses and activities
    await Expense.deleteMany({ roomId });
    await Activity.deleteMany({ roomId });
    await Room.findByIdAndDelete(roomId);

    return res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete room error:", error.message);
    return res.status(500).json({ error: "Failed to delete room" });
  }
};
