const Project = require('../models/project');
const ProjectVersion = require('../models/projectversion');
const User = require('../models/User');
const { ApiError } = require('../utils/helpers');

/**
 * Create new project
 */
const createProject = async (userId, projectData) => {
  try {
    const project = new Project({
      ...projectData,
      userId
    });

    await project.save();

    // Create initial version
    await ProjectVersion.createVersion(project, userId, 'Initial project creation', 'automatic');

    return project;
  } catch (error) {
    console.error('Create project error:', error);
    throw error;
  }
};

/**
 * Get user's projects with filters
 */
const getUserProjects = async (userId, options = {}) => {
  try {
    return await Project.getUserProjects(userId, options);
  } catch (error) {
    console.error('Get user projects error:', error);
    throw error;
  }
};

/**
 * Get project statistics
 */
const getProjectStatistics = async (userId) => {
  try {
    const stats = await Project.getProjectStats(userId);

    // Calculate additional metrics
    const projects = await Project.find({
      $or: [
        { userId },
        { 'collaborators.userId': userId }
      ]
    }).select('completionPercentage projectAge');

    const avgCompletion = projects.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / (projects.length || 1);
    const avgAge = projects.reduce((sum, p) => sum + (p.projectAge || 0), 0) / (projects.length || 1);

    return {
      ...stats,
      averageCompletion: Math.round(avgCompletion),
      averageProjectAge: Math.round(avgAge)
    };
  } catch (error) {
    console.error('Get project statistics error:', error);
    throw error;
  }
};

/**
 * Search projects
 */
const searchProjects = async (userId, searchTerm, limit = 20) => {
  try {
    return await Project.searchProjects(userId, searchTerm, limit);
  } catch (error) {
    console.error('Search projects error:', error);
    throw error;
  }
};

/**
 * Get project by ID
 */
const getProjectById = async (projectId, userId) => {
  try {
    const project = await Project.findById(projectId)
      .populate('collaborators.userId', 'name email username');

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    // Check if user has access
    if (!project.hasAccess(userId)) {
      throw new ApiError('You do not have permission to access this project', 403);
    }

    return project;
  } catch (error) {
    console.error('Get project by ID error:', error);
    throw error;
  }
};

/**
 * Update project
 */
const updateProject = async (projectId, userId, updates) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    // Check if user has edit permission
    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to edit this project', 403);
    }

    // Store old data for version tracking
    const oldData = project.toObject();

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        project[key] = updates[key];
      }
    });

    await project.save();

    // Create automatic version if significant changes
    const significantFields = ['name', 'description', 'stage', 'status', 'businessModel', 'marketResearch'];
    const hasSignificantChanges = Object.keys(updates).some(key => significantFields.includes(key));

    if (hasSignificantChanges) {
      await ProjectVersion.createVersion(project, userId, 'Project updated', 'automatic');
    }

    return project;
  } catch (error) {
    console.error('Update project error:', error);
    throw error;
  }
};

/**
 * Delete project
 */
const deleteProject = async (projectId, userId) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    // Only owner can delete
    if (project.userId.toString() !== userId.toString()) {
      throw new ApiError('Only project owner can delete the project', 403);
    }

    // Delete all versions
    await ProjectVersion.deleteMany({ projectId });

    // Delete project
    await project.deleteOne();

    return true;
  } catch (error) {
    console.error('Delete project error:', error);
    throw error;
  }
};

/**
 * Duplicate project
 */
const duplicateProject = async (projectId, userId, newName) => {
  try {
    const originalProject = await Project.findById(projectId);

    if (!originalProject) {
      throw new ApiError('Project not found', 404);
    }

    // Check if user has access
    if (!originalProject.hasAccess(userId)) {
      throw new ApiError('You do not have permission to duplicate this project', 403);
    }

    // Create duplicate
    const projectData = originalProject.toObject();
    delete projectData._id;
    delete projectData.createdAt;
    delete projectData.updatedAt;
    delete projectData.__v;
    delete projectData.version;

    projectData.name = newName || `${originalProject.name} (Copy)`;
    projectData.userId = userId;
    projectData.collaborators = [];

    const newProject = await createProject(userId, projectData);

    return newProject;
  } catch (error) {
    console.error('Duplicate project error:', error);
    throw error;
  }
};

/**
 * Update project status
 */
const updateProjectStatus = async (projectId, userId, status) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to update this project', 403);
    }

    project.status = status;
    await project.save();

    return project;
  } catch (error) {
    console.error('Update project status error:', error);
    throw error;
  }
};

/**
 * Toggle project favorite
 */
const toggleFavorite = async (projectId, userId) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (project.userId.toString() !== userId.toString()) {
      throw new ApiError('Only project owner can mark as favorite', 403);
    }

    project.isFavorite = !project.isFavorite;
    await project.save();

    return project;
  } catch (error) {
    console.error('Toggle favorite error:', error);
    throw error;
  }
};

/**
 * Add collaborator
 */
const addCollaborator = async (projectId, userId, collaboratorId, role) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    // Only owner can add collaborators
    if (project.userId.toString() !== userId.toString()) {
      throw new ApiError('Only project owner can add collaborators', 403);
    }

    // Check if collaborator exists
    const collaborator = await User.findById(collaboratorId);
    if (!collaborator) {
      throw new ApiError('User not found', 404);
    }

    await project.addCollaborator(collaboratorId, role);

    return project;
  } catch (error) {
    console.error('Add collaborator error:', error);
    throw error;
  }
};

/**
 * Remove collaborator
 */
const removeCollaborator = async (projectId, userId, collaboratorId) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    // Only owner can remove collaborators
    if (project.userId.toString() !== userId.toString()) {
      throw new ApiError('Only project owner can remove collaborators', 403);
    }

    await project.removeCollaborator(collaboratorId);

    return project;
  } catch (error) {
    console.error('Remove collaborator error:', error);
    throw error;
  }
};

/**
 * Update collaborator role
 */
const updateCollaboratorRole = async (projectId, userId, collaboratorId, newRole) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    // Only owner can update roles
    if (project.userId.toString() !== userId.toString()) {
      throw new ApiError('Only project owner can update collaborator roles', 403);
    }

    await project.updateCollaboratorRole(collaboratorId, newRole);

    return project;
  } catch (error) {
    console.error('Update collaborator role error:', error);
    throw error;
  }
};

/**
 * Add team member
 */
const addTeamMember = async (projectId, userId, memberData) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to add team members', 403);
    }

    project.team.push(memberData);
    await project.save();

    return project;
  } catch (error) {
    console.error('Add team member error:', error);
    throw error;
  }
};

/**
 * Update team member
 */
const updateTeamMember = async (projectId, userId, memberId, updates) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to update team members', 403);
    }

    const member = project.team.id(memberId);
    if (!member) {
      throw new ApiError('Team member not found', 404);
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        member[key] = updates[key];
      }
    });

    await project.save();

    return project;
  } catch (error) {
    console.error('Update team member error:', error);
    throw error;
  }
};

/**
 * Remove team member
 */
const removeTeamMember = async (projectId, userId, memberId) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to remove team members', 403);
    }

    project.team.pull(memberId);
    await project.save();

    return project;
  } catch (error) {
    console.error('Remove team member error:', error);
    throw error;
  }
};

/**
 * Add user persona
 */
const addUserPersona = async (projectId, userId, personaData) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to add user personas', 403);
    }

    project.userPersonas.push(personaData);
    await project.save();

    return project;
  } catch (error) {
    console.error('Add user persona error:', error);
    throw error;
  }
};

/**
 * Update user persona
 */
const updateUserPersona = async (projectId, userId, personaId, updates) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to update user personas', 403);
    }

    const persona = project.userPersonas.id(personaId);
    if (!persona) {
      throw new ApiError('User persona not found', 404);
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        persona[key] = updates[key];
      }
    });

    await project.save();

    return project;
  } catch (error) {
    console.error('Update user persona error:', error);
    throw error;
  }
};

/**
 * Delete user persona
 */
const deleteUserPersona = async (projectId, userId, personaId) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to delete user personas', 403);
    }

    project.userPersonas.pull(personaId);
    await project.save();

    return project;
  } catch (error) {
    console.error('Delete user persona error:', error);
    throw error;
  }
};

/**
 * Update market research
 */
const updateMarketResearch = async (projectId, userId, marketResearchData) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to update market research', 403);
    }

    project.marketResearch = {
      ...project.marketResearch,
      ...marketResearchData
    };

    await project.save();

    return project;
  } catch (error) {
    console.error('Update market research error:', error);
    throw error;
  }
};

/**
 * Update business model
 */
const updateBusinessModel = async (projectId, userId, businessModelData) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to update business model', 403);
    }

    project.businessModel = {
      ...project.businessModel,
      ...businessModelData
    };

    await project.save();

    return project;
  } catch (error) {
    console.error('Update business model error:', error);
    throw error;
  }
};

/**
 * Update traction
 */
const updateTraction = async (projectId, userId, tractionData) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to update traction', 403);
    }

    project.traction = {
      ...project.traction,
      ...tractionData
    };

    await project.save();

    return project;
  } catch (error) {
    console.error('Update traction error:', error);
    throw error;
  }
};

/**
 * Update funding
 */
const updateFunding = async (projectId, userId, fundingData) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to update funding', 403);
    }

    project.funding = {
      ...project.funding,
      ...fundingData
    };

    await project.save();

    return project;
  } catch (error) {
    console.error('Update funding error:', error);
    throw error;
  }
};

/**
 * Add roadmap phase
 */
const addRoadmapPhase = async (projectId, userId, phaseData) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to add roadmap phases', 403);
    }

    project.roadmap.push(phaseData);
    await project.save();

    return project;
  } catch (error) {
    console.error('Add roadmap phase error:', error);
    throw error;
  }
};

/**
 * Update roadmap phase
 */
const updateRoadmapPhase = async (projectId, userId, phaseId, updates) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to update roadmap phases', 403);
    }

    const phase = project.roadmap.id(phaseId);
    if (!phase) {
      throw new ApiError('Roadmap phase not found', 404);
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        phase[key] = updates[key];
      }
    });

    await project.save();

    return project;
  } catch (error) {
    console.error('Update roadmap phase error:', error);
    throw error;
  }
};

/**
 * Delete roadmap phase
 */
const deleteRoadmapPhase = async (projectId, userId, phaseId) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to delete roadmap phases', 403);
    }

    project.roadmap.pull(phaseId);
    await project.save();

    return project;
  } catch (error) {
    console.error('Delete roadmap phase error:', error);
    throw error;
  }
};

/**
 * Get version history
 */
const getVersionHistory = async (projectId, userId, limit = 20) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId)) {
      throw new ApiError('You do not have permission to view version history', 403);
    }

    return await ProjectVersion.getVersionHistory(projectId, limit);
  } catch (error) {
    console.error('Get version history error:', error);
    throw error;
  }
};

/**
 * Get specific version
 */
const getVersion = async (projectId, userId, version) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId)) {
      throw new ApiError('You do not have permission to view versions', 403);
    }

    const versionData = await ProjectVersion.getVersion(projectId, version);

    if (!versionData) {
      throw new ApiError('Version not found', 404);
    }

    return versionData;
  } catch (error) {
    console.error('Get version error:', error);
    throw error;
  }
};

/**
 * Create manual version
 */
const createManualVersion = async (projectId, userId, changeLog) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to create versions', 403);
    }

    return await ProjectVersion.createVersion(project, userId, changeLog, 'manual');
  } catch (error) {
    console.error('Create manual version error:', error);
    throw error;
  }
};

/**
 * Restore version
 */
const restoreVersion = async (projectId, userId, version) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId, 'editor')) {
      throw new ApiError('You do not have permission to restore versions', 403);
    }

    return await ProjectVersion.restoreVersion(projectId, version, userId);
  } catch (error) {
    console.error('Restore version error:', error);
    throw error;
  }
};

/**
 * Compare versions
 */
const compareVersions = async (projectId, userId, version1, version2) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess(userId)) {
      throw new ApiError('You do not have permission to compare versions', 403);
    }

    return await ProjectVersion.compareVersions(projectId, version1, version2);
  } catch (error) {
    console.error('Compare versions error:', error);
    throw error;
  }
};

/**
 * Export project
 */
const exportProject = async (projectId, userId, format = 'json') => {
  try {
    const project = await Project.findById(projectId)
      .populate('collaborators.userId', 'name email username')
      .lean();

    if (!project) {
      throw new ApiError('Project not found', 404);
    }

    if (!project.hasAccess || project.userId.toString() !== userId.toString()) {
      throw new ApiError('You do not have permission to export this project', 403);
    }

    switch (format.toLowerCase()) {
      case 'json':
        return {
          format: 'json',
          data: project,
          filename: `${project.name}-${Date.now()}.json`
        };

      case 'markdown':
        const markdown = generateMarkdownExport(project);
        return {
          format: 'markdown',
          data: markdown,
          filename: `${project.name}-${Date.now()}.md`
        };

      default:
        throw new ApiError('Invalid export format. Use json or markdown', 400);
    }
  } catch (error) {
    console.error('Export project error:', error);
    throw error;
  }
};

/**
 * Generate markdown export
 */
const generateMarkdownExport = (project) => {
  let markdown = `# ${project.name}\n\n`;
  
  if (project.tagline) {
    markdown += `**${project.tagline}**\n\n`;
  }

  if (project.description) {
    markdown += `## Description\n\n${project.description}\n\n`;
  }

  if (project.problemStatement) {
    markdown += `## Problem Statement\n\n${project.problemStatement}\n\n`;
  }

  if (project.solution) {
    markdown += `## Solution\n\n${project.solution}\n\n`;
  }

  markdown += `## Project Details\n\n`;
  markdown += `- **Industry:** ${project.industry || 'N/A'}\n`;
  markdown += `- **Stage:** ${project.stage || 'N/A'}\n`;
  markdown += `- **Status:** ${project.status || 'N/A'}\n`;
  markdown += `- **Created:** ${project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}\n\n`;

  if (project.team && project.team.length > 0) {
    markdown += `## Team\n\n`;
    project.team.forEach(member => {
      markdown += `### ${member.name}\n`;
      markdown += `- **Role:** ${member.role}\n`;
      if (member.bio) markdown += `- **Bio:** ${member.bio}\n`;
      markdown += `\n`;
    });
  }

  return markdown;
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectStatistics,
  searchProjects,
  getProjectById,
  updateProject,
  deleteProject,
  duplicateProject,
  updateProjectStatus,
  toggleFavorite,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
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
  getVersion,
  createManualVersion,
  restoreVersion,
  compareVersions,
  exportProject
};