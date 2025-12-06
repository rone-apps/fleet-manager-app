// Helper functions for account management

export const calculateTotal = (fareAmount, tipAmount) => {
  const fare = parseFloat(fareAmount) || 0;
  const tip = parseFloat(tipAmount) || 0;
  return (fare + tip).toFixed(2);
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('en-CA');
};

export const getStatusColor = (status) => {
  switch (status) {
    case "PAID": return "success";
    case "SENT": return "info";
    case "PARTIAL": return "warning";
    case "OVERDUE": return "error";
    case "DRAFT": return "default";
    case "CANCELLED": return "default";
    default: return "default";
  }
};
