const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateProject, validateProjectUpdate, validatePagination } = require('../middleware/validation');

/**
 * All project routes require authentication
 */
router.use(authenticate);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private
 */
router.post(
  '/',
  validateProject,
  projectController.createProject
);

/**
 * @route   GET /api/projects
 * @desc    Get all user's projects
 * @access  Private
 */
router.get(
  '/',
  validatePagination,
  projectController.getProjects
);

/**
 * @route   GET /api/projects/stats
 * @desc    Get project statistics
 * @access  Private
 */
router.get(
  '/stats',
  projectController.getProjectStats
);

/**
 * @route   GET /api/projects/search
 * @desc    Search projects
 * @access  Private
 */
router.get(
  '/search',
  projectController.searchProjects
);

/**
 * @route   GET /api/projects/:projectId
 * @desc    Get single project by ID
 * @access  Private
 */
router.get(
  '/:projectId',
  projectController.getProjectById
);

/**
 * @route   PUT /api/projects/:projectId
 * @desc    Update project
 * @access  Private
 */
router.put(
  '/:projectId',
  validateProjectUpdate,
  projectController.updateProject
);

/**
 * @route   DELETE /api/projects/:projectId
 * @desc    Delete project
 * @access  Private
 */
router.delete(
  '/:projectId',
  projectController.deleteProject
);

/**
 * @route   POST /api/projects/:projectId/duplicate
 * @desc    Duplicate project
 * @access  Private
 */
router.post(
  '/:projectId/duplicate',
  projectController.duplicateProject
);

/**
 * @route   PATCH /api/projects/:projectId/status
 * @desc    Update project status
 * @access  Private
 */
router.patch(
  '/:projectId/status',
  projectController.updateProjectStatus
);

/**
 * @route   PATCH /api/projects/:projectId/favorite
 * @desc    Toggle project favorite
 * @access  Private
 */
router.patch(
  '/:projectId/favorite',
  projectController.toggleFavorite
);

/**
 * @route   POST /api/projects/:projectId/collaborators
 * @desc    Add collaborator to project
 * @access  Private
 */
router.post(
  '/:projectId/collaborators',
  projectController.addCollaborator
);

/**
 * @route   DELETE /api/projects/:projectId/collaborators/:userId
 * @desc    Remove collaborator from project
 * @access  Private
 */
router.delete(
  '/:projectId/collaborators/:userId',
  projectController.removeCollaborator
);

/**
 * @route   PATCH /api/projects/:projectId/collaborators/:userId
 * @desc    Update collaborator role
 * @access  Private
 */
router.patch(
  '/:projectId/collaborators/:userId',
  projectController.updateCollaboratorRole
);

/**
 * @route   POST /api/projects/:projectId/team
 * @desc    Add team member
 * @access  Private
 */
router.post(
  '/:projectId/team',
  projectController.addTeamMember
);

/**
 * @route   PUT /api/projects/:projectId/team/:memberId
 * @desc    Update team member
 * @access  Private
 */
router.put(
  '/:projectId/team/:memberId',
  projectController.updateTeamMember
);

/**
 * @route   DELETE /api/projects/:projectId/team/:memberId
 * @desc    Remove team member
 * @access  Private
 */
router.delete(
  '/:projectId/team/:memberId',
  projectController.removeTeamMember
);

/**
 * @route   POST /api/projects/:projectId/personas
 * @desc    Add user persona
 * @access  Private
 */
router.post(
  '/:projectId/personas',
  projectController.addUserPersona
);

/**
 * @route   PUT /api/projects/:projectId/personas/:personaId
 * @desc    Update user persona
 * @access  Private
 */
router.put(
  '/:projectId/personas/:personaId',
  projectController.updateUserPersona
);

/**
 * @route   DELETE /api/projects/:projectId/personas/:personaId
 * @desc    Delete user persona
 * @access  Private
 */
router.delete(
  '/:projectId/personas/:personaId',
  projectController.deleteUserPersona
);

/**
 * @route   PUT /api/projects/:projectId/market-research
 * @desc    Update market research
 * @access  Private
 */
router.put(
  '/:projectId/market-research',
  projectController.updateMarketResearch
);

/**
 * @route   PUT /api/projects/:projectId/business-model
 * @desc    Update business model
 * @access  Private
 */
router.put(
  '/:projectId/business-model',
  projectController.updateBusinessModel
);

/**
 * @route   PUT /api/projects/:projectId/traction
 * @desc    Update traction data
 * @access  Private
 */
router.put(
  '/:projectId/traction',
  projectController.updateTraction
);

/**
 * @route   PUT /api/projects/:projectId/funding
 * @desc    Update funding information
 * @access  Private
 */
router.put(
  '/:projectId/funding',
  projectController.updateFunding
);

/**
 * @route   POST /api/projects/:projectId/roadmap
 * @desc    Add roadmap phase
 * @access  Private
 */
router.post(
  '/:projectId/roadmap',
  projectController.addRoadmapPhase
);

/**
 * @route   PUT /api/projects/:projectId/roadmap/:phaseId
 * @desc    Update roadmap phase
 * @access  Private
 */
router.put(
  '/:projectId/roadmap/:phaseId',
  projectController.updateRoadmapPhase
);

/**
 * @route   DELETE /api/projects/:projectId/roadmap/:phaseId
 * @desc    Delete roadmap phase
 * @access  Private
 */
router.delete(
  '/:projectId/roadmap/:phaseId',
  projectController.deleteRoadmapPhase
);

/**
 * @route   GET /api/projects/:projectId/versions
 * @desc    Get project version history
 * @access  Private
 */
router.get(
  '/:projectId/versions',
  projectController.getVersionHistory
);

/**
 * @route   GET /api/projects/:projectId/versions/:version
 * @desc    Get specific project version
 * @access  Private
 */
router.get(
  '/:projectId/versions/:version',
  projectController.getVersion
);

/**
 * @route   POST /api/projects/:projectId/versions
 * @desc    Create manual version
 * @access  Private
 */
router.post(
  '/:projectId/versions',
  projectController.createVersion
);

/**
 * @route   POST /api/projects/:projectId/versions/:version/restore
 * @desc    Restore project to specific version
 * @access  Private
 */
router.post(
  '/:projectId/versions/:version/restore',
  projectController.restoreVersion
);

/**
 * @route   GET /api/projects/:projectId/versions/compare
 * @desc    Compare two versions
 * @access  Private
 */
router.get(
  '/:projectId/versions/compare',
  projectController.compareVersions
);

/**
 * @route   POST /api/projects/:projectId/export
 * @desc    Export project data
 * @access  Private
 */
router.post(
  '/:projectId/export',
  projectController.exportProject
);

module.exports = router;