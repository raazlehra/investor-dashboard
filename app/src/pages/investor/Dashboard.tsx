import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency } from '../../utils/currency';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  Briefcase
} from 'lucide-react';
import { investorApi } from '../../services/api';
import { Holding, PortfolioSummary } from '../../types';

export const InvestorDashboard: React.FC = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      const response = await investorApi.getPortfolio();
      
      if (response.success && response.data) {
        setHoldings(response.data.holdings);
        setSummary(response.data.summary);
      } else {
        setError(response.message || 'Failed to load portfolio');
      }
    } catch (err) {
      setError('An error occurred while fetching your portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
        <button
          onClick={fetchPortfolio}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Investment</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(summary.totalInvestment, 'INR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <PieChart className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Current Value</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(summary.currentValue, 'INR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${summary.totalProfitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {summary.totalProfitLoss >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Profit/Loss</p>
                  <p className={`text-xl font-semibold ${summary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.totalProfitLoss, 'INR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${summary.profitLossPercentage >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Briefcase className={`h-6 w-6 ${summary.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Return %</p>
                  <p className={`text-xl font-semibold ${summary.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(summary.profitLossPercentage)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No holdings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Share
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buy Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P&L
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {holdings.map((holding) => (
                    <tr key={holding.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {holding.company_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {holding.firm_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {holding.share_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {holding.share_quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(holding.buy_price, 'INR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(holding.current_price || holding.buy_price, 'INR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(holding.total_value || 0, 'INR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-medium ${(holding.profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(holding.profit_loss || 0, 'INR')}
                        </div>
                        <div className={`text-xs ${(holding.profit_loss_percentage || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercentage(holding.profit_loss_percentage || 0)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestorDashboard;
