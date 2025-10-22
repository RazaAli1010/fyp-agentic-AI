import apiClient from './api.js';

const projectAPI = {
  // Get all projects
  getProjects: async (params = {}) => {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },

  // Get single project
  getProjectById: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  },

  // Create project
  createProject: async (projectData) => {
    const response = await apiClient.post('/projects', projectData);
    return response.data;
  },

  // Update project
  updateProject: async (projectId, updates) => {
    const response = await apiClient.put(`/projects/${projectId}`, updates);
    return response.data;
  },

  // Delete project
  deleteProject: async (projectId) => {
    const response = await apiClient.delete(`/projects/${projectId}`);
    return response.data;
  },

  // Duplicate project
  duplicateProject: async (projectId, name) => {
    const response = await apiClient.post(`/projects/${projectId}/duplicate`, { name });
    return response.data;
  },

  // Update project status
  updateProjectStatus: async (projectId, status) => {
    const response = await apiClient.patch(`/projects/${projectId}/status`, { status });
    return response.data;
  },

  // Toggle favorite
  toggleFavorite: async (projectId) => {
    const response = await apiClient.patch(`/projects/${projectId}/favorite`);
    return response.data;
  },

  // Get project statistics
  getProjectStats: async () => {
    const response = await apiClient.get('/projects/stats');
    return response.data;
  },

  // Search projects
  searchProjects: async (query) => {
    const response = await apiClient.get('/projects/search', { params: { query } });
    return response.data;
  },

  // Collaborator management
  addCollaborator: async (projectId, collaboratorId, role) => {
    const response = await apiClient.post(`/projects/${projectId}/collaborators`, {
      collaboratorId,
      role
    });
    return response.data;
  },

  removeCollaborator: async (projectId, userId) => {
    const response = await apiClient.delete(`/projects/${projectId}/collaborators/${userId}`);
    return response.data;
  },

  updateCollaboratorRole: async (projectId, userId, role) => {
    const response = await apiClient.patch(`/projects/${projectId}/collaborators/${userId}`, {
      role
    });
    return response.data;
  },

  // Team management
  addTeamMember: async (projectId, memberData) => {
    const response = await apiClient.post(`/projects/${projectId}/team`, memberData);
    return response.data;
  },

  updateTeamMember: async (projectId, memberId, updates) => {
    const response = await apiClient.put(`/projects/${projectId}/team/${memberId}`, updates);
    return response.data;
  },

  removeTeamMember: async (projectId, memberId) => {
    const response = await apiClient.delete(`/projects/${projectId}/team/${memberId}`);
    return response.data;
  },

  // User personas
  addUserPersona: async (projectId, personaData) => {
    const response = await apiClient.post(`/projects/${projectId}/personas`, personaData);
    return response.data;
  },

  updateUserPersona: async (projectId, personaId, updates) => {
    const response = await apiClient.put(`/projects/${projectId}/personas/${personaId}`, updates);
    return response.data;
  },

  deleteUserPersona: async (projectId, personaId) => {
    const response = await apiClient.delete(`/projects/${projectId}/personas/${personaId}`);
    return response.data;
  },

  // Market research
  updateMarketResearch: async (projectId, data) => {
    const response = await apiClient.put(`/projects/${projectId}/market-research`, data);
    return response.data;
  },

  // Business model
  updateBusinessModel: async (projectId, data) => {
    const response = await apiClient.put(`/projects/${projectId}/business-model`, data);
    return response.data;
  },

  // Traction
  updateTraction: async (projectId, data) => {
    const response = await apiClient.put(`/projects/${projectId}/traction`, data);
    return response.data;
  },

  // Funding
  updateFunding: async (projectId, data) => {
    const response = await apiClient.put(`/projects/${projectId}/funding`, data);
    return response.data;
  },

  // Roadmap
  addRoadmapPhase: async (projectId, phaseData) => {
    const response = await apiClient.post(`/projects/${projectId}/roadmap`, phaseData);
    return response.data;
  },

  updateRoadmapPhase: async (projectId, phaseId, updates) => {
    const response = await apiClient.put(`/projects/${projectId}/roadmap/${phaseId}`, updates);
    return response.data;
  },

  deleteRoadmapPhase: async (projectId, phaseId) => {
    const response = await apiClient.delete(`/projects/${projectId}/roadmap/${phaseId}`);
    return response.data;
  },

  // Version management
  getVersionHistory: async (projectId, limit = 20) => {
    const response = await apiClient.get(`/projects/${projectId}/versions`, {
      params: { limit }
    });
    return response.data;
  },

  getVersion: async (projectId, version) => {
    const response = await apiClient.get(`/projects/${projectId}/versions/${version}`);
    return response.data;
  },

  createVersion: async (projectId, changeLog) => {
    const response = await apiClient.post(`/projects/${projectId}/versions`, { changeLog });
    return response.data;
  },

  restoreVersion: async (projectId, version) => {
    const response = await apiClient.post(`/projects/${projectId}/versions/${version}/restore`);
    return response.data;
  },

  compareVersions: async (projectId, version1, version2) => {
    const response = await apiClient.get(`/projects/${projectId}/versions/compare`, {
      params: { version1, version2 }
    });
    return response.data;
  },

  // Export project
  exportProject: async (projectId, format = 'json') => {
    const response = await apiClient.post(`/projects/${projectId}/export`, { format });
    return response.data;
  }
};

export default projectAPI;