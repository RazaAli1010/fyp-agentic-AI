import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiClock,
  FiUser,
  FiRotateCcw,
  FiGitBranch,
  FiCheck,
  FiX,
  FiEye
} from 'react-icons/fi';
import Button from '@components/common/Button';
import Card from '@components/common/Card';
import Loader from '@components/common/Loader';
import Modal from '@components/common/Modal';
import { useProject } from '@hooks/useproject';
import { toast } from 'react-hot-toast';

const VersionHistory = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getVersionHistory, restoreVersion, fetchProject } = useProject(projectId);

  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadVersionHistory();
  }, [projectId]);

  const loadVersionHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getVersionHistory(50, projectId);
      setVersions(data || []);
    } catch (error) {
      console.error('Failed to load version history:', error);
      toast.error('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreClick = (version) => {
    setSelectedVersion(version);
    setShowRestoreModal(true);
  };

  const handleRestoreConfirm = async () => {
    if (!selectedVersion) return;

    setIsRestoring(true);
    try {
      await restoreVersion(selectedVersion.version, projectId);
      toast.success(`Project restored to version ${selectedVersion.version}`);
      setShowRestoreModal(false);
      setSelectedVersion(null);
      
      // Refresh version history
      await loadVersionHistory();
      
      // Navigate back to project details
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeTypeColor = (type) => {
    const colors = {
      major: 'bg-red-100 text-red-700',
      minor: 'bg-yellow-100 text-yellow-700',
      patch: 'bg-blue-100 text-blue-700',
      manual: 'bg-purple-100 text-purple-700',
      automatic: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader size="lg" text="Loading version history..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          icon={FiArrowLeft}
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          Back to Project
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Version History</h1>
          <p className="text-gray-600 mt-1">
            View and restore previous versions of your project
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-start gap-3">
          <FiGitBranch className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">About Version History</h3>
            <p className="text-sm text-gray-700">
              Version history automatically tracks changes to your project. You can restore any
              previous version at any time. When you restore a version, the current state is
              saved as a backup.
            </p>
          </div>
        </div>
      </Card>

      {/* Version List */}
      {versions.length === 0 ? (
        <Card className="text-center py-12">
          <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No version history</h3>
          <p className="text-gray-600">
            Version history will appear here as you make changes to your project
          </p>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 via-blue-400 to-pink-400" />

          {/* Version Items */}
          <div className="space-y-6">
            {versions.map((version, index) => (
              <motion.div
                key={version._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-20"
              >
                {/* Timeline Dot */}
                <div className="absolute left-6 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border-4 border-white shadow-lg" />

                <Card hover className="group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Version Number */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-gray-900">
                          Version {version.version}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-lg ${getChangeTypeColor(
                            version.changeType
                          )}`}
                        >
                          {version.changeType}
                        </span>
                        {version.isAutomatic && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                            Auto-saved
                          </span>
                        )}
                        {index === 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                            <FiCheck className="h-3 w-3" />
                            Current
                          </span>
                        )}
                      </div>

                      {/* Change Log */}
                      {version.changeLog && (
                        <p className="text-gray-700 mb-3">{version.changeLog}</p>
                      )}

                      {/* Version Name */}
                      {version.versionName && (
                        <p className="text-sm text-gray-600 mb-3">
                          <strong>Name:</strong> {version.versionName}
                        </p>
                      )}

                      {/* Changed Fields */}
                      {version.changedFields && version.changedFields.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">
                            Changed Fields:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {version.changedFields.slice(0, 5).map((field, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg"
                              >
                                {field.field}
                              </span>
                            ))}
                            {version.changedFields.length > 5 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                                +{version.changedFields.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Restored From */}
                      {version.restoredFrom && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <FiRotateCcw className="h-4 w-4" />
                          <span>Restored from a previous version</span>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiUser className="h-4 w-4" />
                          <span>{version.userId?.name || version.userId?.username || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="h-4 w-4" />
                          <span>{formatDate(version.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {index !== 0 && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={FiEye}
                          onClick={() => {
                            navigate(`/projects/${projectId}/versions/${version.version}`);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={FiRotateCcw}
                          onClick={() => handleRestoreClick(version)}
                        >
                          Restore
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => !isRestoring && setShowRestoreModal(false)}
        title="Restore Version"
        footer={
          <div className="flex items-center justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowRestoreModal(false)}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={FiRotateCcw}
              onClick={handleRestoreConfirm}
              loading={isRestoring}
              disabled={isRestoring}
            >
              Restore Version
            </Button>
          </div>
        }
      >
        {selectedVersion && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to restore your project to{' '}
              <strong>Version {selectedVersion.version}</strong>?
            </p>

            <Card className="bg-blue-50">
              <div className="flex items-start gap-3">
                <FiGitBranch className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    What happens when you restore?
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your current project state will be saved as a backup</li>
                    <li>• The project will be reverted to Version {selectedVersion.version}</li>
                    <li>• You can always restore to another version later</li>
                  </ul>
                </div>
              </div>
            </Card>

            {selectedVersion.changeLog && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Version Details:</p>
                <p className="text-sm text-gray-600">{selectedVersion.changeLog}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VersionHistory;