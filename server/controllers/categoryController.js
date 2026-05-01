import Category from "../models/Category.js";
import Room from "../models/Room.js";

/**
 * POST /api/category
 * Create a new category for a room.
 */
export const createCategory = async (req, res) => {
  try {
    const { roomId, name, color, icon, defaultMembers } = req.body;

    if (!roomId || !name?.trim()) {
      return res.status(400).json({ error: "roomId and name are required" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const isMember = room.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ error: "Not a room member" });

    // Use all members as default if none specified
    const members = defaultMembers && defaultMembers.length > 0
      ? defaultMembers
      : room.members.map(m => m.toString());

    const category = await Category.findOneAndUpdate(
      { roomId, name: name.trim() },
      {
        $setOnInsert: { createdBy: req.user._id },
        $set: {
          color: color || "#3b82f6",
          icon: icon || "📋",
          defaultMembers: members,
        },
      },
      { new: true, upsert: true }
    );

    return res.status(201).json(category);
  } catch (error) {
    console.error("Create category error:", error.message);
    return res.status(500).json({ error: "Failed to create category" });
  }
};

/**
 * GET /api/category/:roomId
 * Get all categories for a room.
 */
export const getCategories = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const isMember = room.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ error: "Not a room member" });

    const categories = await Category.find({ roomId })
      .populate("defaultMembers", "name email avatarUrl")
      .sort({ createdAt: 1 });

    return res.status(200).json({ categories });
  } catch (error) {
    console.error("Get categories error:", error.message);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
};

/**
 * PUT /api/category/:categoryId
 * Update a category (color, defaultMembers, etc.)
 */
export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { color, icon, defaultMembers } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ error: "Category not found" });

    if (color) category.color = color;
    if (icon) category.icon = icon;
    if (defaultMembers) category.defaultMembers = defaultMembers;

    await category.save();
    return res.status(200).json(category);
  } catch (error) {
    console.error("Update category error:", error.message);
    return res.status(500).json({ error: "Failed to update category" });
  }
};
