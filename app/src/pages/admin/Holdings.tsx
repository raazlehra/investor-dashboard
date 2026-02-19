import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency } from '../../utils/currency';

import { 
  PieChart, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  User,
  Building2,
  TrendingUp
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { AdminHolding, AdminUser } from '../../types';

export const AdminHoldings: React.FC = () => {
  const [holdings, setHoldings] = useState<AdminHolding[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<AdminHolding | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    user_id: '',
    company_name: '',
    firm_name: '',
    share_name: '',
    share_quantity: '',
    buy_price: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [holdingsResponse, usersResponse] = await Promise.all([
        adminApi.getAllHoldings(),
        adminApi.getAllUsers(),
      ]);

      if (holdingsResponse.success && holdingsResponse.data) {
        setHoldings(holdingsResponse.data.holdings);
      }

      if (usersResponse.success && usersResponse.data) {
        // Filter only investor users
        setUsers(usersResponse.data.users.filter(u => u.role === 'investor'));
      }
    } catch (err) {
      setError('An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedHolding(null);
    setFormData({
      user_id: '',
      company_name: '',
      firm_name: '',
      share_name: '',
      share_quantity: '',
      buy_price: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (holding: AdminHolding) => {
    setIsEditMode(true);
    setSelectedHolding(holding);
    setFormData({
      user_id: holding.user_id.toString(),
      company_name: holding.company_name,
      firm_name: holding.firm_name,
      share_name: holding.share_name,
      share_quantity: holding.share_quantity.toString(),
      buy_price: holding.buy_price.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (holdingId: number) => {
    if (!window.confirm('Are you sure you want to delete this holding?')) {
      return;
    }

    try {
      const response = await adminApi.deleteHolding(holdingId);
      if (response.success) {
        setSuccess('Holding deleted successfully');
        fetchData();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to delete holding');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const quantity = parseInt(formData.share_quantity);
    const price = parseFloat(formData.buy_price);

    if (isNaN(quantity) || quantity < 1) {
      setError('Please enter a valid quantity');
      return;
    }

    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      if (isEditMode && selectedHolding) {
        const response = await adminApi.updateHolding(selectedHolding.id, {
          share_quantity: quantity,
          buy_price: price,
        });
        
        if (response.success) {
          setSuccess('Holding updated successfully');
          setIsModalOpen(false);
          fetchData();
        } else {
          setError(response.message || 'Failed to update holding');
        }
      } else {
        const response = await adminApi.createHolding({
          user_id: parseInt(formData.user_id),
          company_name: formData.company_name,
          firm_name: formData.firm_name,
          share_name: formData.share_name.toUpperCase(),
          share_quantity: quantity,
          buy_price: price,
        });
        
        if (response.success) {
          setSuccess('Holding created successfully');
          setIsModalOpen(false);
          fetchData();
        } else {
          setError(response.message || 'Failed to create holding');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Holdings Management</h1>
        <Button onClick={handleCreate} variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Holding
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Investor
                  </th>
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
                    Current
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holdings.map((holding) => (
                  <tr key={holding.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {holding.username}
                        </span>
                      </div>
                    </td>
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
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(holding)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(holding.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Holding' : 'Add Holding'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!isEditMode && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Investor
                    </label>
                    <select
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select Investor</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <Input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                      placeholder="e.g., Apple Inc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Firm Name
                    </label>
                    <Input
                      type="text"
                      value={formData.firm_name}
                      onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                      required
                      placeholder="e.g., Tech Investments LLC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Share Symbol
                    </label>
                    <Input
                      type="text"
                      value={formData.share_name}
                      onChange={(e) => setFormData({ ...formData, share_name: e.target.value })}
                      required
                      placeholder="e.g., AAPL"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Share Quantity
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.share_quantity}
                  onChange={(e) => setFormData({ ...formData, share_quantity: e.target.value })}
                  required
                  placeholder="e.g., 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buy Price ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.buy_price}
                  onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                  required
                  placeholder="e.g., 150.00"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {isEditMode ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHoldings;
