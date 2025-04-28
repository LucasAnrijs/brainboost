import React, { useState } from 'react';
import { FaEdit, FaTrash, FaCopy, FaFlag, FaEyeSlash, FaEye, FaArrowLeft, FaTag } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { CardWithState } from '../../app/store/slices/card.slice';
import './CardView.scss';

interface CardViewProps {
  card: CardWithState;
  deckName: string;
  deckId: string;
  onEditCard: () => void;
  onDeleteCard: () => void;
  onCopyCard: () => void;
  onMarkCard: (marked: boolean) => void;
  onSuspendCard: (suspended: boolean) => void;
  onBack: () => void;
  isOwner: boolean;
}

const CardView: React.FC<CardViewProps> = ({
  card,
  deckName,
  deckId,
  onEditCard,
  onDeleteCard,
  onCopyCard,
  onMarkCard,
  onSuspendCard,
  onBack,
  isOwner,
}) => {
  const [showBack, setShowBack] = useState(false);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get learning status label
  const getLearningStatus = () => {
    if (!card.state || card.state === 'new') {
      return 'New';
    }
    
    if (card.state === 'learning' || card.state === 'relearning') {
      return 'Learning';
    }
    
    if (card.state === 'review') {
      return 'Reviewing';
    }
    
    if (card.state === 'mastered') {
      return 'Mastered';
    }
    
    return 'Unknown';
  };

  // Get next review date
  const getNextReviewDate = () => {
    if (!card.due) {
      return 'Not scheduled';
    }
    
    const dueDate = new Date(card.due);
    const today = new Date();
    
    // If due today
    if (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }
    
    // If due tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (
      dueDate.getDate() === tomorrow.getDate() &&
      dueDate.getMonth() === tomorrow.getMonth() &&
      dueDate.getFullYear() === tomorrow.getFullYear()
    ) {
      return 'Tomorrow';
    }
    
    // If due date is in the past
    if (dueDate < today) {
      return 'Overdue - ' + formatDate(card.due);
    }
    
    // Otherwise, return the formatted date
    return formatDate(card.due);
  };

  return (
    <div className="card-view">
      <div className="card-view-header">
        <button className="back-button" onClick={onBack}>
          <FaArrowLeft /> Back to cards
        </button>
        
        <div className="deck-info">
          <Link to={`/decks/${deckId}`} className="deck-link">
            Deck: {deckName}
          </Link>
        </div>
        
        <div className="card-actions">
          {isOwner && (
            <>
              <button className="action-btn edit" onClick={onEditCard} title="Edit Card">
                <FaEdit /> Edit
              </button>
              <button className="action-btn delete" onClick={onDeleteCard} title="Delete Card">
                <FaTrash /> Delete
              </button>
            </>
          )}
          <button className="action-btn copy" onClick={onCopyCard} title="Copy Card">
            <FaCopy /> Copy
          </button>
          <button
            className={`action-btn ${card.flags?.isMarked ? 'marked' : 'mark'}`}
            onClick={() => onMarkCard(!card.flags?.isMarked)}
            title={card.flags?.isMarked ? 'Unmark Card' : 'Mark Card'}
          >
            <FaFlag /> {card.flags?.isMarked ? 'Marked' : 'Mark'}
          </button>
          <button
            className={`action-btn ${card.flags?.isSuspended ? 'suspended' : 'suspend'}`}
            onClick={() => onSuspendCard(!card.flags?.isSuspended)}
            title={card.flags?.isSuspended ? 'Unsuspend Card' : 'Suspend Card'}
          >
            {card.flags?.isSuspended ? <FaEye /> : <FaEyeSlash />}
            {card.flags?.isSuspended ? 'Unsuspend' : 'Suspend'}
          </button>
        </div>
      </div>

      <div className="card-container">
        <div className={`flashcard ${showBack ? 'flipped' : ''}`}>
          <div className="card-side front">
            <div className="card-content">
              {card.content?.front?.text}
            </div>
          </div>
          <div className="card-side back">
            <div className="card-content">
              {card.content?.back?.text}
            </div>
          </div>
        </div>
        
        <button 
          className="flip-button" 
          onClick={() => setShowBack(!showBack)}
        >
          {showBack ? 'Show Front' : 'Show Back'}
        </button>
      </div>
      
      <div className="card-metadata">
        <div className="metadata-section">
          <h3>Card Details</h3>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="label">Created:</span>
              <span className="value">{formatDate(card.createdAt)}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Updated:</span>
              <span className="value">{formatDate(card.updatedAt)}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Type:</span>
              <span className="value">{card.type || 'Standard'}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Status:</span>
              <span className="value">
                <span className={`status-badge ${card.state || 'new'}`}>
                  {getLearningStatus()}
                </span>
                {card.flags?.isMarked && (
                  <span className="status-extra marked">Marked</span>
                )}
                {card.flags?.isSuspended && (
                  <span className="status-extra suspended">Suspended</span>
                )}
              </span>
            </div>
            <div className="metadata-item">
              <span className="label">Next Review:</span>
              <span className="value">{getNextReviewDate()}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Interval:</span>
              <span className="value">
                {card.interval ? `${card.interval} days` : 'Not set'}
              </span>
            </div>
          </div>
        </div>
        
        {card.tags && card.tags.length > 0 && (
          <div className="metadata-section">
            <h3>Tags</h3>
            <div className="tags-container">
              {card.tags.map((tag) => (
                <div key={tag} className="tag">
                  <FaTag />
                  {tag}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {card.notes && (
          <div className="metadata-section">
            <h3>Notes</h3>
            <div className="notes-content">
              {card.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardView;
