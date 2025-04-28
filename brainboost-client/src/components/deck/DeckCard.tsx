import React from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaLock, FaGlobe, FaEye, FaPen, FaTrash, FaCopy, FaArchive } from 'react-icons/fa';
import { Deck } from '../../app/store/slices/deck.slice';
import './DeckCard.scss';

interface DeckCardProps {
  deck: Deck;
  onDelete?: (deckId: string) => void;
  onEdit?: (deck: Deck) => void;
  onCopy?: (deckId: string) => void;
  onArchive?: (deckId: string, archived: boolean) => void;
  showActions?: boolean;
}

const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  onDelete,
  onEdit,
  onCopy,
  onArchive,
  showActions = true,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      if (window.confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
        onDelete(deck._id);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(deck);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCopy) {
      onCopy(deck._id);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onArchive) {
      onArchive(deck._id, !deck.isArchived);
    }
  };

  // Format the updated date
  const formattedDate = new Date(deck.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Determine visibility icon
  const getVisibilityIcon = () => {
    switch (deck.visibility) {
      case 'public':
        return <FaGlobe className="visibility-icon public" title="Public" />;
      case 'shared':
        return <FaEye className="visibility-icon shared" title="Shared" />;
      default:
        return <FaLock className="visibility-icon private" title="Private" />;
    }
  };

  return (
    <Link to={`/decks/${deck._id}`} className={`deck-card ${deck.isArchived ? 'archived' : ''}`}>
      <div className="deck-card-cover">
        {deck.coverImage ? (
          <img src={deck.coverImage} alt={deck.name} />
        ) : (
          <div className="default-cover">
            <FaBook size={48} />
          </div>
        )}
        {getVisibilityIcon()}
        {deck.isArchived && <div className="archived-badge">Archived</div>}
      </div>
      <div className="deck-card-content">
        <h3 className="deck-title">{deck.name}</h3>
        <p className="deck-description">
          {deck.description
            ? deck.description.length > 100
              ? `${deck.description.substring(0, 100)}...`
              : deck.description
            : 'No description available.'}
        </p>
        <div className="deck-meta">
          <span className="card-count">
            <FaBook size={12} /> {deck.cardCount} cards
          </span>
          <span className="updated-date">Updated: {formattedDate}</span>
        </div>
        {deck.tags && deck.tags.length > 0 && (
          <div className="deck-tags">
            {deck.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
            {deck.tags.length > 3 && (
              <span className="tag more">+{deck.tags.length - 3}</span>
            )}
          </div>
        )}
        {showActions && (
          <div className="deck-actions">
            <button
              className="action-btn edit"
              onClick={handleEdit}
              title="Edit deck"
            >
              <FaPen />
            </button>
            <button
              className="action-btn delete"
              onClick={handleDelete}
              title="Delete deck"
            >
              <FaTrash />
            </button>
            <button
              className="action-btn copy"
              onClick={handleCopy}
              title="Copy deck"
            >
              <FaCopy />
            </button>
            <button
              className="action-btn archive"
              onClick={handleArchive}
              title={deck.isArchived ? 'Unarchive deck' : 'Archive deck'}
            >
              <FaArchive />
            </button>
          </div>
        )}
      </div>
    </Link>
  );
};

export default DeckCard;
