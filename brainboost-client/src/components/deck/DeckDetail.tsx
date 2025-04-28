import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBook, FaEdit, FaTrash, FaLock, FaGlobe, FaEye, FaArrowLeft, FaShare, FaArchive, FaStar, FaCaretDown, FaCaretUp } from 'react-icons/fa';
import { Deck } from '../../app/store/slices/deck.slice';
import { CardWithState } from '../../app/store/slices/card.slice';
import './DeckDetail.scss';

interface DeckDetailProps {
  deck: Deck;
  cards: CardWithState[];
  cardsByState: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
    mastered: number;
    suspended: number;
  };
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => Promise<void>;
  onArchiveDeck: (deckId: string, archived: boolean) => Promise<void>;
  onToggleVisibility: (deckId: string, visibility: 'private' | 'shared' | 'public') => Promise<void>;
  onStartStudy: () => void;
  onAddCards: () => void;
  isLoading: boolean;
  isOwner: boolean;
}

const DeckDetail: React.FC<DeckDetailProps> = ({
  deck,
  cards,
  cardsByState,
  onEditDeck,
  onDeleteDeck,
  onArchiveDeck,
  onToggleVisibility,
  onStartStudy,
  onAddCards,
  isLoading,
  isOwner,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  const getVisibilityIcon = () => {
    switch (deck.visibility) {
      case 'public':
        return <FaGlobe className="icon public" />;
      case 'shared':
        return <FaEye className="icon shared" />;
      default:
        return <FaLock className="icon private" />;
    }
  };

  const getVisibilityText = () => {
    switch (deck.visibility) {
      case 'public':
        return 'Public';
      case 'shared':
        return 'Shared';
      default:
        return 'Private';
    }
  };

  const handleDeleteDeck = async () => {
    if (window.confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      await onDeleteDeck(deck._id);
      navigate('/decks');
    }
  };

  const handleVisibilityChange = async (visibility: 'private' | 'shared' | 'public') => {
    await onToggleVisibility(deck._id, visibility);
    setShowSettings(false);
  };

  // Format dates
  const createdDate = new Date(deck.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  const updatedDate = new Date(deck.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Calculate learning progress
  const totalCards = deck.cardCount || 0;
  const masteredPercentage = totalCards > 0 ? Math.round((cardsByState.mastered / totalCards) * 100) : 0;

  return (
    <div className={`deck-detail ${deck.isArchived ? 'archived' : ''}`}>
      <div className="deck-detail-header">
        <div className="back-button">
          <Link to="/decks" className="back-link">
            <FaArrowLeft /> Back to Decks
          </Link>
        </div>
        {deck.isArchived && <div className="archived-badge">Archived</div>}
      </div>

      <div className="deck-hero">
        <div className="deck-cover">
          {deck.coverImage ? (
            <img src={deck.coverImage} alt={deck.name} />
          ) : (
            <div className="default-cover">
              <FaBook size={64} />
            </div>
          )}
        </div>
        <div className="deck-info">
          <h1 className="deck-title">{deck.name}</h1>
          <p className="deck-description">{deck.description || 'No description provided.'}</p>
          
          <div className="deck-meta">
            <div className="deck-status">
              <div className="status-item">
                <span className="status-label">Status:</span>
                <span className="status-value visibility">
                  {getVisibilityIcon()} {getVisibilityText()}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Created:</span>
                <span className="status-value">{createdDate}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Last updated:</span>
                <span className="status-value">{updatedDate}</span>
              </div>
            </div>
            
            {deck.tags && deck.tags.length > 0 && (
              <div className="deck-tags">
                {deck.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="deck-actions">
            <button
              className="study-btn"
              onClick={onStartStudy}
              disabled={totalCards === 0 || isLoading}
            >
              {totalCards > 0 ? 'Start Studying' : 'No Cards to Study'}
            </button>
            
            <button className="add-cards-btn" onClick={onAddCards}>
              Add Cards
            </button>
            
            {isOwner && (
              <div className="owner-actions">
                <button className="edit-btn" onClick={() => onEditDeck(deck)}>
                  <FaEdit /> Edit
                </button>
                
                <div className="settings-dropdown">
                  <button
                    className="settings-btn"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    More {showSettings ? <FaCaretUp /> : <FaCaretDown />}
                  </button>
                  
                  {showSettings && (
                    <div className="settings-menu">
                      <button onClick={() => handleVisibilityChange('private')}>
                        <FaLock /> Make Private
                      </button>
                      <button onClick={() => handleVisibilityChange('shared')}>
                        <FaEye /> Make Shared
                      </button>
                      <button onClick={() => handleVisibilityChange('public')}>
                        <FaGlobe /> Make Public
                      </button>
                      <button onClick={() => onArchiveDeck(deck._id, !deck.isArchived)}>
                        <FaArchive /> {deck.isArchived ? 'Unarchive' : 'Archive'}
                      </button>
                      <button className="delete-btn" onClick={handleDeleteDeck}>
                        <FaTrash /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="deck-stats">
        <div className="stats-header">
          <h2>Deck Statistics</h2>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{totalCards}</div>
            <div className="stat-label">Total Cards</div>
          </div>
          
          <div className="stat-card new">
            <div className="stat-value">{cardsByState.new}</div>
            <div className="stat-label">New</div>
          </div>
          
          <div className="stat-card learning">
            <div className="stat-value">{cardsByState.learning + cardsByState.relearning}</div>
            <div className="stat-label">Learning</div>
          </div>
          
          <div className="stat-card review">
            <div className="stat-value">{cardsByState.review}</div>
            <div className="stat-label">Review</div>
          </div>
          
          <div className="stat-card mastered">
            <div className="stat-value">{cardsByState.mastered}</div>
            <div className="stat-label">Mastered</div>
          </div>
        </div>
        
        <div className="progress-section">
          <h3>Learning Progress</h3>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${masteredPercentage}%` }}
            ></div>
            <span className="progress-text">{masteredPercentage}% Mastered</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading cards...</p>
        </div>
      ) : totalCards === 0 ? (
        <div className="empty-state">
          <h3>No Cards in This Deck</h3>
          <p>Start adding cards to begin studying.</p>
          <button className="add-cards-btn" onClick={onAddCards}>
            Add Cards
          </button>
        </div>
      ) : (
        <div className="cards-section">
          <div className="cards-header">
            <h2>Cards ({totalCards})</h2>
            <button className="add-cards-btn" onClick={onAddCards}>
              Add Cards
            </button>
          </div>
          
          <div className="cards-table-container">
            <table className="cards-table">
              <thead>
                <tr>
                  <th>Front</th>
                  <th>Back</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {cards.slice(0, 5).map((card) => (
                  <tr key={card._id} onClick={() => navigate(`/cards/${card._id}`)}>
                    <td>
                      {card.content.front.length > 100
                        ? `${card.content.front.substring(0, 100)}...`
                        : card.content.front}
                    </td>
                    <td>
                      {card.content.back.length > 100
                        ? `${card.content.back.substring(0, 100)}...`
                        : card.content.back}
                    </td>
                    <td>
                      <span className={`card-status ${card.state || 'new'}`}>
                        {card.state || 'New'}
                      </span>
                    </td>
                    <td>
                      {card.due
                        ? new Date(card.due).toLocaleDateString()
                        : 'Not scheduled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {cards.length > 5 && (
            <div className="view-all-cards">
              <Link to={`/decks/${deck._id}/cards`} className="view-all-link">
                View All Cards ({cards.length})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeckDetail;
