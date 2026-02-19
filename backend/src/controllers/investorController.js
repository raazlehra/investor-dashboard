const { query } = require('../config/database');

// Calculate profit/loss for a single holding
const calculateProfitLoss = (currentPrice, buyPrice, quantity) => {
  const profitLoss = (currentPrice - buyPrice) * quantity;
  const profitLossPercentage = ((currentPrice - buyPrice) / buyPrice) * 100;
  return {
    profitLoss: parseFloat(profitLoss.toFixed(2)),
    profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2))
  };
};

const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get investor's portfolio with current share prices
    const result = await query(
      `SELECT 
        i.id,
        i.company_name,
        i.firm_name,
        i.share_name,
        i.share_quantity,
        i.buy_price,
        i.created_at,
        sp.current_price
       FROM investors i
       LEFT JOIN share_prices sp ON i.share_name = sp.share_name
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC`,
      [userId]
    );

    // Calculate profit/loss for each holding
    const portfolio = result.rows.map(holding => {
      const currentPrice = holding.current_price || holding.buy_price;
      const { profitLoss, profitLossPercentage } = calculateProfitLoss(
        currentPrice,
        holding.buy_price,
        holding.share_quantity
      );

      return {
        ...holding,
        current_price: currentPrice,
        profit_loss: profitLoss,
        profit_loss_percentage: profitLossPercentage,
        total_value: parseFloat((currentPrice * holding.share_quantity).toFixed(2)),
        total_cost: parseFloat((holding.buy_price * holding.share_quantity).toFixed(2))
      };
    });

    // Calculate portfolio summary
    const summary = portfolio.reduce(
      (acc, holding) => {
        acc.totalInvestment += holding.total_cost;
        acc.currentValue += holding.total_value;
        acc.totalProfitLoss += holding.profit_loss;
        return acc;
      },
      { totalInvestment: 0, currentValue: 0, totalProfitLoss: 0 }
    );

    // Calculate overall profit/loss percentage
    summary.profitLossPercentage = summary.totalInvestment > 0
      ? parseFloat(((summary.totalProfitLoss / summary.totalInvestment) * 100).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        holdings: portfolio,
        summary: {
          totalInvestment: parseFloat(summary.totalInvestment.toFixed(2)),
          currentValue: parseFloat(summary.currentValue.toFixed(2)),
          totalProfitLoss: parseFloat(summary.totalProfitLoss.toFixed(2)),
          profitLossPercentage: summary.profitLossPercentage
        }
      }
    });
  } catch (err) {
    console.error('Get portfolio error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching portfolio.'
    });
  }
};

const getSharePrices = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        share_name,
        current_price,
        updated_at
       FROM share_prices
       ORDER BY share_name ASC`
    );

    return res.status(200).json({
      success: true,
      data: {
        sharePrices: result.rows
      }
    });
  } catch (err) {
    console.error('Get share prices error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching share prices.'
    });
  }
};

const getHoldingDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const holdingId = req.params.id;

    const result = await query(
      `SELECT 
        i.id,
        i.company_name,
        i.firm_name,
        i.share_name,
        i.share_quantity,
        i.buy_price,
        i.created_at,
        sp.current_price
       FROM investors i
       LEFT JOIN share_prices sp ON i.share_name = sp.share_name
       WHERE i.id = $1 AND i.user_id = $2`,
      [holdingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found.'
      });
    }

    const holding = result.rows[0];
    const currentPrice = holding.current_price || holding.buy_price;
    const { profitLoss, profitLossPercentage } = calculateProfitLoss(
      currentPrice,
      holding.buy_price,
      holding.share_quantity
    );

    return res.status(200).json({
      success: true,
      data: {
        holding: {
          ...holding,
          current_price: currentPrice,
          profit_loss: profitLoss,
          profit_loss_percentage: profitLossPercentage,
          total_value: parseFloat((currentPrice * holding.share_quantity).toFixed(2)),
          total_cost: parseFloat((holding.buy_price * holding.share_quantity).toFixed(2))
        }
      }
    });
  } catch (err) {
    console.error('Get holding details error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching holding details.'
    });
  }
};

module.exports = {
  getPortfolio,
  getSharePrices,
  getHoldingDetails
};
