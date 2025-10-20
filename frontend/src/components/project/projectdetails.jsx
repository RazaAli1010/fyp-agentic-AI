import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiStar,
  FiUsers,
  FiTrendingUp,
  FiCalendar,
  FiMoreVertical,
  FiDownload,
  FiClock,
  FiTarget,
  FiDollarSign,
  FiBarChart2,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import Button from '../common/Button';
import Card from '../common/Card';
import Loader from '../common/Loader';
import Modal from '../common/Modal';
import { useProject } from '../../hooks/useproject';
import { useProjectContext } from '../../contexts/projectcontext';
import { toast } from 'react-hot-toast';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, deleteProject, updateProject } = useProjectContext();
  const {
    project,
    isLoading,
    fetchProject,
    exportProject
  } = useProject(projectId);

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiFileText },
    { id: 'team', label: 'Team', icon: FiUsers },
    { id: 'market', label: 'Market Research', icon: FiTarget },
    { id: 'business', label: 'Business Model', icon: FiDollarSign },
    { id: 'traction', label: 'Traction', icon: FiTrendingUp },
    { id: 'roadmap', label: 'Roadmap', icon: FiCalendar }
  ];

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(projectId);
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(projectId);
      navigate('/projects');
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleExport = async (format) => {
    try {
      const data = await exportProject(format, projectId);
      
      // Create and download file
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(data.data, null, 2) : data.data],
        { type: format === 'json' ? 'application/json' : 'text/markdown' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Project exported successfully');
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStageBadgeColor = (stage) => {
    const colors = {
      idea: 'bg-purple-100 text-purple-700',
      validation: 'bg-blue-100 text-blue-700',
      mvp: 'bg-yellow-100 text-yellow-700',
      growth: 'bg-green-100 text-green-700',
      scale: 'bg-pink-100 text-pink-700'
    };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
      archived: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Information */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Project Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Industry</p>
            <p className="font-semibold text-gray-900">{project.industry || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Target Market</p>
            <p className="font-semibold text-gray-900">
              {project.targetMarket?.primary || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Created</p>
            <p className="font-semibold text-gray-900">{formatDate(project.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Last Updated</p>
            <p className="font-semibold text-gray-900">{formatDate(project.lastActivityAt)}</p>
          </div>
        </div>
      </Card>

      {/* Problem Statement */}
      {project.problemStatement && (
        <Card className="bg-gradient-to-br from-red-50 to-orange-50">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Problem Statement</h3>
              <p className="text-gray-700">{project.problemStatement}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Solution */}
      {project.solution && (
        <Card className="bg-gradient-to-br from-green-50 to-teal-50">
          <div className="flex items-start gap-3">
            <FiCheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Solution</h3>
              <p className="text-gray-700">{project.solution}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Unique Value Proposition */}
      {project.uniqueValueProposition && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="flex items-start gap-3">
            <FiTarget className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Unique Value Proposition</h3>
              <p className="text-gray-700">{project.uniqueValueProposition}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Project Completion */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Project Completion</h3>
          <span className="text-2xl font-bold text-purple-600">
            {project.completionPercentage || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.completionPercentage || 0}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Keep adding information to increase your project completion score
        </p>
      </Card>
    </div>
  );

  const renderTeamTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
        <Button variant="primary" size="sm" icon={FiUsers}>
          Add Member
        </Button>
      </div>

      {project.team && project.team.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.team.map((member) => (
            <Card key={member._id} hover>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-lg">
                    {member.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{member.name}</h4>
                  <p className="text-sm text-gray-600 truncate">{member.role}</p>
                  {member.email && (
                    <p className="text-xs text-gray-500 truncate mt-1">{member.email}</p>
                  )}
                  {member.isFounder && (
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg mt-2">
                      Founder
                    </span>
                  )}
                </div>
              </div>
              {member.expertise && member.expertise.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Expertise:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.expertise.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <FiUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h4>
          <p className="text-gray-600 mb-4">Add your team members to get started</p>
          <Button variant="primary" icon={FiUsers}>
            Add First Member
          </Button>
        </Card>
      )}
    </div>
  );

  const renderMarketTab = () => (
    <div className="space-y-6">
      {/* TAM, SAM, SOM */}
      {project.marketResearch && (
        <>
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Market Size</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {project.marketResearch.tam && (
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">TAM (Total Available Market)</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${(project.marketResearch.tam.value / 1000000).toFixed(1)}M
                  </p>
                  {project.marketResearch.tam.description && (
                    <p className="text-xs text-gray-600 mt-2">
                      {project.marketResearch.tam.description}
                    </p>
                  )}
                </div>
              )}
              {project.marketResearch.sam && (
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">SAM (Serviceable Available Market)</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${(project.marketResearch.sam.value / 1000000).toFixed(1)}M
                  </p>
                  {project.marketResearch.sam.description && (
                    <p className="text-xs text-gray-600 mt-2">
                      {project.marketResearch.sam.description}
                    </p>
                  )}
                </div>
              )}
              {project.marketResearch.som && (
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">SOM (Serviceable Obtainable Market)</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(project.marketResearch.som.value / 1000000).toFixed(1)}M
                  </p>
                  {project.marketResearch.som.description && (
                    <p className="text-xs text-gray-600 mt-2">
                      {project.marketResearch.som.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Competitors */}
          {project.marketResearch.competitors && project.marketResearch.competitors.length > 0 && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Competitors</h3>
              <div className="space-y-4">
                {project.marketResearch.competitors.map((competitor, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{competitor.name}</h4>
                      {competitor.marketShare && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg">
                          {competitor.marketShare}% market share
                        </span>
                      )}
                    </div>
                    {competitor.description && (
                      <p className="text-sm text-gray-600 mb-3">{competitor.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {competitor.strengths && competitor.strengths.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Strengths:</p>
                          <ul className="space-y-1">
                            {competitor.strengths.map((strength, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <FiCheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Weaknesses:</p>
                          <ul className="space-y-1">
                            {competitor.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <FiAlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {!project.marketResearch && (
        <Card className="text-center py-12">
          <FiTarget className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No market research yet</h4>
          <p className="text-gray-600 mb-4">Add market research data to validate your idea</p>
          <Button variant="primary" icon={FiTarget}>
            Add Market Research
          </Button>
        </Card>
      )}
    </div>
  );

  const renderBusinessTab = () => (
    <div className="space-y-6">
      {project.businessModel ? (
        <>
          {/* Revenue Streams */}
          {project.businessModel.revenueStreams && project.businessModel.revenueStreams.length > 0 && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Streams</h3>
              <div className="space-y-3">
                {project.businessModel.revenueStreams.map((stream, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{stream.name}</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg capitalize">
                        {stream.type}
                      </span>
                    </div>
                    {stream.description && (
                      <p className="text-sm text-gray-600 mb-2">{stream.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      {stream.pricing && (
                        <span className="text-gray-700">
                          <strong>Price:</strong> ${stream.pricing}
                        </span>
                      )}
                      {stream.projectedRevenue && (
                        <span className="text-gray-700">
                          <strong>Projected:</strong> ${stream.projectedRevenue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Pricing Strategy */}
          {project.businessModel.pricingStrategy && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing Strategy</h3>
              <div className="mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg capitalize">
                  {project.businessModel.pricingStrategy.model}
                </span>
              </div>
              {project.businessModel.pricingStrategy.tiers &&
                project.businessModel.pricingStrategy.tiers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {project.businessModel.pricingStrategy.tiers.map((tier, index) => (
                      <div
                        key={index}
                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-colors duration-200"
                      >
                        <h4 className="font-semibold text-gray-900 mb-2">{tier.name}</h4>
                        <p className="text-3xl font-bold text-purple-600 mb-3">
                          ${tier.price}
                          <span className="text-sm text-gray-600 font-normal">/mo</span>
                        </p>
                        {tier.features && tier.features.length > 0 && (
                          <ul className="space-y-2">
                            {tier.features.map((feature, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <FiCheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </Card>
          )}
        </>
      ) : (
        <Card className="text-center py-12">
          <FiDollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No business model yet</h4>
          <p className="text-gray-600 mb-4">Define your revenue streams and pricing strategy</p>
          <Button variant="primary" icon={FiDollarSign}>
            Add Business Model
          </Button>
        </Card>
      )}
    </div>
  );

  const renderTractionTab = () => (
    <div className="space-y-6">
      {project.traction ? (
        <>
          {/* User Metrics */}
          {project.traction.users && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-4">User Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {project.traction.users.total?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {project.traction.users.active?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Growth Rate</p>
                  <p className="text-3xl font-bold text-green-600">
                    {project.traction.users.growth || 0}%
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Revenue Metrics */}
          {project.traction.revenue && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">MRR</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${project.traction.revenue.mrr?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">ARR</p>
                  <p className="text-3xl font-bold text-teal-600">
                    ${project.traction.revenue.arr?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Growth</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {project.traction.revenue.growth || 0}%
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Milestones */}
          {project.traction.milestones && project.traction.milestones.length > 0 && (
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Milestones</h3>
              <div className="space-y-3">
                {project.traction.milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${
                      milestone.achieved
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {milestone.achieved ? (
                            <FiCheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <FiClock className="h-5 w-5 text-gray-400" />
                          )}
                          <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 ml-7">{milestone.description}</p>
                        )}
                      </div>
                      {milestone.date && (
                        <span className="text-xs text-gray-500 ml-4">
                          {formatDate(milestone.date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="text-center py-12">
          <FiTrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No traction data yet</h4>
          <p className="text-gray-600 mb-4">Track your progress with key metrics and milestones</p>
          <Button variant="primary" icon={FiTrendingUp}>
            Add Traction Data
          </Button>
        </Card>
      )}
    </div>
  );

  const renderRoadmapTab = () => (
    <div className="space-y-6">
      {project.roadmap && project.roadmap.length > 0 ? (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Roadmap Items */}
          <div className="space-y-6">
            {project.roadmap.map((phase, index) => (
              <motion.div
                key={phase._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-20"
              >
                {/* Timeline Dot */}
                <div
                  className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white ${
                    phase.status === 'completed'
                      ? 'bg-green-500'
                      : phase.status === 'in-progress'
                      ? 'bg-blue-500'
                      : phase.status === 'delayed'
                      ? 'bg-red-500'
                      : 'bg-gray-300'
                  }`}
                />

                <Card className={
                  phase.status === 'in-progress'
                    ? 'border-2 border-blue-300 bg-blue-50'
                    : ''
                }>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {phase.phase && (
                        <span className="text-xs text-gray-500 font-medium uppercase">
                          {phase.phase}
                        </span>
                      )}
                      <h4 className="font-bold text-gray-900 mt-1">{phase.title}</h4>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-lg capitalize ${
                        phase.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : phase.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : phase.status === 'delayed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {phase.status}
                    </span>
                  </div>

                  {phase.description && (
                    <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {phase.startDate && (
                      <span>Start: {formatDate(phase.startDate)}</span>
                    )}
                    {phase.endDate && (
                      <span>End: {formatDate(phase.endDate)}</span>
                    )}
                  </div>

                  {phase.milestones && phase.milestones.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Milestones:</p>
                      <ul className="space-y-2">
                        {phase.milestones.map((milestone, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            {milestone.completed ? (
                              <FiCheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <div className="h-4 w-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                            )}
                            <span
                              className={milestone.completed ? 'text-gray-500 line-through' : 'text-gray-700'}
                            >
                              {milestone.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="text-center py-12">
          <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No roadmap yet</h4>
          <p className="text-gray-600 mb-4">Create a roadmap to plan your project timeline</p>
          <Button variant="primary" icon={FiCalendar}>
            Add Roadmap
          </Button>
        </Card>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader size="lg" text="Loading project..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Project not found</p>
        <Button
          variant="primary"
          onClick={() => navigate('/projects')}
          className="mt-4"
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <Button
            variant="ghost"
            icon={FiArrowLeft}
            onClick={() => navigate('/projects')}
          >
            Back
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <button
                onClick={handleToggleFavorite}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <FiStar
                  className={`h-6 w-6 ${
                    project.isFavorite
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-400'
                  }`}
                />
              </button>
            </div>

            {project.tagline && (
              <p className="text-lg text-gray-600 mb-3">{project.tagline}</p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${getStageBadgeColor(
                  project.stage
                )}`}
              >
                {project.stage?.charAt(0).toUpperCase() + project.stage?.slice(1)}
              </span>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${getStatusBadgeColor(
                  project.status
                )}`}
              >
                {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
              </span>
              {project.industry && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  {project.industry}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <Button
            variant="outline"
            icon={FiMoreVertical}
            onClick={() => setShowMenu(!showMenu)}
          />

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate(`/projects/${projectId}/versions`);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <FiClock className="h-4 w-4" />
                  Version History
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleExport('json');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <FiDownload className="h-4 w-4" />
                  Export (JSON)
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleExport('markdown');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <FiDownload className="h-4 w-4" />
                  Export (Markdown)
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowEditModal(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <FiEdit2 className="h-4 w-4" />
                  Edit Project
                </button>
                <div className="border-t border-gray-200 my-2" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete Project
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Team Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.teamSize || project.team?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <FiUsers className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completion</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.completionPercentage || 0}%
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <FiBarChart2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Project Age</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.projectAge || 0} days
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FiCalendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Version</p>
              <p className="text-2xl font-bold text-gray-900">
                v{project.version || 1}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <FiClock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card padding="none">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'team' && renderTeamTab()}
              {activeTab === 'market' && renderMarketTab()}
              {activeTab === 'business' && renderBusinessTab()}
              {activeTab === 'traction' && renderTractionTab()}
              {activeTab === 'roadmap' && renderRoadmapTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
        footer={
          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Project
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete "{project.name}"? This action cannot be undone and
          all project data will be permanently deleted.
        </p>
      </Modal>
    </div>
  );
};

export default ProjectDetails;