const mongoose = require('mongoose');

const marketResearchSchema = new mongoose.Schema({
  tam: {
    value: Number,
    description: String,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  sam: {
    value: Number,
    description: String,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  som: {
    value: Number,
    description: String,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  competitors: [{
    name: String,
    description: String,
    strengths: [String],
    weaknesses: [String],
    marketShare: Number,
    website: String,
    funding: Number
  }],
  marketTrends: [String],
  customerSegments: [String],
  geographicMarkets: [String]
});

const userPersonaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  avatar: String,
  demographics: {
    age: String,
    gender: String,
    location: String,
    occupation: String,
    income: String,
    education: String
  },
  psychographics: {
    interests: [String],
    values: [String],
    lifestyle: String
  },
  painPoints: [{
    type: String,
    required: true
  }],
  goals: [String],
  behaviors: [String],
  preferredChannels: [String],
  buyingMotivation: String,
  quote: String
}, { timestamps: true });

const businessModelSchema = new mongoose.Schema({
  revenueStreams: [{
    name: String,
    description: String,
    type: {
      type: String,
      enum: ['subscription', 'one-time', 'freemium', 'advertising', 'commission', 'licensing', 'other']
    },
    pricing: Number,
    projectedRevenue: Number
  }],
  costStructure: [{
    category: String,
    description: String,
    amount: Number,
    frequency: {
      type: String,
      enum: ['one-time', 'monthly', 'quarterly', 'annually']
    }
  }],
  pricingStrategy: {
    model: {
      type: String,
      enum: ['freemium', 'subscription', 'pay-per-use', 'tiered', 'enterprise', 'hybrid']
    },
    tiers: [{
      name: String,
      price: Number,
      features: [String],
      targetAudience: String
    }]
  },
  keyResources: [String],
  keyActivities: [String],
  keyPartners: [String],
  valueProposition: String,
  customerRelationships: String,
  channels: [String]
});

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: String,
  role: {
    type: String,
    required: true
  },
  expertise: [String],
  bio: String,
  linkedIn: String,
  avatar: String,
  isFounder: {
    type: Boolean,
    default: false
  },
  equity: Number,
  joinedDate: Date
}, { timestamps: true });

const tractionSchema = new mongoose.Schema({
  users: {
    total: Number,
    active: Number,
    growth: Number
  },
  revenue: {
    mrr: Number,
    arr: Number,
    totalRevenue: Number,
    growth: Number
  },
  engagement: {
    dau: Number,
    mau: Number,
    retention: Number,
    churnRate: Number
  },
  milestones: [{
    title: String,
    description: String,
    date: Date,
    achieved: {
      type: Boolean,
      default: false
    }
  }],
  partnerships: [{
    name: String,
    type: String,
    description: String,
    date: Date
  }],
  pressAndMedia: [{
    publication: String,
    title: String,
    url: String,
    date: Date
  }]
});

const fundingSchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'series-d+', 'ipo', 'bootstrapped']
  },
  amountRaised: Number,
  targetAmount: Number,
  valuation: Number,
  investors: [{
    name: String,
    type: {
      type: String,
      enum: ['angel', 'vc', 'corporate', 'accelerator', 'crowdfunding', 'government']
    },
    amount: Number,
    date: Date
  }],
  useOfFunds: [{
    category: String,
    amount: Number,
    percentage: Number,
    description: String
  }],
  burnRate: Number,
  runway: Number
});

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [200, 'Tagline cannot exceed 200 characters']
    },
    logo: String,
    coverImage: String,
    industry: {
      type: String,
      trim: true,
      index: true
    },
    stage: {
      type: String,
      enum: ['idea', 'validation', 'mvp', 'growth', 'scale'],
      default: 'idea',
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'archived'],
      default: 'active',
      index: true
    },
    targetMarket: {
      primary: String,
      secondary: [String],
      geography: [String]
    },
    problemStatement: {
      type: String,
      maxlength: [1000, 'Problem statement cannot exceed 1000 characters']
    },
    solution: {
      type: String,
      maxlength: [1000, 'Solution cannot exceed 1000 characters']
    },
    uniqueValueProposition: {
      type: String,
      maxlength: [500, 'UVP cannot exceed 500 characters']
    },
    marketResearch: marketResearchSchema,
    userPersonas: [userPersonaSchema],
    businessModel: businessModelSchema,
    team: [teamMemberSchema],
    traction: tractionSchema,
    funding: fundingSchema,
    roadmap: [{
      phase: String,
      title: String,
      description: String,
      startDate: Date,
      endDate: Date,
      status: {
        type: String,
        enum: ['planned', 'in-progress', 'completed', 'delayed'],
        default: 'planned'
      },
      milestones: [{
        title: String,
        completed: Boolean,
        completedDate: Date
      }]
    }],
    risks: [{
      category: {
        type: String,
        enum: ['market', 'technical', 'financial', 'operational', 'legal', 'competitive']
      },
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      mitigation: String,
      status: {
        type: String,
        enum: ['identified', 'mitigating', 'resolved', 'accepted']
      }
    }],
    documents: [{
      name: String,
      type: String,
      url: String,
      size: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    visibility: {
      type: String,
      enum: ['private', 'team', 'public'],
      default: 'private'
    },
    collaborators: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['owner', 'editor', 'viewer'],
        default: 'viewer'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    lastActivityAt: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    },
    isTemplate: {
      type: Boolean,
      default: false
    },
    isFavorite: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ userId: 1, stage: 1 });
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });
projectSchema.index({ 'collaborators.userId': 1 });
projectSchema.index({ lastActivityAt: -1 });

// Virtual for total team members
projectSchema.virtual('teamSize').get(function() {
  return this.team ? this.team.length : 0;
});

// Virtual for project age
projectSchema.virtual('projectAge').get(function() {
  const days = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  return days;
});

// Virtual for completion percentage
projectSchema.virtual('completionPercentage').get(function() {
  const totalFields = 15; // Adjust based on key fields
  let filledFields = 0;

  if (this.name) filledFields++;
  if (this.description) filledFields++;
  if (this.problemStatement) filledFields++;
  if (this.solution) filledFields++;
  if (this.targetMarket?.primary) filledFields++;
  if (this.industry) filledFields++;
  if (this.businessModel?.revenueStreams?.length > 0) filledFields++;
  if (this.userPersonas?.length > 0) filledFields++;
  if (this.team?.length > 0) filledFields++;
  if (this.marketResearch?.competitors?.length > 0) filledFields++;
  if (this.traction?.users?.total) filledFields++;
  if (this.funding?.stage) filledFields++;
  if (this.roadmap?.length > 0) filledFields++;
  if (this.uniqueValueProposition) filledFields++;
  if (this.tagline) filledFields++;

  return Math.round((filledFields / totalFields) * 100);
});

// Pre-save middleware
projectSchema.pre('save', function(next) {
  // Update last activity timestamp
  this.lastActivityAt = new Date();

  // Convert tags to lowercase
  if (this.tags) {
    this.tags = this.tags.map(tag => tag.toLowerCase());
  }

  next();
});

// Instance method to add collaborator
projectSchema.methods.addCollaborator = async function(userId, role = 'viewer') {
  // Check if collaborator already exists
  const existingCollaborator = this.collaborators.find(
    c => c.userId.toString() === userId.toString()
  );

  if (existingCollaborator) {
    existingCollaborator.role = role;
  } else {
    this.collaborators.push({ userId, role });
  }

  await this.save();
  return this;
};

// Instance method to remove collaborator
projectSchema.methods.removeCollaborator = async function(userId) {
  this.collaborators = this.collaborators.filter(
    c => c.userId.toString() !== userId.toString()
  );

  await this.save();
  return this;
};

// Instance method to update collaborator role
projectSchema.methods.updateCollaboratorRole = async function(userId, newRole) {
  const collaborator = this.collaborators.find(
    c => c.userId.toString() === userId.toString()
  );

  if (collaborator) {
    collaborator.role = newRole;
    await this.save();
  }

  return this;
};

// Instance method to check if user has access
projectSchema.methods.hasAccess = function(userId, requiredRole = 'viewer') {
  // Owner always has access
  if (this.userId.toString() === userId.toString()) {
    return true;
  }

  // Check collaborators
  const collaborator = this.collaborators.find(
    c => c.userId.toString() === userId.toString()
  );

  if (!collaborator) return false;

  const roleHierarchy = { viewer: 1, editor: 2, owner: 3 };
  return roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole];
};

// Static method to get user's projects
projectSchema.statics.getUserProjects = async function(userId, options = {}) {
  const {
    status,
    stage,
    search,
    sortBy = 'lastActivityAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = options;

  const query = {
    $or: [
      { userId },
      { 'collaborators.userId': userId }
    ]
  };

  if (status) query.status = status;
  if (stage) query.stage = stage;
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const projects = await this.find(query)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limit)
    .populate('collaborators.userId', 'name email username')
    .lean();

  const total = await this.countDocuments(query);

  return {
    projects,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProjects: total,
      hasMore: skip + projects.length < total
    }
  };
};

// Static method to get project statistics
projectSchema.statics.getProjectStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { userId: mongoose.Types.ObjectId(userId) },
          { 'collaborators.userId': mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        activeProjects: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedProjects: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pausedProjects: {
          $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] }
        },
        ideaStage: {
          $sum: { $cond: [{ $eq: ['$stage', 'idea'] }, 1, 0] }
        },
        validationStage: {
          $sum: { $cond: [{ $eq: ['$stage', 'validation'] }, 1, 0] }
        },
        mvpStage: {
          $sum: { $cond: [{ $eq: ['$stage', 'mvp'] }, 1, 0] }
        },
        growthStage: {
          $sum: { $cond: [{ $eq: ['$stage', 'growth'] }, 1, 0] }
        },
        scaleStage: {
          $sum: { $cond: [{ $eq: ['$stage', 'scale'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pausedProjects: 0,
    ideaStage: 0,
    validationStage: 0,
    mvpStage: 0,
    growthStage: 0,
    scaleStage: 0
  };
};

// Static method to search projects
projectSchema.statics.searchProjects = async function(userId, searchTerm, limit = 20) {
  return this.find({
    $or: [
      { userId },
      { 'collaborators.userId': userId }
    ],
    $text: { $search: searchTerm }
  })
    .limit(limit)
    .select('name description industry stage status tags')
    .lean();
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;