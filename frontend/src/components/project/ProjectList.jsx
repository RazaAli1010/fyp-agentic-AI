import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiArrowLeft,
  FiStar,
} from 'react-icons/fi';
import Button from '@components/common/Button';
import Card from '@components/common/Card';
import Loader from '@components/common/Loader';
import ProjectCard from './ProjectCard';
import { useProjectContext } from '@contexts/projectcontext';

const ProjectList = () => {
  const navigate = useNavigate();
  const { projects, isLoading, fetchProjects } = useProjectContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'name', 'status'

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = project.name?.toLowerCase().includes(query);
        const matchesDescription = project.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      // Status filter
      if (filterStatus !== 'all' && project.status !== filterStatus) {
        return false;
      }

      // Stage filter
      if (filterStage !== 'all' && project.currentStage !== filterStage) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'recent':
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

  const favoriteProjects = filteredProjects.filter((p) => p.isFavorite);
  const regularProjects = filteredProjects.filter((p) => !p.isFavorite);

  if (isLoading && !projects.length) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader size="lg" text="Loading projects..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <FiArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Projects</h1>
            <p className="text-gray-600 mt-1">
              Manage and organize all your startup projects
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={FiPlus}
          onClick={() => navigate('/projects/create')}
        >
          New Project
        </Button>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            {/* Filter by Stage */}
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="all">All Stages</option>
              <option value="idea">Idea</option>
              <option value="validation">Validation</option>
              <option value="mvp">MVP</option>
              <option value="growth">Growth</option>
              <option value="scale">Scale</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border-2 border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FiGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FiList className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{filteredProjects.length}</span> of{' '}
          <span className="font-semibold">{projects.length}</span> projects
        </p>
      </div>

      {/* Favorite Projects */}
      {favoriteProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <FiStar className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900">Favorites</h2>
          </div>

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {favoriteProjects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Projects */}
      {regularProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: favoriteProjects.length > 0 ? 0.3 : 0.2 }}
        >
          {favoriteProjects.length > 0 && (
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Projects</h2>
          )}

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {regularProjects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay:
                    (favoriteProjects.length > 0 ? 0.4 : 0.3) + index * 0.05,
                }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery || filterStatus !== 'all' || filterStage !== 'all'
                ? 'No Projects Found'
                : 'No Projects Yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery || filterStatus !== 'all' || filterStage !== 'all'
                ? 'Try adjusting your filters or search query to find what you\'re looking for.'
                : 'Create your first project to get started with organizing your startup ideas.'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterStage === 'all' && (
              <Button
                variant="primary"
                icon={FiPlus}
                size="lg"
                onClick={() => navigate('/projects/create')}
              >
                Create Your First Project
              </Button>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ProjectList;
