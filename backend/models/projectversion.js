const mongoose = require('mongoose');

const projectVersionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    version: {
      type: Number,
      required: true
    },
    versionName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    changeLog: {
      type: String,
      maxlength: 1000
    },
    changeType: {
      type: String,
      enum: ['major', 'minor', 'patch', 'manual'],
      default: 'manual'
    },
    changedFields: [{
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }],
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    tags: [String],
    isAutomatic: {
      type: Boolean,
      default: false
    },
    restoredFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectVersion'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
projectVersionSchema.index({ projectId: 1, version: -1 });
projectVersionSchema.index({ projectId: 1, createdAt: -1 });
projectVersionSchema.index({ userId: 1, createdAt: -1 });

// Static method to create version
projectVersionSchema.statics.createVersion = async function(project, userId, changeLog, changeType = 'manual') {
  // Get latest version number
  const latestVersion = await this.findOne({ projectId: project._id })
    .sort({ version: -1 })
    .select('version');

  const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

  // Create snapshot
  const snapshot = project.toObject();
  delete snapshot._id;
  delete snapshot.__v;
  delete snapshot.createdAt;
  delete snapshot.updatedAt;

  const version = new this({
    projectId: project._id,
    userId,
    version: newVersionNumber,
    changeLog,
    changeType,
    snapshot,
    isAutomatic: changeType !== 'manual'
  });

  await version.save();
  return version;
};

// Static method to get version history
projectVersionSchema.statics.getVersionHistory = async function(projectId, limit = 20) {
  return this.find({ projectId })
    .sort({ version: -1 })
    .limit(limit)
    .populate('userId', 'name email username')
    .select('-snapshot')
    .lean();
};

// Static method to get specific version
projectVersionSchema.statics.getVersion = async function(projectId, version) {
  return this.findOne({ projectId, version })
    .populate('userId', 'name email username')
    .lean();
};

// Static method to compare versions
projectVersionSchema.statics.compareVersions = async function(projectId, version1, version2) {
  const v1 = await this.findOne({ projectId, version: version1 });
  const v2 = await this.findOne({ projectId, version: version2 });

  if (!v1 || !v2) {
    throw new Error('One or both versions not found');
  }

  const differences = [];

  // Deep comparison logic
  const compareObjects = (obj1, obj2, path = '') => {
    const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    keys.forEach(key => {
      const fullPath = path ? `${path}.${key}` : key;
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({
          field: fullPath,
          version1Value: val1,
          version2Value: val2
        });
      }
    });
  };

  compareObjects(v1.snapshot, v2.snapshot);

  return {
    version1: {
      version: v1.version,
      createdAt: v1.createdAt,
      changeLog: v1.changeLog
    },
    version2: {
      version: v2.version,
      createdAt: v2.createdAt,
      changeLog: v2.changeLog
    },
    differences
  };
};

// Static method to restore version
projectVersionSchema.statics.restoreVersion = async function(projectId, version, userId) {
  const Project = mongoose.model('Project');

  const versionDoc = await this.findOne({ projectId, version });
  if (!versionDoc) {
    throw new Error('Version not found');
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // Create a version before restoring
  await this.createVersion(project, userId, `Backup before restoring to version ${version}`, 'automatic');

  // Restore snapshot
  Object.assign(project, versionDoc.snapshot);
  project.version = (project.version || 0) + 1;
  await project.save();

  // Create new version entry for the restore
  const restoredVersion = await this.createVersion(
    project,
    userId,
    `Restored from version ${version}`,
    'manual'
  );

  restoredVersion.restoredFrom = versionDoc._id;
  await restoredVersion.save();

  return project;
};

// Static method to delete old versions
projectVersionSchema.statics.cleanupOldVersions = async function(projectId, keepCount = 10) {
  const versions = await this.find({ projectId })
    .sort({ version: -1 })
    .select('_id version');

  if (versions.length <= keepCount) {
    return { deleted: 0 };
  }

  const versionsToDelete = versions.slice(keepCount);
  const idsToDelete = versionsToDelete.map(v => v._id);

  const result = await this.deleteMany({ _id: { $in: idsToDelete } });

  return { deleted: result.deletedCount };
};

const ProjectVersion = mongoose.model('ProjectVersion', projectVersionSchema);

module.exports = ProjectVersion;