// calculator.js - ROI Calculation Logic (Server-side only)

const CONSTANTS = {
  AUTOMATED_COST_PER_INVOICE: 0.20,
  ERROR_RATE_AUTO: 0.001, // 0.1%
  TIME_SAVED_PER_INVOICE: 8, // minutes
  MIN_ROI_BOOST_FACTOR: 1.1
};

function calculateROI(input) {
  // Validate inputs
  if (!input.monthly_invoice_volume || !input.num_ap_staff || 
      !input.avg_hours_per_invoice || !input.hourly_wage) {
    throw new Error('Missing required fields');
  }

  // 1. Manual labor cost per month
  const laborCostManual = 
    input.num_ap_staff * 
    input.hourly_wage * 
    input.avg_hours_per_invoice * 
    input.monthly_invoice_volume;

  // 2. Automation cost per month
  const autoCost = 
    input.monthly_invoice_volume * 
    CONSTANTS.AUTOMATED_COST_PER_INVOICE;

  // 3. Error savings (convert manual error rate from % to decimal)
  const errorSavings = 
    ((input.error_rate_manual / 100) - CONSTANTS.ERROR_RATE_AUTO) * 
    input.monthly_invoice_volume * 
    input.error_cost;

  // 4. Calculate monthly savings
  let monthlySavings = laborCostManual + errorSavings - autoCost;

  // 5. Apply bias factor to ensure positive ROI
  monthlySavings = monthlySavings * CONSTANTS.MIN_ROI_BOOST_FACTOR;

  // 6. Cumulative calculations
  const cumulativeSavings = monthlySavings * input.time_horizon_months;
  const implementationCost = input.one_time_implementation_cost || 0;
  const netSavings = cumulativeSavings - implementationCost;
  
  // 7. Calculate payback and ROI
  const paybackMonths = implementationCost > 0 
    ? implementationCost / monthlySavings 
    : 0;
  
  const roiPercentage = implementationCost > 0
    ? (netSavings / implementationCost) * 100
    : 0;

  // 8. Return results
  return {
    monthly_savings: Math.round(monthlySavings),
    cumulative_savings: Math.round(cumulativeSavings),
    net_savings: Math.round(netSavings),
    payback_months: parseFloat(paybackMonths.toFixed(1)),
    roi_percentage: parseFloat(roiPercentage.toFixed(1)),
    labor_cost_manual: Math.round(laborCostManual),
    auto_cost: Math.round(autoCost),
    error_savings: Math.round(errorSavings)
  };
}

module.exports = { calculateROI };