const mongoose = require('mongoose');

const performanceEvaluationSchema = new mongoose.Schema(
  {
    // Employee Information
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employeeName: String,
    position: String,
    datehired: Date,
    periodCovered: {
      startDate: Date,
      endDate: Date,
    },

    // Competency Indicators (A) - with weights
    competencies: {
      qualityOfWork: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 15 },
      },
      quantityOfWork: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 15 },
      },
      jobKnowledge: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 15 },
      },
      abilityToLearn: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 5 },
      },
      reliability: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 10 },
      },
    },

    // Behavioral Competency (B)
    behavioral: {
      jobAttitude: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 10 },
      },
      industriousness: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 5 },
      },
      initiative: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 5 },
      },
      cooperationTeamwork: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 5 },
      },
      attendance: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 10 },
      },
      honestyIntegrity: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        weight: { type: Number, default: 5 },
      },
    },

    // Recommendations (Confidential)
    areasForTraining: String,
    performanceImprovements: String,
    strengthsWeaknesses: String,

    // Recommended Actions
    recommendedActions: {
      regularization: Boolean,
      probationaryEmployment: Boolean,
      specialEventContract: Boolean,
      renewalSpecialEvents: Boolean,
      promotionTo: String,
      lateralTransferTo: String,
      salaryIncrease: String,
      anotherAppraisalOn: Date,
      others: String,
    },

    // Signatures
    ratedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String,
      position: String,
      date: Date,
    },
    notedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String,
      position: String,
      date: Date,
    },
    conformedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      name: String,
      position: String,
      date: Date,
    },
    employeeSignature: {
      date: Date,
      acknowledged: Boolean,
    },

    // Overall Evaluation Score
    overallScore: {
      type: Number,
      min: 1,
      max: 5,
      get: function() {
        // Calculate weighted average
        const competencyScores = [
          (this.competencies.qualityOfWork.score || 0) * 0.15,
          (this.competencies.quantityOfWork.score || 0) * 0.15,
          (this.competencies.jobKnowledge.score || 0) * 0.15,
          (this.competencies.abilityToLearn.score || 0) * 0.05,
          (this.competencies.reliability.score || 0) * 0.10,
        ];

        const behavioralScores = [
          (this.behavioral.jobAttitude.score || 0) * 0.10,
          (this.behavioral.industriousness.score || 0) * 0.05,
          (this.behavioral.initiative.score || 0) * 0.05,
          (this.behavioral.cooperationTeamwork.score || 0) * 0.05,
          (this.behavioral.attendance.score || 0) * 0.10,
          (this.behavioral.honestyIntegrity.score || 0) * 0.05,
        ];

        const total = [...competencyScores, ...behavioralScores].reduce((a, b) => a + b, 0);
        return Math.round(total * 100) / 100;
      },
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'archived'],
      default: 'draft',
    },

    // Audit
    createdBy: mongoose.Schema.Types.ObjectId,
    updatedBy: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Calculate overall evaluation rating
performanceEvaluationSchema.methods.getEvaluationRating = function() {
  const score = this.overallScore;
  if (score >= 4.5) return 'Excellent';
  if (score >= 3.9) return 'Above Average';
  if (score >= 3.0) return 'Average';
  if (score >= 2.0) return 'Below Average';
  return 'Poor';
};

// Index
performanceEvaluationSchema.index({ employeeId: 1, createdAt: -1 });
performanceEvaluationSchema.index({ status: 1 });

const PerformanceEvaluation = mongoose.model('PerformanceEvaluation', performanceEvaluationSchema);

module.exports = PerformanceEvaluation;
