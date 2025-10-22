import { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import projectAPI from '@services/project.api';
import { toast } from 'react-hot-toast';

const ProjectContext = createContext();

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: null,
    stage: null,
    search: '',
    sortBy: 'lastActivityAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalProjects: 0,
    hasMore: false
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters.status,
    filters.stage,
    filters.search,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
    filters.limit
  ]);

  // Fetch all projects
  const fetchProjects = useCallback(async (customFilters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = { ...memoizedFilters, ...customFilters };
      const response = await projectAPI.getProjects(params);

      setProjects(response.data.projects);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [memoizedFilters]);

  // Fetch single project
  const fetchProjectById = useCallback(async (projectId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectAPI.getProjectById(projectId);
      setCurrentProject(response.data.project);
      return response.data.project;
    } catch (err) {
      console.error('Fetch project error:', err);
      setError(err.response?.data?.message || 'Failed to fetch project');
      toast.error('Failed to load project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch project statistics
  const fetchProjectStats = useCallback(async () => {
    try {
      const response = await projectAPI.getProjectStats();
      setProjectStats(response.data.stats);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  }, []);

  // Create project
  const createProject = useCallback(async (projectData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectAPI.createProject(projectData);
      
      setProjects(prev => [response.data.project, ...prev]);
      toast.success('Project created successfully! 🎉');
      
      return response.data.project;
    } catch (err) {
      console.error('Create project error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create project';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update project
  const updateProject = useCallback(async (projectId, updates) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectAPI.updateProject(projectId, updates);
      
      setProjects(prev =>
        prev.map(p => (p._id === projectId ? response.data.project : p))
      );
      
      if (currentProject?._id === projectId) {
        setCurrentProject(response.data.project);
      }
      
      toast.success('Project updated successfully');
      return response.data.project;
    } catch (err) {
      console.error('Update project error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update project';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  // Delete project
  const deleteProject = useCallback(async (projectId) => {
    setIsLoading(true);
    setError(null);

    try {
      await projectAPI.deleteProject(projectId);
      
      setProjects(prev => prev.filter(p => p._id !== projectId));
      
      if (currentProject?._id === projectId) {
        setCurrentProject(null);
      }
      
      toast.success('Project deleted successfully');
    } catch (err) {
      console.error('Delete project error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete project';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  // Duplicate project
  const duplicateProject = useCallback(async (projectId, newName) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectAPI.duplicateProject(projectId, newName);
      
      setProjects(prev => [response.data.project, ...prev]);
      toast.success('Project duplicated successfully');
      
      return response.data.project;
    } catch (err) {
      console.error('Duplicate project error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to duplicate project';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update project status
  const updateProjectStatus = useCallback(async (projectId, status) => {
    try {
      const response = await projectAPI.updateProjectStatus(projectId, status);
      
      setProjects(prev =>
        prev.map(p => (p._id === projectId ? response.data.project : p))
      );
      
      if (currentProject?._id === projectId) {
        setCurrentProject(response.data.project);
      }
      
      toast.success(`Project status updated to ${status}`);
      return response.data.project;
    } catch (err) {
      console.error('Update status error:', err);
      toast.error('Failed to update project status');
      throw err;
    }
  }, [currentProject]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (projectId) => {
    try {
      const response = await projectAPI.toggleFavorite(projectId);
      
      setProjects(prev =>
        prev.map(p =>
          p._id === projectId ? { ...p, isFavorite: response.data.isFavorite } : p
        )
      );
      
      if (currentProject?._id === projectId) {
        setCurrentProject(prev => ({ ...prev, isFavorite: response.data.isFavorite }));
      }
      
      toast.success(
        response.data.isFavorite ? 'Added to favorites' : 'Removed from favorites'
      );
    } catch (err) {
      console.error('Toggle favorite error:', err);
      toast.error('Failed to update favorite status');
      throw err;
    }
  }, [currentProject]);

  // Search projects
  const searchProjects = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await projectAPI.searchProjects(query);
      return response.data.projects;
    } catch (err) {
      console.error('Search projects error:', err);
      toast.error('Search failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      status: null,
      stage: null,
      search: '',
      sortBy: 'lastActivityAt',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
  }, []);

  // Clear current project
  const clearCurrentProject = useCallback(() => {
    setCurrentProject(null);
  }, []);

  // Refresh projects (useful after operations)
  const refreshProjects = useCallback(() => {
    fetchProjects();
    fetchProjectStats();
  }, [fetchProjects, fetchProjectStats]);

  // Load initial data
  useEffect(() => {
    fetchProjects();
    fetchProjectStats();
  }, [filters.status, filters.stage, filters.sortBy, filters.sortOrder, filters.page]);

  const value = {
    // State
    projects,
    currentProject,
    projectStats,
    isLoading,
    error,
    filters,
    pagination,

    // Actions
    fetchProjects,
    fetchProjectById,
    fetchProjectStats,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    updateProjectStatus,
    toggleFavorite,
    searchProjects,
    updateFilters,
    resetFilters,
    clearCurrentProject,
    refreshProjects,
    setCurrentProject
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export default ProjectContext;