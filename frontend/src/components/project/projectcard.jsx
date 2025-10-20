import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiStar,
  FiUsers,
  FiCalendar,
  FiTrendingUp,
  FiArchive,
  FiExternalLink,
  FiClock
} from 'react-icons/fi';
import { useProjectContext } from '../../contexts/projectcontext';

const ProjectCard = ({ project, onEdit, onDelete, onDuplicate }) => {
  const navigate = useNavigate();
  const { toggleFavorite, updateProjectStatus } = useProjectContext();
  const [showMenu, setShowMenu] = useState(false);

  const handleCardClick = () => {
    navigate(`/projects/${project._id}`);
  };

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    try {
      await toggleFavorite(project._id);
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onEdit) {
      onEdit(project);
    } else {
      navigate(`/projects/${project._id}/edit`);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) onDelete(project);
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDuplicate) onDuplicate(project);
  };

  const handleArchive = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    try {
      await updateProjectStatus(project._id, 'archived');
    } catch (error) {
      console.error('Archive error:', error);
    }
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    navigate(`/projects/${project._id}`);
  };

  // Get stage badge color
  const getStageBadgeColor = (stage) => {
    const colors = {
      idea: 'bg-purple-100 text-purple-700 border-purple-200',
      validation: 'bg-blue-100 text-blue-700 border-blue-200',
      mvp: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      growth: 'bg-green-100 text-green-700 border-green-200',
      scale: 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[stage] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700 border-green-200',
      paused: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      completed: 'bg-blue-100 text-blue-700 border-blue-200',
      archived: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Get gradient color for header
  const getGradientColor = (stage) => {
    const gradients = {
      idea: 'from-purple-500 via-pink-500 to-red-500',
      validation: 'from-blue-500 via-cyan-500 to-teal-500',
      mvp: 'from-yellow-500 via-orange-500 to-red-500',
      growth: 'from-green-500 via-teal-500 to-blue-500',
      scale: 'from-pink-500 via-purple-500 to-indigo-500'
    };
    return gradients[stage] || 'from-gray-500 via-gray-600 to-gray-700';
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Calculate days since last activity
  const daysSinceActivity = project.lastActivityAt
    ? Math.floor((new Date() - new Date(project.lastActivityAt)) / (1000 * 60 * 60 * 24))
    : project.projectAge || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="relative h-full"
    >
      <div
        onClick={handleCardClick}
        className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col group border border-gray-100"
      >
        {/* Header with Gradient Background */}
        <div
          className={`relative h-40 bg-gradient-to-br ${getGradientColor(
            project.stage
          )} overflow-hidden`}
        >
          {/* Cover Image or Logo */}
          {project.coverImage ? (
            <img
              src={project.coverImage}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <div className="absolute top-0 left-0 w-full h-full">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Logo/Emoji */}
              <span className="text-6xl relative z-10 drop-shadow-lg">
                {project.logo || '🚀'}
              </span>
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-4 right-4 p-2.5 bg-white/95 backdrop-blur-sm rounded-xl hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg z-10"
          >
            <FiStar
              className={`h-5 w-5 transition-all duration-200 ${
                project.isFavorite
                  ? 'fill-yellow-400 text-yellow-400 scale-110'
                  : 'text-gray-600'
              }`}
            />
          </button>

          {/* Progress Bar at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20 backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.completionPercentage || 0}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 shadow-lg"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStageBadgeColor(
                project.stage
              )}`}
            >
              {project.stage?.charAt(0).toUpperCase() + project.stage?.slice(1)}
            </span>
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusBadgeColor(
                project.status
              )}`}
            >
              {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors duration-200">
            {project.name}
          </h3>

          {/* Tagline */}
          {project.tagline && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 font-medium">
              {project.tagline}
            </p>
          )}

          {/* Description */}
          {project.description && (
            <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
              {project.description}
            </p>
          )}

          {/* Industry Tag */}
          {project.industry && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">
                {project.industry}
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-y border-gray-100">
            {/* Team Size */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FiUsers className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-0.5">Team</p>
              <p className="text-base font-bold text-gray-900">
                {project.teamSize || project.team?.length || 0}
              </p>
            </div>

            {/* Completion */}
            <div className="text-center border-x border-gray-100">
              <div className="flex items-center justify-center mb-1">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FiTrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-0.5">Progress</p>
              <p className="text-base font-bold text-gray-900">
                {project.completionPercentage || 0}%
              </p>
            </div>

            {/* Last Activity */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiClock className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-0.5">Activity</p>
              <p className="text-base font-bold text-gray-900">
                {daysSinceActivity}d
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <FiCalendar className="h-3.5 w-3.5" />
              <span>{formatDate(project.createdAt)}</span>
            </div>

            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={handleMenuClick}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
              >
                <FiMoreVertical className="h-5 w-5 text-gray-600" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />

                  {/* Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-30 overflow-hidden"
                  >
                    <button
                      onClick={handleViewDetails}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 flex items-center gap-3 transition-all duration-200 group"
                    >
                      <FiExternalLink className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                      <span className="group-hover:text-purple-600 font-medium">View Details</span>
                    </button>

                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 flex items-center gap-3 transition-all duration-200 group"
                    >
                      <FiEdit2 className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <span className="group-hover:text-blue-600 font-medium">Edit Project</span>
                    </button>

                    <button
                      onClick={handleDuplicate}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 flex items-center gap-3 transition-all duration-200 group"
                    >
                      <FiCopy className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                      <span className="group-hover:text-green-600 font-medium">Duplicate</span>
                    </button>

                    <button
                      onClick={handleArchive}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 flex items-center gap-3 transition-all duration-200 group"
                    >
                      <FiArchive className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                      <span className="group-hover:text-orange-600 font-medium">Archive</span>
                    </button>

                    <div className="border-t border-gray-200 my-2" />

                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 flex items-center gap-3 transition-all duration-200 group"
                    >
                      <FiTrash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Delete Project</span>
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-300 rounded-2xl transition-all duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
};

export default ProjectCard;