import React, { useState, useEffect } from 'react';
import './PerformanceEvaluation.css';

function PerformanceEvaluation() {
  const [activeTab, setActiveTab] = useState('list');
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    periodCovered: { startDate: '', endDate: '' },
    competencies: {
      qualityOfWork: { score: 3, comment: '' },
      quantityOfWork: { score: 3, comment: '' },
      jobKnowledge: { score: 3, comment: '' },
      abilityToLearn: { score: 3, comment: '' },
      reliability: { score: 3, comment: '' },
    },
    behavioral: {
      jobAttitude: { score: 3, comment: '' },
      industriousness: { score: 3, comment: '' },
      initiative: { score: 3, comment: '' },
      cooperationTeamwork: { score: 3, comment: '' },
      attendance: { score: 3, comment: '' },
      honestyIntegrity: { score: 3, comment: '' },
    },
    areasForTraining: '',
    performanceImprovements: '',
    strengthsWeaknesses: '',
    recommendedActions: {},
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchEvaluations();
    fetchEmployees();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/performance-evaluations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setEvaluations(data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch evaluations');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/employees-for-evaluation', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('period')) {
      const [_, dateType] = name.split('.');
      setFormData(prev => ({
        ...prev,
        periodCovered: {
          ...prev.periodCovered,
          [dateType]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleScoreChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          score: parseInt(value),
        },
      },
    }));
  };

  const handleCommentChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          comment: value,
        },
      },
    }));
  };

  const handleSubmitForApproval = async () => {
    if (!selectedEmployee) {
      alert('Please select an evaluation');
      return;
    }

    if (confirm(`Submit evaluation for ${selectedEmployee.employeeName} for approval?`)) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/performance-evaluations/${selectedEmployee._id}/submit`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          alert('✓ Evaluation submitted successfully');
          setSelectedEmployee(null);
          fetchEvaluations();
        } else {
          const error = await response.json();
          alert('⚠ Cannot submit evaluation:\n' + (error.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error submitting evaluation:', err);
        alert('Error submitting evaluation');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApproveEvaluation = async () => {
    if (!selectedEmployee) {
      alert('Please select an evaluation');
      return;
    }

    if (confirm(`Approve evaluation for ${selectedEmployee.employeeName}?`)) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/performance-evaluations/${selectedEmployee._id}/approve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recommendedActions: selectedEmployee.recommendedActions || {} }),
        });

        if (response.ok) {
          alert('✓ Evaluation approved successfully');
          setSelectedEmployee(null);
          fetchEvaluations();
        } else {
          const error = await response.json();
          alert('⚠ Cannot approve evaluation:\n' + (error.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error approving evaluation:', err);
        alert('Error approving evaluation');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.employeeId) {
      setError('Please select an employee');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/performance-evaluations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Evaluation created successfully!');
        setFormData({
          employeeId: '',
          periodCovered: { startDate: '', endDate: '' },
          competencies: {
            qualityOfWork: { score: 3, comment: '' },
            quantityOfWork: { score: 3, comment: '' },
            jobKnowledge: { score: 3, comment: '' },
            abilityToLearn: { score: 3, comment: '' },
            reliability: { score: 3, comment: '' },
          },
          behavioral: {
            jobAttitude: { score: 3, comment: '' },
            industriousness: { score: 3, comment: '' },
            initiative: { score: 3, comment: '' },
            cooperationTeamwork: { score: 3, comment: '' },
            attendance: { score: 3, comment: '' },
            honestyIntegrity: { score: 3, comment: '' },
          },
          areasForTraining: '',
          performanceImprovements: '',
          strengthsWeaknesses: '',
          recommendedActions: {},
        });
        fetchEvaluations();
        setTimeout(() => setActiveTab('list'), 2000);
      } else {
        setError(data.message || 'Failed to create evaluation');
      }
    } catch (err) {
      setError('Error creating evaluation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const ScoreDisplay = ({ score }) => {
    const descriptions = {
      5: 'Excellent',
      4: 'Above Average',
      3: 'Average',
      2: 'Below Average',
      1: 'Poor',
    };
    const colors = {
      5: '#4CAF50',
      4: '#8BC34A',
      3: '#FFC107',
      2: '#FF9800',
      1: '#F44336',
    };
    return (
      <span style={{ color: colors[score], fontWeight: 'bold' }}>
        {score} - {descriptions[score]}
      </span>
    );
  };

  return (
    <div className="performance-evaluation">
      <div className="section-header">
        <h2>📊 Performance Evaluation</h2>
        <p>Employee performance review and assessment</p>
      </div>

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✅ {success}
        </div>
      )}

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 Evaluations List
        </button>
        {['hr_head', 'supervisor'].includes(user.role) && (
          <button
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ✏️ Create Evaluation
          </button>
        )}
      </div>

      {/* Evaluations List Tab */}
      {activeTab === 'list' && (
        <div className="evaluations-list">
          {loading ? (
            <div className="loading">Loading evaluations...</div>
          ) : evaluations.length > 0 ? (
            <div className="table-container">
              <table className="evaluations-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Overall Score</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map(evaluation => (
                    <tr key={evaluation._id}>
                      <td>{evaluation.employeeName}</td>
                      <td>
                        {new Date(evaluation.periodCovered.startDate).toLocaleDateString()} -
                        {new Date(evaluation.periodCovered.endDate).toLocaleDateString()}
                      </td>
                      <td><ScoreDisplay score={evaluation.overallScore} /></td>
                      <td>{evaluation.getEvaluationRating ? evaluation.getEvaluationRating() : 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${evaluation.status}`}>
                          {evaluation.status}
                        </span>
                      </td>
                      <td>
                        <button className="action-btn" onClick={() => setSelectedEmployee(evaluation)}>
                          👁️ View
                        </button>
                        <button className="action-btn" style={{ marginLeft: '0.5rem', backgroundColor: '#667eea' }} onClick={() => {
                          setFormData({
                            employeeId: evaluation.employeeId,
                            periodCovered: evaluation.periodCovered,
                            competencies: evaluation.competencies,
                            behavioral: evaluation.behavioral,
                            areasForTraining: evaluation.areasForTraining,
                            performanceImprovements: evaluation.performanceImprovements,
                            strengthsWeaknesses: evaluation.strengthsWeaknesses,
                            recommendedActions: evaluation.recommendedActions,
                          });
                          setActiveTab('create');
                        }}>
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No evaluations found
            </div>
          )}
        </div>
      )}

      {/* Create Evaluation Tab */}
      {activeTab === 'create' && (
        <div className="create-evaluation">
          <form onSubmit={handleSubmitEvaluation} className="evaluation-form">
            {/* Employee Selection */}
            <div className="form-section">
              <h3>Employee Information</h3>
              <div className="form-group">
                <label>Select Employee *</label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.position || emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Period Start Date *</label>
                  <input
                    type="date"
                    name="period.startDate"
                    value={formData.periodCovered.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Period End Date *</label>
                  <input
                    type="date"
                    name="period.endDate"
                    value={formData.periodCovered.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Competency Indicators */}
            <div className="form-section">
              <h3>A. Competency Indicators (60%)</h3>

              {Object.entries(formData.competencies).map(([key, value]) => (
                <div key={key} className="competency-item">
                  <h4>
                    {key === 'qualityOfWork' && 'Quality of Work (15%)'}
                    {key === 'quantityOfWork' && 'Quantity of Work (15%)'}
                    {key === 'jobKnowledge' && 'Job Knowledge (15%)'}
                    {key === 'abilityToLearn' && 'Ability to Learn (5%)'}
                    {key === 'reliability' && 'Reliability (10%)'}
                  </h4>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Score (1-5) *</label>
                      <select
                        value={value.score}
                        onChange={e => handleScoreChange('competencies', key, e.target.value)}
                        required
                      >
                        <option value="1">1 - Poor</option>
                        <option value="2">2 - Below Average</option>
                        <option value="3">3 - Average</option>
                        <option value="4">4 - Above Average</option>
                        <option value="5">5 - Excellent</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Comment</label>
                      <textarea
                        value={value.comment}
                        onChange={e => handleCommentChange('competencies', key, e.target.value)}
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Behavioral Competency */}
            <div className="form-section">
              <h3>B. Behavioral Competency (40%)</h3>

              {Object.entries(formData.behavioral).map(([key, value]) => (
                <div key={key} className="competency-item">
                  <h4>
                    {key === 'jobAttitude' && 'Job Attitude (10%)'}
                    {key === 'industriousness' && 'Industriousness (5%)'}
                    {key === 'initiative' && 'Initiative (5%)'}
                    {key === 'cooperationTeamwork' && 'Cooperation/Teamwork (5%)'}
                    {key === 'attendance' && 'Attendance (10%)'}
                    {key === 'honestyIntegrity' && 'Honesty & Integrity (5%)'}
                  </h4>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Score (1-5) *</label>
                      <select
                        value={value.score}
                        onChange={e => handleScoreChange('behavioral', key, e.target.value)}
                        required
                      >
                        <option value="1">1 - Poor</option>
                        <option value="2">2 - Below Average</option>
                        <option value="3">3 - Average</option>
                        <option value="4">4 - Above Average</option>
                        <option value="5">5 - Excellent</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Comment</label>
                      <textarea
                        value={value.comment}
                        onChange={e => handleCommentChange('behavioral', key, e.target.value)}
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations (Confidential) */}
            <div className="form-section">
              <h3>🔒 Recommendations (Confidential)</h3>

              <div className="form-group">
                <label>Areas for Training/Development</label>
                <textarea
                  name="areasForTraining"
                  value={formData.areasForTraining}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Performance Improvements</label>
                <textarea
                  name="performanceImprovements"
                  value={formData.performanceImprovements}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Strengths & Weaknesses</label>
                <textarea
                  name="strengthsWeaknesses"
                  value={formData.strengthsWeaknesses}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating...' : '✓ Create Evaluation'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Details Modal */}
      {selectedEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Evaluation Details - {selectedEmployee.employeeName}</h3>
              <button className="close-btn" onClick={() => setSelectedEmployee(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Overall Score:</label>
                  <div style={{ fontSize: '1.2rem' }}>
                    <ScoreDisplay score={selectedEmployee.overallScore} />
                  </div>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`status-badge status-${selectedEmployee.status}`}>
                    {selectedEmployee.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Period:</label>
                  <span>
                    {new Date(selectedEmployee.periodCovered.startDate).toLocaleDateString()} -
                    {new Date(selectedEmployee.periodCovered.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Competency Scores</h4>
                {Object.entries(selectedEmployee.competencies).map(([key, value]) => (
                  <div key={key} className="score-row">
                    <span>
                      {key === 'qualityOfWork' && 'Quality of Work'}
                      {key === 'quantityOfWork' && 'Quantity of Work'}
                      {key === 'jobKnowledge' && 'Job Knowledge'}
                      {key === 'abilityToLearn' && 'Ability to Learn'}
                      {key === 'reliability' && 'Reliability'}
                    </span>
                    <span><ScoreDisplay score={value.score} /></span>
                  </div>
                ))}
              </div>

              <div className="detail-section">
                <h4>Behavioral Scores</h4>
                {Object.entries(selectedEmployee.behavioral).map(([key, value]) => (
                  <div key={key} className="score-row">
                    <span>
                      {key === 'jobAttitude' && 'Job Attitude'}
                      {key === 'industriousness' && 'Industriousness'}
                      {key === 'initiative' && 'Initiative'}
                      {key === 'cooperationTeamwork' && 'Cooperation/Teamwork'}
                      {key === 'attendance' && 'Attendance'}
                      {key === 'honestyIntegrity' && 'Honesty & Integrity'}
                    </span>
                    <span><ScoreDisplay score={value.score} /></span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid #ddd',
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}>
                {selectedEmployee.status === 'draft' && (
                  <button
                    onClick={handleSubmitForApproval}
                    disabled={loading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: loading ? '#ccc' : '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    📤 Submit for Approval
                  </button>
                )}
                {selectedEmployee.status === 'submitted' && (
                  <button
                    onClick={handleApproveEvaluation}
                    disabled={loading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: loading ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    ✓ Approve Evaluation
                  </button>
                )}
                <button
                  onClick={() => setSelectedEmployee(null)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceEvaluation;
