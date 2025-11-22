const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const performanceController = require('../controllers/performanceEvaluationController');

// All routes require authentication
router.use(authMiddleware);

// Create evaluation (HR Head/Supervisor only)
router.post('/', (req, res, next) => {
  if (!['hr_head', 'supervisor'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only HR Head and Supervisor can create evaluations',
    });
  }
  next();
}, performanceController.createEvaluation);

// Get all evaluations
router.get('/', performanceController.getEvaluations);

// Get single evaluation
router.get('/:id', performanceController.getEvaluationById);

// Update evaluation (HR Head/Supervisor only)
router.put('/:id', (req, res, next) => {
  if (!['hr_head', 'supervisor'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only HR Head and Supervisor can update evaluations',
    });
  }
  next();
}, performanceController.updateEvaluation);

// Submit evaluation
router.post('/:id/submit', performanceController.submitEvaluation);

// Approve evaluation (HR Head only)
router.post('/:id/approve', (req, res, next) => {
  if (req.user.role !== 'hr_head') {
    return res.status(403).json({
      success: false,
      message: 'Only HR Head can approve evaluations',
    });
  }
  next();
}, performanceController.approveEvaluation);

// Employee acknowledge
router.post('/:id/acknowledge', performanceController.acknowledgeEvaluation);

// Delete evaluation
router.delete('/:id', (req, res, next) => {
  if (req.user.role !== 'hr_head') {
    return res.status(403).json({
      success: false,
      message: 'Only HR Head can delete evaluations',
    });
  }
  next();
}, performanceController.deleteEvaluation);

module.exports = router;
