import { HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown } from "react-icons/hi2";

export default function BalancesCard({ balances }) {
  if (!balances || balances.length === 0) {
    return (
      <div className="card">
        <h3 className="mb-4">Balances</h3>
        <p className="text-muted text-sm text-center py-6">No expenses yet</p>
      </div>
    );
  }

  const sorted = [...balances].sort((a, b) => b.balance - a.balance);

  return (
    <div className="card">
      <h3 className="mb-4">Balances</h3>

      <div className="list-container">
        {sorted.map((entry) => {
          const isPositive = entry.balance > 0;
          const isZero = Math.abs(entry.balance) < 0.01;
          const absBalance = Math.abs(Number(entry.balance.toFixed(2)));

          return (
            <div key={entry.userId} className="list-row">
              <div className="flex items-center gap-3">
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt={entry.name} className="avatar avatar-sm" referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar avatar-sm">{entry.name?.charAt(0)?.toUpperCase()}</div>
                )}
                <span className="text-sm font-medium">{entry.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {!isZero && (
                  isPositive ? (
                    <HiOutlineArrowTrendingUp color="var(--success)" size={16} />
                  ) : (
                    <HiOutlineArrowTrendingDown color="var(--danger)" size={16} />
                  )
                )}
                <span className={isZero ? "text-muted" : isPositive ? "balance-positive" : "balance-negative"} style={{ fontSize: "14px" }}>
                  {isZero ? "$0.00" : isPositive ? `+$${absBalance.toFixed(2)}` : `-$${absBalance.toFixed(2)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
