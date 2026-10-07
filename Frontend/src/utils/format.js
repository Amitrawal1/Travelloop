export const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
