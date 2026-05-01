/**
 * Ledger Settlement Logic — supports partial splits
 *
 * Each expense has a `splitAmong` array.
 * If empty → split equally among ALL members.
 * If populated → split only among those specific users.
 */

export const calculateNetBalances = (expenses, members) => {
  if (!members || members.length === 0) return { balances: [], totalExpenses: 0, perHead: 0 };

  const paidTotals = {};
  const owedTotals = {};
  let totalExpenses = 0;

  members.forEach((m) => {
    const id = m._id.toString();
    paidTotals[id] = 0;
    owedTotals[id] = 0;
  });

  expenses.forEach((expense) => {
    const amount = Number(expense.totalAmount) || 0;
    
    // Settlements don't count towards the overall room spending
    if (!expense.isSettlement) {
      totalExpenses += amount;
    }

    const payerId = expense.paidBy?._id?.toString() || expense.paidBy?.toString();
    if (paidTotals[payerId] !== undefined) {
      paidTotals[payerId] += amount;
    }

    // Determine who owes for this expense
    let splitIds;
    if (expense.splitAmong && expense.splitAmong.length > 0) {
      splitIds = expense.splitAmong.map(id =>
        typeof id === "object" && id._id ? id._id.toString() : id.toString()
      );
    } else {
      // All members
      splitIds = members.map(m => m._id.toString());
    }

    const perPerson = amount / splitIds.length;
    splitIds.forEach((id) => {
      if (owedTotals[id] !== undefined) {
        owedTotals[id] += perPerson;
      }
    });
  });

  const perHead = members.length > 0 ? totalExpenses / members.length : 0;

  const balances = members.map((member) => {
    const memberId = member._id.toString();
    const paid = paidTotals[memberId] || 0;
    const owed = owedTotals[memberId] || 0;

    // Positive = should receive money, Negative = owes money
    const balance = paid - owed;

    return {
      userId: memberId,
      name: member.name,
      avatarUrl: member.avatarUrl,
      paid: Number(paid.toFixed(2)),
      owed: Number(owed.toFixed(2)),
      balance: Number(balance.toFixed(2)),
    };
  });

  return { balances, totalExpenses: Number(totalExpenses.toFixed(2)), perHead: Number(perHead.toFixed(2)) };
};

/**
 * Greedy algorithm to minimize settlement transactions.
 */
export const minimizeTransactions = (balances) => {
  let debtors = balances.filter((b) => b.balance < -0.01).map((b) => ({ ...b, amountOwed: Math.abs(b.balance) }));
  let creditors = balances.filter((b) => b.balance > 0.01).map((b) => ({ ...b, amountToGet: b.balance }));

  debtors.sort((a, b) => b.amountOwed - a.amountOwed);
  creditors.sort((a, b) => b.amountToGet - a.amountToGet);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amountOwed, creditor.amountToGet);
    const roundedAmount = Number(amount.toFixed(2));

    if (roundedAmount > 0) {
      transactions.push({ from: debtor.userId, to: creditor.userId, amount: roundedAmount });
    }

    debtor.amountOwed -= amount;
    creditor.amountToGet -= amount;

    if (debtor.amountOwed < 0.01) i++;
    if (creditor.amountToGet < 0.01) j++;
  }

  return transactions;
};
