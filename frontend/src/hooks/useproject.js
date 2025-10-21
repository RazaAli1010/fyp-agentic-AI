import { useState, useCallback } from 'react';
import projectAPI from '@services/project.api';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for project operations
 * Can be used independently or alongside ProjectContext
 */
const useProject = (projectId = null) => {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch project
  const fetchProject = useCallback(async (id = projectId) => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await projectAPI.getProjectById(id);
      setProject(response.data.project);
      return response.data.project;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch project';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Update project
  const updateProject = useCallback(async (updates, id = projectId) => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await projectAPI.updateProject(id, updates);
      setProject(response.data.project);
      toast.success('Project updated successfully');
      return response.data.project;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update project';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Add team member
  const addTeamMember = useCallback(async (memberData, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.addTeamMember(id, memberData);
      setProject(response.data.project);
      toast.success('Team member added successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to add team member');
      throw err;
    }
  }, [projectId]);

  // Update team member
  const updateTeamMember = useCallback(async (memberId, updates, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.updateTeamMember(id, memberId, updates);
      setProject(response.data.project);
      toast.success('Team member updated successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to update team member');
      throw err;
    }
  }, [projectId]);

  // Remove team member
  const removeTeamMember = useCallback(async (memberId, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.removeTeamMember(id, memberId);
      setProject(response.data.project);
      toast.success('Team member removed successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to remove team member');
      throw err;
    }
  }, [projectId]);

  // Add user persona
  const addUserPersona = useCallback(async (personaData, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.addUserPersona(id, personaData);
      setProject(response.data.project);
      toast.success('User persona added successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to add user persona');
      throw err;
    }
  }, [projectId]);

  // Update user persona
  const updateUserPersona = useCallback(async (personaId, updates, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.updateUserPersona(id, personaId, updates);
      setProject(response.data.project);
      toast.success('User persona updated successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to update user persona');
      throw err;
    }
  }, [projectId]);

  // Delete user persona
  const deleteUserPersona = useCallback(async (personaId, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.deleteUserPersona(id, personaId);
      setProject(response.data.project);
      toast.success('User persona deleted successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to delete user persona');
      throw err;
    }
  }, [projectId]);

  // Update market research
  const updateMarketResearch = useCallback(async (data, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.updateMarketResearch(id, data);
      setProject(response.data.project);
      toast.success('Market research updated successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to update market research');
      throw err;
    }
  }, [projectId]);

  // Update business model
  const updateBusinessModel = useCallback(async (data, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.updateBusinessModel(id, data);
      setProject(response.data.project);
      toast.success('Business model updated successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to update business model');
      throw err;
    }
  }, [projectId]);

  // Update traction
  const updateTraction = useCallback(async (data, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.updateTraction(id, data);
      setProject(response.data.project);
      toast.success('Traction data updated successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to update traction');
      throw err;
    }
  }, [projectId]);

  // Update funding
  const updateFunding = useCallback(async (data, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.updateFunding(id, data);
      setProject(response.data.project);
      toast.success('Funding information updated successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to update funding');
      throw err;
    }
  }, [projectId]);

  // Add roadmap phase
  const addRoadmapPhase = useCallback(async (phaseData, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.addRoadmapPhase(id, phaseData);
      setProject(response.data.project);
      toast.success('Roadmap phase added successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to add roadmap phase');
      throw err;
    }
  }, [projectId]);

  // Update roadmap phase
  const updateRoadmapPhase = useCallback(async (phaseId, updates, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.updateRoadmapPhase(id, phaseId, updates);
      setProject(response.data.project);
      toast.success('Roadmap phase updated successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to update roadmap phase');
      throw err;
    }
  }, [projectId]);

  // Delete roadmap phase
  const deleteRoadmapPhase = useCallback(async (phaseId, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.deleteRoadmapPhase(id, phaseId);
      setProject(response.data.project);
      toast.success('Roadmap phase deleted successfully');
      return response.data.project;
    } catch (err) {
      toast.error('Failed to delete roadmap phase');
      throw err;
    }
  }, [projectId]);

  // Get version history
  const getVersionHistory = useCallback(async (limit = 20, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.getVersionHistory(id, limit);
      return response.data.versions;
    } catch (err) {
      toast.error('Failed to fetch version history');
      throw err;
    }
  }, [projectId]);

  // Restore version
  const restoreVersion = useCallback(async (version, id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.restoreVersion(id, version);
      setProject(response.data.project);
      toast.success(`Project restored to version ${version}`);
      return response.data.project;
    } catch (err) {
      toast.error('Failed to restore version');
      throw err;
    }
  }, [projectId]);

  // Export project
  const exportProject = useCallback(async (format = 'json', id = projectId) => {
    if (!id) return;

    try {
      const response = await projectAPI.exportProject(id, format);
      toast.success('Project exported successfully');
      return response.data;
    } catch (err) {
      toast.error('Failed to export project');
      throw err;
    }
  }, [projectId]);

  return {
    project,
    isLoading,
    error,
    fetchProject,
    updateProject,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    addUserPersona,
    updateUserPersona,
    deleteUserPersona,
    updateMarketResearch,
    updateBusinessModel,
    updateTraction,
    updateFunding,
    addRoadmapPhase,
    updateRoadmapPhase,
    deleteRoadmapPhase,
    getVersionHistory,
    restoreVersion,
    exportProject,
    setProject
  };
};

export default useProject;
export { useProject };