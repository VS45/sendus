function money(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateCharge(distanceKm, itemCount) {
  const baseFee = Number(process.env.BASE_FEE || 2);
  const distanceRate = Number(process.env.DISTANCE_RATE || 0.5);
  const itemRate = Number(process.env.ITEM_RATE || 0.5);

  const distanceFee = money(Number(distanceKm) * distanceRate);
  const itemFee = money(Number(itemCount) * itemRate);
  const total = money(baseFee + distanceFee + itemFee);

  return { baseFee, distanceRate, itemRate, distanceFee, itemFee, total };
}

module.exports = { calculateCharge, money };
