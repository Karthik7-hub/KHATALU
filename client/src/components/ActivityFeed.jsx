import { HiOutlineClock } from "react-icons/hi2";

export default function ActivityFeed({ activities }) {
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "added_expense": return "💰";
      case "deleted_expense": return "🗑️";
      case "joined_room": return "👋";
      case "left_room": return "🚪";
      case "created_room": return "🏠";
      case "removed_member": return "❌";
      default: return "📋";
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <HiOutlineClock className="text-secondary" size={16} />
        <h3 style={{ marginBottom: 0 }}>Recent Activity</h3>
      </div>

      {!activities || activities.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-muted text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="list-container flex-col gap-2">
          {activities.map((activity, index) => (
            <div key={activity._id || index} className="flex items-start gap-3 py-2 px-1">
              <span className="text-sm mt-1 flex-shrink-0">{getActionIcon(activity.action)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-secondary text-xs mb-1">{activity.description}</p>
                <span className="text-muted" style={{ fontSize: "10px" }}>{formatTime(activity.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
