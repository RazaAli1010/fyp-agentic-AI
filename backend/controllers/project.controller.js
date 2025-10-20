const projectService = require('../services/project.service');
const Project = require('../models/project');
const ProjectVersion = require('../models/projectversion');
const { ApiError } = require('../utils/helpers');

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const projectData = req.body;

    const project = await projectService.createProject(userId, projectData);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all user's projects
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const options = {
      status: req.query.status,
      stage: req.query.stage,
      search: req.query.search,
      sortBy: req.query.sortBy || 'lastActivityAt',
      sortOrder: req.query.sortOrder || 'desc',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await projectService.getUserProjects(userId, options);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get project statistics
 * @route   GET /api/projects/stats
 * @access  Private
 */
const getProjectStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const stats = await projectService.getProjectStatistics(userId);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search projects
 * @route   GET /api/projects/search
 * @access  Private
 */
const searchProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { query, limit = 20 } = req.query;

    if (!query || query.trim().length === 0) {
      throw new ApiError('Search query is required', 400);
    }

    const projects = await projectService.searchProjects(userId, query.trim(), parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        projects,
        count: projects.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:projectId
 * @access  Private
 */
const getProjectById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;

    const project = await projectService.getProjectById(projectId, userId);

    res.status(200).json({
      success: true,
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:projectId
 * @access  Private
 */
const updateProject = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const updates = req.body;

    const project = await projectService.updateProject(projectId, userId, updates);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:projectId
 * @access  Private
 */
const deleteProject = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;

    await projectService.deleteProject(projectId, userId);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Duplicate project
 * @route   POST /api/projects/:projectId/duplicate
 * @access  Private
 */
const duplicateProject = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { name } = req.body;

    const newProject = await projectService.duplicateProject(projectId, userId, name);

    res.status(201).json({
      success: true,
      message: 'Project duplicated successfully',
      data: { project: newProject }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project status
 * @route   PATCH /api/projects/:projectId/status
 * @access  Private
 */
const updateProjectStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new ApiError('Status is required', 400);
    }

    const validStatuses = ['active', 'paused', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new ApiError('Invalid status', 400);
    }

    const project = await projectService.updateProjectStatus(projectId, userId, status);

    res.status(200).json({
      success: true,
      message: 'Project status updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle project favorite
 * @route   PATCH /api/projects/:projectId/favorite
 * @access  Private
 */
const toggleFavorite = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;

    const project = await projectService.toggleFavorite(projectId, userId);

    res.status(200).json({
      success: true,
      message: `Project ${project.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: { isFavorite: project.isFavorite }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add collaborator to project
 * @route   POST /api/projects/:projectId/collaborators
 * @access  Private
 */
const addCollaborator = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { collaboratorId, role = 'viewer' } = req.body;

    if (!collaboratorId) {
      throw new ApiError('Collaborator ID is required', 400);
    }

    const project = await projectService.addCollaborator(projectId, userId, collaboratorId, role);

    res.status(200).json({
      success: true,
      message: 'Collaborator added successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove collaborator from project
 * @route   DELETE /api/projects/:projectId/collaborators/:userId
 * @access  Private
 */
const removeCollaborator = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, userId: collaboratorId } = req.params;

    const project = await projectService.removeCollaborator(projectId, userId, collaboratorId);

    res.status(200).json({
      success: true,
      message: 'Collaborator removed successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update collaborator role
 * @route   PATCH /api/projects/:projectId/collaborators/:userId
 * @access  Private
 */
const updateCollaboratorRole = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, userId: collaboratorId } = req.params;
    const { role } = req.body;

    if (!role) {
      throw new ApiError('Role is required', 400);
    }

    const project = await projectService.updateCollaboratorRole(projectId, userId, collaboratorId, role);

    res.status(200).json({
      success: true,
      message: 'Collaborator role updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add team member
 * @route   POST /api/projects/:projectId/team
 * @access  Private
 */
const addTeamMember = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const memberData = req.body;

    const project = await projectService.addTeamMember(projectId, userId, memberData);

    res.status(201).json({
      success: true,
      message: 'Team member added successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update team member
 * @route   PUT /api/projects/:projectId/team/:memberId
 * @access  Private
 */
const updateTeamMember = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, memberId } = req.params;
    const updates = req.body;

    const project = await projectService.updateTeamMember(projectId, userId, memberId, updates);

    res.status(200).json({
      success: true,
      message: 'Team member updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove team member
 * @route   DELETE /api/projects/:projectId/team/:memberId
 * @access  Private
 */
const removeTeamMember = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, memberId } = req.params;

    const project = await projectService.removeTeamMember(projectId, userId, memberId);

    res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add user persona
 * @route   POST /api/projects/:projectId/personas
 * @access  Private
 */
const addUserPersona = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const personaData = req.body;

    const project = await projectService.addUserPersona(projectId, userId, personaData);

    res.status(201).json({
      success: true,
      message: 'User persona added successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user persona
 * @route   PUT /api/projects/:projectId/personas/:personaId
 * @access  Private
 */
const updateUserPersona = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, personaId } = req.params;
    const updates = req.body;

    const project = await projectService.updateUserPersona(projectId, userId, personaId, updates);

    res.status(200).json({
      success: true,
      message: 'User persona updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user persona
 * @route   DELETE /api/projects/:projectId/personas/:personaId
 * @access  Private
 */
const deleteUserPersona = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, personaId } = req.params;

    const project = await projectService.deleteUserPersona(projectId, userId, personaId);

    res.status(200).json({
      success: true,
      message: 'User persona deleted successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update market research
 * @route   PUT /api/projects/:projectId/market-research
 * @access  Private
 */
const updateMarketResearch = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const marketResearchData = req.body;

    const project = await projectService.updateMarketResearch(projectId, userId, marketResearchData);

    res.status(200).json({
      success: true,
      message: 'Market research updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update business model
 * @route   PUT /api/projects/:projectId/business-model
 * @access  Private
 */
const updateBusinessModel = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const businessModelData = req.body;

    const project = await projectService.updateBusinessModel(projectId, userId, businessModelData);

    res.status(200).json({
      success: true,
      message: 'Business model updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update traction data
 * @route   PUT /api/projects/:projectId/traction
 * @access  Private
 */
const updateTraction = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const tractionData = req.body;

    const project = await projectService.updateTraction(projectId, userId, tractionData);

    res.status(200).json({
      success: true,
      message: 'Traction data updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update funding information
 * @route   PUT /api/projects/:projectId/funding
 * @access  Private
 */
const updateFunding = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const fundingData = req.body;

    const project = await projectService.updateFunding(projectId, userId, fundingData);

    res.status(200).json({
      success: true,
      message: 'Funding information updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add roadmap phase
 * @route   POST /api/projects/:projectId/roadmap
 * @access  Private
 */
const addRoadmapPhase = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const phaseData = req.body;

    const project = await projectService.addRoadmapPhase(projectId, userId, phaseData);

    res.status(201).json({
      success: true,
      message: 'Roadmap phase added successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update roadmap phase
 * @route   PUT /api/projects/:projectId/roadmap/:phaseId
 * @access  Private
 */
const updateRoadmapPhase = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, phaseId } = req.params;
    const updates = req.body;

    const project = await projectService.updateRoadmapPhase(projectId, userId, phaseId, updates);

    res.status(200).json({
      success: true,
      message: 'Roadmap phase updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete roadmap phase
 * @route   DELETE /api/projects/:projectId/roadmap/:phaseId
 * @access  Private
 */
const deleteRoadmapPhase = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, phaseId } = req.params;

    const project = await projectService.deleteRoadmapPhase(projectId, userId, phaseId);

    res.status(200).json({
      success: true,
      message: 'Roadmap phase deleted successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get project version history
 * @route   GET /api/projects/:projectId/versions
 * @access  Private
 */
const getVersionHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { limit = 20 } = req.query;

    const versions = await projectService.getVersionHistory(projectId, userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        versions,
        count: versions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific project version
 * @route   GET /api/projects/:projectId/versions/:version
 * @access  Private
 */
const getVersion = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, version } = req.params;

    const versionData = await projectService.getVersion(projectId, userId, parseInt(version));

    res.status(200).json({
      success: true,
      data: { version: versionData }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create manual version
 * @route   POST /api/projects/:projectId/versions
 * @access  Private
 */
const createVersion = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { changeLog } = req.body;

    if (!changeLog) {
      throw new ApiError('Change log is required', 400);
    }

    const version = await projectService.createManualVersion(projectId, userId, changeLog);

    res.status(201).json({
      success: true,
      message: 'Version created successfully',
      data: { version }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Restore project to specific version
 * @route   POST /api/projects/:projectId/versions/:version/restore
 * @access  Private
 */
const restoreVersion = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, version } = req.params;

    const project = await projectService.restoreVersion(projectId, userId, parseInt(version));

    res.status(200).json({
      success: true,
      message: `Project restored to version ${version}`,
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Compare two versions
 * @route   GET /api/projects/:projectId/versions/compare
 * @access  Private
 */
const compareVersions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { version1, version2 } = req.query;

    if (!version1 || !version2) {
      throw new ApiError('Both version numbers are required', 400);
    }

    const comparison = await projectService.compareVersions(
      projectId,
      userId,
      parseInt(version1),
      parseInt(version2)
    );

    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export project data
 * @route   POST /api/projects/:projectId/export
 * @access  Private
 */
const exportProject = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const { format = 'json' } = req.body;

    const exportData = await projectService.exportProject(projectId, userId, format);

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectStats,
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
  createVersion,
  restoreVersion,
  compareVersions,
  exportProject
};