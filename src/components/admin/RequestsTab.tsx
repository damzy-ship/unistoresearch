import React from 'react';
import { Eye, Star, Edit, Trash2 } from 'lucide-react';
import { RequestLog } from '../../lib/supabase';
import { deleteRequestLog } from '../../lib/supabase';
import RequestView from './RequestView';
import RequestScoring from './RequestScoring';
import CustomDialog from './CustomDialog';
import CustomAlert from './CustomAlert';

interface RequestsTabProps {
  requests: RequestLog[];
  onRefresh: () => void;
}

export default function RequestsTab({ requests, onRefresh }: RequestsTabProps) {
  const [viewingRequest, setViewingRequest] = React.useState<RequestLog | null>(null);
  const [scoringRequest, setScoringRequest] = React.useState<RequestLog | null>(null);
  const [deletingRequest, setDeletingRequest] = React.useState<RequestLog | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDeleteRequest = async () => {
    if (!deletingRequest) return;
    
    setDeleting(true);
    try {
      const result = await deleteRequestLog(deletingRequest.id);
      
      if (result.success) {
        setDeletingRequest(null);
        onRefresh();
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Request Deleted',
          message: 'Request has been successfully deleted.'
        });
      } else {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Error Deleting Request',
          message: result.error || 'Failed to delete request'
        });
        setDeletingRequest(null);
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error Deleting Request',
        message: 'Error deleting request. Please try again.'
      });
      setDeletingRequest(null);
    } finally {
      setDeleting(false);
    }
  };
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Request Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  University
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matched Sellers
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin Score
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-900">
                    {request.user_id}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      request.university === 'Bingham' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {request.university}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                    {request.request_text}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (request.matched_seller_ids?.length || 0) > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {request.matched_seller_ids?.length || 0} seller{(request.matched_seller_ids?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                    {(request as any).admin_scores ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Scored
                      </span>
                    ) : (
                      <span className="text-gray-400">Not scored</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingRequest(request)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Request Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(request.matched_seller_ids?.length || 0) > 0 && (
                        <button
                          onClick={() => setScoringRequest(request)}
                          className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Score Request"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingRequest(request)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request View Modal */}
      {viewingRequest && (
        <RequestView
          request={viewingRequest}
          onClose={() => setViewingRequest(null)}
        />
      )}

      {/* Request Scoring Modal */}
      {scoringRequest && (
        <RequestScoring
          request={scoringRequest}
          onClose={() => setScoringRequest(null)}
          onSuccess={() => {
            setScoringRequest(null);
            onRefresh();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        isOpen={!!deletingRequest}
        onClose={() => setDeletingRequest(null)}
        onConfirm={handleDeleteRequest}
        title="Delete Request"
        message={`Are you sure you want to delete this request: "${deletingRequest?.request_text}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete Request"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />

      {/* Alert Dialog */}
      <CustomAlert
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </>
  );
}