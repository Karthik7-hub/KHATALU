import {
  HiOutlineBanknotes,
  HiOutlineUsers,
  HiOutlineReceiptPercent,
  HiOutlineArrowTrendingUp,
} from "react-icons/hi2";

export default function StatsCards({ expenses, members }) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
  const roundedTotal = Number(totalExpenses.toFixed(2));
  const avgPerPerson = members.length > 0 ? Number((roundedTotal / members.length).toFixed(2)) : 0;

  const stats = [
    {
      label: "Total Expenses",
      value: `$${roundedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: HiOutlineBanknotes,
      iconClass: "icon-accent",
    },
    {
      label: "Members",
      value: members.length,
      icon: HiOutlineUsers,
      iconClass: "icon-success",
    },
    {
      label: "Bills",
      value: expenses.length,
      icon: HiOutlineReceiptPercent,
      iconClass: "icon-warning",
    },
    {
      label: "Avg / Person",
      value: `$${avgPerPerson.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: HiOutlineArrowTrendingUp,
      iconClass: "icon-danger", /* maybe reuse danger or normal */
    },
  ];

  return (
    <>
      {stats.map((stat) => (
        <div key={stat.label} className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-secondary text-xs uppercase" style={{ fontWeight: 600, letterSpacing: "0.05em" }}>
              {stat.label}
            </span>
            <div className={`icon-box ${stat.iconClass}`}>
              <stat.icon size={20} />
            </div>
          </div>
          <p className="stat-value">{stat.value}</p>
        </div>
      ))}
    </>
  );
}
