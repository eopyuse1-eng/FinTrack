const PerformanceEvaluation = require('../models/PerformanceEvaluation');
const { User } = require('../models/User');

// Create new performance evaluation
exports.createEvaluation = async (req, res) => {
  try {
    const { employeeId, periodCovered, competencies, behavioral } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const evaluation = new PerformanceEvaluation({
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      position: employee.role,
      datehired: employee.createdAt,
      periodCovered,
      competencies,
      behavioral,
      createdBy: req.user.id,
    });

    await evaluation.save();

    res.status(201).json({
      success: true,
      message: 'Performance evaluation created successfully',
      data: evaluation,
    });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create performance evaluation',
      error: error.message,
    });
  }
};

// Get all evaluations (with filters)
exports.getEvaluations = async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    const filter = {};

    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    const evaluations = await PerformanceEvaluation.find(filter)
      .populate('employeeId', 'firstName lastName email position')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: evaluations,
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluations',
      error: error.message,
    });
  }
};

// Get single evaluation
exports.getEvaluationById = async (req, res) => {
  try {
    const evaluation = await PerformanceEvaluation.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email position')
      .populate('createdBy', 'firstName lastName');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found',
      });
    }

    res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation',
      error: error.message,
    });
  }
};

// Update evaluation
exports.updateEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const evaluation = await PerformanceEvaluation.findByIdAndUpdate(
      id,
      { ...updates, updatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate('employeeId', 'firstName lastName email');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation updated successfully',
      data: evaluation,
    });
  } catch (error) {
    console.error('Error updating evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update evaluation',
      error: error.message,
    });
  }
};

// Submit evaluation for approval
exports.submitEvaluation = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await PerformanceEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found',
      });
    }

    if (evaluation.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft evaluations can be submitted',
      });
    }

    evaluation.status = 'submitted';
    evaluation.ratedBy = {
      userId: req.user.id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      date: new Date(),
    };

    await evaluation.save();

    res.status(200).json({
      success: true,
      message: 'Evaluation submitted successfully',
      data: evaluation,
    });
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit evaluation',
      error: error.message,
    });
  }
};

// Approve evaluation (HR Head only)
exports.approveEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { recommendedActions } = req.body;

    const evaluation = await PerformanceEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found',
      });
    }

    evaluation.status = 'approved';
    evaluation.recommendedActions = recommendedActions;
    evaluation.conformedBy = {
      userId: req.user.id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      date: new Date(),
    };

    await evaluation.save();

    res.status(200).json({
      success: true,
      message: 'Evaluation approved successfully',
      data: evaluation,
    });
  } catch (error) {
    console.error('Error approving evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve evaluation',
      error: error.message,
    });
  }
};

// Employee acknowledge evaluation
exports.acknowledgeEvaluation = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await PerformanceEvaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found',
      });
    }

    evaluation.employeeSignature = {
      date: new Date(),
      acknowledged: true,
    };

    await evaluation.save();

    res.status(200).json({
      success: true,
      message: 'Evaluation acknowledged successfully',
      data: evaluation,
    });
  } catch (error) {
    console.error('Error acknowledging evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge evaluation',
      error: error.message,
    });
  }
};

// Delete evaluation
exports.deleteEvaluation = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await PerformanceEvaluation.findByIdAndDelete(id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete evaluation',
      error: error.message,
    });
  }
};
