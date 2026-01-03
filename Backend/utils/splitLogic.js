/**
 * Core Logic for Splitting Expenses.
 * This pure function takes the expense details and calculates exactly how much each person owes.
 * 
 * @param {object} params
 * @param {number} params.amount - Total amount of expense
 * @param {Array} params.members - Array of all group member IDs
 * @param {string} params.paidBy - ID of the person who paid
 * @param {string} params.splitType - 'equal', 'exact', or 'between'
 * @param {object} [params.exactValues] - Map of {userId: amount} for 'exact' split
 * @param {Array} [params.selectedMembers] - Array of userIds for 'between' split
 * @returns {object} { paidBy, splits: [{ userId, owed }] }
 */
export function splitExpense({
  amount,
  members,
  paidBy,
  splitType,           // equal | exact | between
  exactValues = {},
  selectedMembers = []
}) {
  if (!amount || amount <= 0) throw new Error("Invalid amount");
  if (!members || members.length === 0) throw new Error("No members found");
  if (!paidBy) throw new Error("paidBy is required");

  // Normalize all IDs to strings for consistent comparison
  members = members.map(m => m.toString());
  const splits = [];

  // 1. Equal Split: Divide total amount equally among ALL group members
  if (splitType === "equal") {
    const share = Number((amount / members.length).toFixed(2));

    members.forEach((m) => {
      splits.push({
        userId: m,
        owed: share
      });
    });
  }

  // 2. Exact Split: User specifies exactly how much each person owes
  // We must verify that the sum of these amounts equals the total expense.
  else if (splitType === "exact") {
    let totalExact = 0;

    members.forEach(m => {
      const v = Number(exactValues[m] || 0);
      totalExact += v;

      splits.push({
        userId: m,
        owed: v
      });
    });

    // Validation: Floating point comparison with 2 decimals
    if (Number(totalExact.toFixed(2)) !== Number(amount)) {
      throw new Error("Exact split values must equal total amount");
    }
  }

  // 3. Split Between: Divide total amount equally among a SELECTED SUBSET of members
  else if (splitType === "between") {
    if (!selectedMembers || selectedMembers.length === 0) {
      throw new Error("Select at least one member");
    }

    selectedMembers = selectedMembers.map(id => id.toString());
    const share = Number((amount / selectedMembers.length).toFixed(2));

    members.forEach(m => {
      splits.push({
        userId: m,
        // Only selected members owe money; others owe 0
        owed: selectedMembers.includes(m) ? share : 0
      });
    });
  }

  else {
    throw new Error("Invalid split type");
  }

  return {
    paidBy: paidBy.toString(),
    splits
  };
}
