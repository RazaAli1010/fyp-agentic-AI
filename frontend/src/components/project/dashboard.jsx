import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPlus,
  FiFolder,
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiStar,
  FiArrowRight,
  FiBarChart2
} from 'react-icons/fi';
import Button from '../common/Button';
import Card from '../common/Card';
import Loader from '../common/Loader';
import ProjectCard from './ProjectCard';
import { useProjectContext } from '../../contexts/projectcontext';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    projects,
    projectStats,
    isLoading,
    fetchProjects,
    fetchProjectStats
  } = useProjectContext();

  const [recentProjects, setRecentProjects] = useState([]);
  const [favoriteProjects, setFavoriteProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchProjectStats();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      // Get recent projects (last 6)
      setRecentProjects(projects.slice(0, 6));
      
      // Get favorite projects
      setFavoriteProjects(projects.filter(p => p.isFavorite).slice(0, 6));
    }
  }, [projects]);

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Projects',
      value: projectStats?.totalProjects || 0,
      icon: FiFolder,
      color: 'from-purple-500 to-blue-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Active Projects',
      value: projectStats?.activeProjects || 0,
      icon: FiTrendingUp,
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Team Members',
      value: projects.reduce((sum, p) => sum + (p.teamSize || 0), 0),
      icon: FiUsers,
      color: 'from-orange-500 to-pink-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Completed',
      value: projectStats?.completedProjects || 0,
      icon: FiClock,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    }
  ];

  // Stage distribution data
  const stageData = [
    { name: 'Idea', count: projectStats?.ideaStage || 0, color: 'bg-purple-500' },
    { name: 'Validation', count: projectStats?.validationStage || 0, color: 'bg-blue-500' },
    { name: 'MVP', count: projectStats?.mvpStage || 0, color: 'bg-yellow-500' },
    { name: 'Growth', count: projectStats?.growthStage || 0, color: 'bg-green-500' },
    { name: 'Scale', count: projectStats?.scaleStage || 0, color: 'bg-pink-500' }
  ];

  const maxStageCount = Math.max(...stageData.map(s => s.count), 1);

  if (isLoading && !projects.length) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || user?.username}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your projects today
          </p>
        </div>
        <Button
          variant="primary"
          icon={FiPlus}
          onClick={() => navigate('/projects/create')}
        >
          New Project
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card padding="md" className="hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Stage Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Project Stages</h2>
              <p className="text-sm text-gray-600 mt-1">
                Distribution of projects across different stages
              </p>
            </div>
            <FiBarChart2 className="h-6 w-6 text-gray-400" />
          </div>

          <div className="space-y-4">
            {stageData.map((stage, index) => (
              <motion.div
                key={stage.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{stage.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    className={`h-full ${stage.color} rounded-full`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
              <p className="text-gray-600 mt-1">Your most recently updated projects</p>
            </div>
            <Button
              variant="ghost"
              icon={FiArrowRight}
              iconPosition="right"
              onClick={() => navigate('/projects')}
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Favorite Projects */}
      {favoriteProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FiStar className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Favorite Projects</h2>
                <p className="text-gray-600 mt-1">Quick access to your starred projects</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProjects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="text-center py-16">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Start Your First Project
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first project to organize your startup ideas, track progress, and
              collaborate with your team.
            </p>
            <Button
              variant="primary"
              icon={FiPlus}
              size="lg"
              onClick={() => navigate('/projects/create')}
            >
              Create Your First Project
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/projects/create')}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl hover:from-purple-100 hover:to-blue-100 transition-all duration-200"
            >
              <div className="p-2 bg-white rounded-lg">
                <FiPlus className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">New Project</p>
                <p className="text-xs text-gray-600">Start a new venture</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl hover:from-green-100 hover:to-teal-100 transition-all duration-200"
            >
              <div className="p-2 bg-white rounded-lg">
                <FiFolder className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">All Projects</p>
                <p className="text-xs text-gray-600">View all your projects</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl hover:from-orange-100 hover:to-pink-100 transition-all duration-200"
            >
              <div className="p-2 bg-white rounded-lg">
                <FiTrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">AI Assistant</p>
                <p className="text-xs text-gray-600">Get strategic advice</p>
              </div>
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;