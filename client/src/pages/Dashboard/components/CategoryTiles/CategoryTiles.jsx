import { motion } from "framer-motion";
import "./CategoryTiles.css";

// Map common expense names to emojis
const CATEGORY_ICONS = {
  all: "🏠", water: "💧", electricity: "⚡", food: "🍕", snacks: "🍿",
  groceries: "🛒", rent: "🏡", gas: "⛽", internet: "📡",
  phone: "📱", laundry: "👕", transport: "🚌", medicine: "💊",
  cleaning: "🧹", repairs: "🔧", subscription: "📺", milk: "🥛",
  gym: "💪", pet: "🐾", misc: "📦",
};

function getIcon(name) {
  const key = name.toLowerCase().trim();
  if (CATEGORY_ICONS[key]) return CATEGORY_ICONS[key];
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return "📋";
}

export default function CategoryTiles({ categories, activeCategory, onSelect }) {
  // categories is now an array of { _id, name, color, icon } objects from DB
  // We prepend an "All" pseudo-tile

  return (
    <div className="category-grid">
      {/* All tile */}
      <motion.div
        className={`cat-tile ${activeCategory === "All" ? "active" : ""}`}
        onClick={() => onSelect("All")}
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={activeCategory === "All" ? { borderColor: "rgba(255,255,255,0.3)" } : {}}
      >
        <span className="cat-icon">🏠</span>
        <span className="cat-label">All</span>
      </motion.div>

      {categories.map((cat, idx) => {
        const isActive = activeCategory === cat.name;
        const color = cat.color || "#3b82f6";

        return (
          <motion.div
            key={cat._id || cat.name}
            className={`cat-tile ${isActive ? "active" : ""}`}
            onClick={() => onSelect(cat.name)}
            whileTap={{ scale: 0.92 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (idx + 1) * 0.04 }}
            style={isActive ? {
              borderColor: color,
              background: `${color}20`, /* 12% opacity */
              boxShadow: `0 0 16px ${color}25`,
            } : {}}
          >
            <span className="cat-icon">{cat.icon || getIcon(cat.name)}</span>
            <span className="cat-label" style={isActive ? { color } : {}}>{cat.name}</span>
            <div className="cat-color-dot" style={{ background: color }}></div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Export for use in other components
export { getIcon, CATEGORY_ICONS };
