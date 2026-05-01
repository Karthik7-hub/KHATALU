import { motion } from "framer-motion";
import "./ViewToggle.css";

export default function ViewToggle({ view, onViewChange }) {
  return (
    <div className="seg-control">
      {/* Sliding indicator */}
      <motion.div
        className="seg-indicator"
        layout
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        style={{ left: view === "all" ? "3px" : "calc(50% - 1px)" }}
      />
      <button
        className={`seg-btn ${view === "all" ? "active" : ""}`}
        onClick={() => onViewChange("all")}
      >
        Overview
      </button>
      <button
        className={`seg-btn ${view === "categories" ? "active" : ""}`}
        onClick={() => onViewChange("categories")}
      >
        Categories
      </button>
    </div>
  );
}
