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

  // Normalize all IDs to strings
  members = members.map(m => m.toString());
  const splits = [];

  if (splitType === "equal") {
    const share = Number((amount / members.length).toFixed(2));

    members.forEach((m) => {
      splits.push({
        userId: m,
        owed: share
      });
    });
  }

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

    if (Number(totalExact.toFixed(2)) !== Number(amount)) {
      throw new Error("Exact split values must equal total amount");
    }
  }

  else if (splitType === "between") {
    if (!selectedMembers || selectedMembers.length === 0) {
      throw new Error("Select at least one member");
    }

    selectedMembers = selectedMembers.map(id => id.toString());
    const share = Number((amount / selectedMembers.length).toFixed(2));

    members.forEach(m => {
      splits.push({
        userId: m,
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
