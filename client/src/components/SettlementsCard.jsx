import { HiOutlineArrowLongRight } from "react-icons/hi2";

export default function SettlementsCard({ settlements, members }) {
  const memberMap = {};
  if (members) {
    for (const m of members) {
      memberMap[m._id?.toString()] = m;
    }
  }

  const getName = (userId) => memberMap[userId]?.name || "Unknown";
  const getAvatar = (userId) => memberMap[userId]?.avatarUrl || "";

  if (!settlements || settlements.length === 0) {
    return (
      <div className="card">
        <h3 className="mb-4">Settlements</h3>
        <div className="text-center py-6">
          <p className="balance-positive" style={{ fontSize: "14px" }}>✨ All Settled!</p>
          <p className="text-muted text-xs mt-1">No payments needed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-4">Settlements</h3>

      <div className="list-container flex-col gap-2">
        {settlements.map((txn, index) => {
          const fromName = getName(txn.from);
          const toName = getName(txn.to);
          const fromAvatar = getAvatar(txn.from);
          const toAvatar = getAvatar(txn.to);

          return (
            <div key={`${txn.from}-${txn.to}-${index}`} className="list-row" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              {/* From user */}
              <div className="flex items-center gap-2 flex-1 truncate">
                {fromAvatar ? (
                  <img src={fromAvatar} alt={fromName} className="avatar avatar-sm" referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar avatar-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>{fromName.charAt(0)}</div>
                )}
                <span className="text-secondary text-xs truncate">{fromName}</span>
              </div>

              {/* Arrow + Amount */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <HiOutlineArrowLongRight color="var(--border)" size={16} />
                <span className="amount font-semibold text-sm">${Number(txn.amount).toFixed(2)}</span>
                <HiOutlineArrowLongRight color="var(--border)" size={16} />
              </div>

              {/* To user */}
              <div className="flex items-center gap-2 flex-1 justify-end truncate">
                <span className="text-secondary text-xs truncate">{toName}</span>
                {toAvatar ? (
                  <img src={toAvatar} alt={toName} className="avatar avatar-sm" referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar avatar-sm" style={{ background: "var(--success-bg)", color: "var(--success)" }}>{toName.charAt(0)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
