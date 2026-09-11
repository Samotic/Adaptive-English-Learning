import mongoose from 'mongoose';

/**
 * AI Model Version Schema
 * Tracks different versions of the trained AI model for UC18
 * ML Ops: Retrain/Update AI Models
 */
const ModelVersionSchema = new mongoose.Schema({
  // Version info
  version: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Model metadata
  modelType: {
    type: String,
    required: true,
    enum: ['irt', 'adaptive', 'nlp', 'recommendation'],
    default: 'irt'
  },
  
  // Training information
  trainingDataCount: {
    type: Number,
    required: true
  },
  
  trainingStartedAt: {
    type: Date,
    required: true
  },
  
  trainingCompletedAt: {
    type: Date
  },
  
  // Model parameters (IRT model in this case)
  parameters: {
    // Item parameters
    difficulty: {
      mean: Number,
      variance: Number,
      adjustmentFactor: Number
    },
    discrimination: {
      mean: Number,
      variance: Number
    },
    
    // Person parameters
    abilityEstimates: {
      mean: Number,
      variance: Number
    },
    
    // Learning rate and convergence
    learningRate: {
      type: Number,
      default: 0.01
    },
    
    iterations: {
      type: Number,
      default: 100
    },
    
    convergenceThreshold: {
      type: Number,
      default: 0.001
    }
  },
  
  // Learned per-question difficulty ({ questionId: suggestedDifficulty }), applied on deploy
  questionAdjustments: {
    type: mongoose.Schema.Types.Mixed
  },

  // Performance metrics
  metrics: {
    accuracy: Number,
    precision: Number,
    recall: Number,
    f1Score: Number,
    rmse: Number,  // Root Mean Square Error
    mae: Number,   // Mean Absolute Error
    logLikelihood: Number
  },
  
  // Deployment status
  status: {
    type: String,
    enum: ['training', 'completed', 'deployed', 'archived', 'failed'],
    default: 'training',
    index: true
  },
  
  isProduction: {
    type: Boolean,
    default: false
  },
  
  deployedAt: {
    type: Date
  },
  
  // Notes and metadata
  description: String,
  trainedBy: String,  // System or admin who triggered training
  
  // Configuration used
  config: {
    batchSize: Number,
    validationSplit: Number,
    randomSeed: Number
  },
  
  // Error tracking ("errors" is reserved by Mongoose)
  trainingErrors: [{
    timestamp: Date,
    message: String,
    stack: String
  }]
  
}, { timestamps: true });

// Index for finding latest production model
ModelVersionSchema.index({ isProduction: 1, createdAt: -1 });

// Static method to get current production model
ModelVersionSchema.statics.getCurrentProductionModel = async function() {
  return await this.findOne({ 
    isProduction: true,
    status: 'deployed'
  }).sort({ deployedAt: -1 });
};

// Static method to promote model to production
ModelVersionSchema.statics.promoteToProduction = async function(versionId) {
  // First, demote all current production models
  await this.updateMany(
    { isProduction: true },
    { 
      isProduction: false,
      status: 'archived'
    }
  );
  
  // Then promote the new version
  return await this.findByIdAndUpdate(
    versionId,
    {
      isProduction: true,
      status: 'deployed',
      deployedAt: new Date()
    },
    { new: true }
  );
};

export const ModelVersionModel = mongoose.models.ModelVersion || 
  mongoose.model('ModelVersion', ModelVersionSchema);

export default ModelVersionModel;
