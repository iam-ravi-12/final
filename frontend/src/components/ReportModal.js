import React, { useState } from 'react';
import { reportService } from '../services/reportService';
import './ReportModal.css';

const REPORT_REASONS = [
  'Spam',
  'Harassment or bullying',
  'Inappropriate content',
  'Misinformation',
  'Hate speech',
  'Violence or threats',
  'Other',
];

const ReportModal = ({ isOpen, onClose, targetType, targetIds }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!reason) {
      setError('Please select or describe a reason for reporting');
      return;
    }

    setSubmitting(true);
    try {
      await reportService.submitReport(reason, targetIds);
      alert('Report submitted successfully! Thank you for helping keep our community safe.');
      setSelectedReason('');
      setCustomReason('');
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      const msg = err.response?.data || err.message || 'Failed to submit report';
      setError(typeof msg === 'string' ? msg : 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3>Report {targetType}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <p className="report-prompt">Why are you reporting this {targetType}?</p>
          <div className="reason-options">
            {REPORT_REASONS.map((reason) => (
              <label key={reason} className="reason-option">
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                />
                <span className="reason-text">{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Other' && (
            <textarea
              className="custom-reason-textarea"
              placeholder="Please describe the issue..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows="3"
              maxLength={500}
              required
            />
          )}

          <div className="report-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-danger" disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim()) || submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
