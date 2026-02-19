import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency } from '../../utils/currency';

import { 
  TrendingUp, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  DollarSign
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { SharePrice } from '../../types';

export const AdminSharePrices: React.FC = () => {
  const [sharePrices, setSharePrices] = useState<SharePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedShare, setSelectedShare] = useState<SharePrice | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    share_name: '',
    current_price: '',
  });

  useEffect(() => {
    fetchSharePrices();
  }, []);

  const fetchSharePrices = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getAllSharePrices();
      
      if (response.success && response.data) {
        setSharePrices(response.data.sharePrices);
      } else {
        setError(response.message || 'Failed to load share prices');
      }
    } catch (err) {
      setError('An error occurred while fetching share prices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedShare(null);
    setFormData({
      share_name: '',
      current_price: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (share: SharePrice) => {
    setIsEditMode(true);
    setSelectedShare(share);
    setFormData({
      share_name: share.share_name,
      current_price: share.current_price.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (shareId: number) => {
    if (!window.confirm('Are you sure you want to delete this share price?')) {
      return;
    }

    try {
      const response = await adminApi.deleteSharePrice(shareId);
      if (response.success) {
        setSuccess('Share price deleted successfully');
        fetchSharePrices();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to delete share price');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const price = parseFloat(formData.current_price);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      if (isEditMode && selectedShare) {
        const response = await adminApi.updateSharePrice(selectedShare.id, {
          current_price: price,
        });
        
        if (response.success) {
          setSuccess('Share price updated successfully');
          setIsModalOpen(false);
          fetchSharePrices();
        } else {
          setError(response.message || 'Failed to update share price');
        }
      } else {
        const response = await adminApi.createSharePrice({
          share_name: formData.share_name.toUpperCase(),
          current_price: price,
        });
        
        if (response.success) {
          setSuccess('Share price created successfully');
          setIsModalOpen(false);
          fetchSharePrices();
        } else {
          setError(response.message || 'Failed to create share price');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <h1 className="text-2xl font-bold text-gray-900">Share Price Management</h1>
        <Button onClick={handleCreate} variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Share
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

      {/* Share Prices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sharePrices.map((share) => (
          <Card key={share.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {share.share_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Updated: {formatDate(share.updated_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(share.current_price, 'INR')}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(share)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(share.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Share Prices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Share Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Share Symbol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sharePrices.map((share) => (
                  <tr key={share.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-sm font-semibold rounded-full bg-primary-100 text-primary-800">
                        {share.share_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(share.current_price, 'INR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatDate(share.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(share)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(share.id)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Share Price' : 'Add Share Price'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Share Symbol
                </label>
                <Input
                  type="text"
                  value={formData.share_name}
                  onChange={(e) => setFormData({ ...formData, share_name: e.target.value })}
                  disabled={isEditMode}
                  required
                  placeholder="e.g., AAPL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Price ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.current_price}
                  onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                  required
                  placeholder="0.00"
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

export default AdminSharePrices;
