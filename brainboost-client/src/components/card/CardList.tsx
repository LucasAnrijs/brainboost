import React, { useState } from 'react';
import { 
  FaPlus, 
  FaFilter, 
  FaSearch, 
  FaSortAlphaDown, 
  FaSortAlphaUp, 
  FaEdit, 
  FaTrash, 
  FaCopy, 
  FaFlag, 
  FaEye, 
  FaEyeSlash,
  FaArrowRight,
  FaTag
} from 'react-icons/fa';
import { CardWithState } from '../../app/store/slices/card.slice';
import './CardList.scss';

interface CardListProps {
  cards: CardWithState[];
  onCreateCard: () => void;
  onEditCard: (card: CardWithState) => void;
  onDeleteCard: (cardId: string) => void;
  onCopyCard: (cardId: string) => void;
  onMarkCard: (cardId: string, marked: boolean) => void;
  onSuspendCard: (cardId: string, suspended: boolean) => void;
  onViewCard: (cardId: string) => void;
  isLoading?: boolean;
  showCreateButton?: boolean;
}

const CardList: React.FC<CardListProps> = ({
  cards,
  onCreateCard,
  onEditCard,
  onDeleteCard,
  onCopyCard,
  onMarkCard,
  onSuspendCard,
  onViewCard,
  isLoading = false,
  showCreateButton = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    tags: [] as string[],
    showSuspended: false,
    onlyMarked: false,
    cardType: 'all' as 'all' | 'standard' | 'cloze' | 'image_occlusion' | 'multiple_choice' | 'true_false',
  });
  const [sortField, setSortField] = useState<'position' | 'updatedAt'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Function to extract all unique tags from cards
  const getAllTags = () => {
    const tagSet = new Set<string>();
    cards.forEach((card) => {
      if (card.tags) {
        card.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  };

  // Handle tag filter toggle
  const toggleTagFilter = (tag: string) => {
    setFilters((prevFilters) => {
      if (prevFilters.tags.includes(tag)) {
        return {
          ...prevFilters,
          tags: prevFilters.tags.filter((t) => t !== tag),
        };
      } else {
        return {
          ...prevFilters,
          tags: [...prevFilters.tags, tag],
        };
      }
    });
  };

  // Filter cards based on search term and filters
  const filteredCards = cards.filter((card) => {
    // Search term filter (search in front and back content)
    const frontText = card.content?.front?.text || '';
    const backText = card.content?.back?.text || '';
    
    const matchesSearch =
      !searchTerm ||
      frontText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      backText.toLowerCase().includes(searchTerm.toLowerCase());

    // Tags filter
    const matchesTags =
      filters.tags.length === 0 ||
      (card.tags && filters.tags.every((tag) => card.tags.includes(tag)));

    // Suspended filter
    const matchesSuspended = filters.showSuspended || !(card.flags?.isSuspended);

    // Marked filter
    const matchesMarked = !filters.onlyMarked || card.flags?.isMarked;

    // Card type filter
    const matchesCardType =
      filters.cardType === 'all' || card.type === filters.cardType;

    return matchesSearch && matchesTags && matchesSuspended && matchesMarked && matchesCardType;
  });

  // Sort filtered cards
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortField === 'position') {
      return sortOrder === 'asc'
        ? (a.position || 0) - (b.position || 0)
        : (b.position || 0) - (a.position || 0);
    } else {
      // Default sort by updatedAt
      return sortOrder === 'asc'
        ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Truncate text for display
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="card-list-container">
      <div className="card-list-header">
        <h2>Flashcards</h2>
        <div className="card-list-actions">
          {showCreateButton && (
            <button className="create-card-btn" onClick={onCreateCard}>
              <FaPlus /> Add Card
            </button>
          )}
        </div>
      </div>

      <div className="card-list-toolbar">
        <div className="search-bar">
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button
            className={`filter-btn ${filterVisible ? 'active' : ''}`}
            onClick={() => setFilterVisible(!filterVisible)}
          >
            <FaFilter /> Filters
          </button>
        </div>

        <div className="sort-options">
          <div className="sort-label">Sort by:</div>
          <div className="sort-buttons">
            <button
              className={`sort-btn ${sortField === 'position' ? 'active' : ''}`}
              onClick={() => setSortField('position')}
            >
              Position
            </button>
            <button
              className={`sort-btn ${sortField === 'updatedAt' ? 'active' : ''}`}
              onClick={() => setSortField('updatedAt')}
            >
              Last Updated
            </button>
          </div>
          <button className="sort-order-btn" onClick={toggleSortOrder}>
            {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
          </button>
        </div>
      </div>

      {filterVisible && (
        <div className="filter-panel">
          <div className="filter-section">
            <h3>Card Status</h3>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.showSuspended}
                  onChange={() =>
                    setFilters({
                      ...filters,
                      showSuspended: !filters.showSuspended,
                    })
                  }
                />
                <span>Show Suspended Cards</span>
              </label>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.onlyMarked}
                  onChange={() =>
                    setFilters({
                      ...filters,
                      onlyMarked: !filters.onlyMarked,
                    })
                  }
                />
                <span>Only Show Marked Cards</span>
              </label>
            </div>
          </div>
          
          <div className="filter-section">
            <h3>Card Type</h3>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="cardType"
                  checked={filters.cardType === 'all'}
                  onChange={() =>
                    setFilters({ ...filters, cardType: 'all' })
                  }
                />
                <span>All Types</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="cardType"
                  checked={filters.cardType === 'standard'}
                  onChange={() =>
                    setFilters({ ...filters, cardType: 'standard' })
                  }
                />
                <span>Standard</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="cardType"
                  checked={filters.cardType === 'cloze'}
                  onChange={() =>
                    setFilters({ ...filters, cardType: 'cloze' })
                  }
                />
                <span>Cloze</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="cardType"
                  checked={filters.cardType === 'image_occlusion'}
                  onChange={() =>
                    setFilters({ ...filters, cardType: 'image_occlusion' })
                  }
                />
                <span>Image Occlusion</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="cardType"
                  checked={filters.cardType === 'multiple_choice'}
                  onChange={() =>
                    setFilters({ ...filters, cardType: 'multiple_choice' })
                  }
                />
                <span>Multiple Choice</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="cardType"
                  checked={filters.cardType === 'true_false'}
                  onChange={() =>
                    setFilters({ ...filters, cardType: 'true_false' })
                  }
                />
                <span>True/False</span>
              </label>
            </div>
          </div>
          
          {getAllTags().length > 0 && (
            <div className="filter-section">
              <h3>Tags</h3>
              <div className="tag-filters">
                {getAllTags().map((tag) => (
                  <label
                    key={tag}
                    className={`tag-filter ${
                      filters.tags.includes(tag) ? 'selected' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag)}
                      onChange={() => toggleTagFilter(tag)}
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div className="filter-actions">
            <button
              className="clear-filters-btn"
              onClick={() =>
                setFilters({
                  tags: [],
                  showSuspended: false,
                  onlyMarked: false,
                  cardType: 'all',
                })
              }
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading cards...</p>
        </div>
      ) : sortedCards.length > 0 ? (
        <div className="cards-table-container">
          <table className="cards-table">
            <thead>
              <tr>
                <th className="front-column">Front</th>
                <th className="back-column">Back</th>
                <th className="tags-column">Tags</th>
                <th className="status-column">Status</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCards.map((card) => (
                <tr 
                  key={card._id} 
                  className={`${card.flags?.isSuspended ? 'suspended' : ''} ${
                    card.flags?.isMarked ? 'marked' : ''
                  }`}
                >
                  <td 
                    className="front-column"
                    onClick={() => onViewCard(card._id)}
                  >
                    {truncateText(card.content?.front?.text || '', 100)}
                  </td>
                  <td 
                    className="back-column"
                    onClick={() => onViewCard(card._id)}
                  >
                    {truncateText(card.content?.back?.text || '', 100)}
                  </td>
                  <td className="tags-column">
                    {card.tags && card.tags.length > 0 ? (
                      <div className="tag-list">
                        {card.tags.map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-tags">No tags</span>
                    )}
                  </td>
                  <td className="status-column">
                    <div className="card-status">
                      <span className={`status-badge ${card.state || 'new'}`}>
                        {card.state || 'New'}
                      </span>
                      {card.flags?.isMarked && (
                        <span className="status-icon marked" title="Marked">
                          <FaFlag />
                        </span>
                      )}
                      {card.flags?.isSuspended && (
                        <span className="status-icon suspended" title="Suspended">
                          <FaEyeSlash />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="actions-column">
                    <div className="card-actions">
                      <button
                        className="action-btn view"
                        onClick={() => onViewCard(card._id)}
                        title="View Card"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => onEditCard(card)}
                        title="Edit Card"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this card?')) {
                            onDeleteCard(card._id);
                          }
                        }}
                        title="Delete Card"
                      >
                        <FaTrash />
                      </button>
                      <button
                        className="action-btn copy"
                        onClick={() => onCopyCard(card._id)}
                        title="Clone Card"
                      >
                        <FaCopy />
                      </button>
                      <button
                        className={`action-btn ${card.flags?.isMarked ? 'marked' : 'mark'}`}
                        onClick={() => onMarkCard(card._id, !card.flags?.isMarked)}
                        title={card.flags?.isMarked ? 'Unmark Card' : 'Mark Card'}
                      >
                        <FaFlag />
                      </button>
                      <button
                        className={`action-btn ${card.flags?.isSuspended ? 'suspended' : 'suspend'}`}
                        onClick={() => onSuspendCard(card._id, !card.flags?.isSuspended)}
                        title={card.flags?.isSuspended ? 'Unsuspend Card' : 'Suspend Card'}
                      >
                        {card.flags?.isSuspended ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          {searchTerm || filters.tags.length > 0 || filters.onlyMarked || 
          filters.cardType !== 'all' ? (
            <>
              <h3>No Cards Match Your Filters</h3>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              <button
                className="clear-search-btn"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    tags: [],
                    showSuspended: false,
                    onlyMarked: false,
                    cardType: 'all',
                  });
                }}
              >
                Clear Search & Filters
              </button>
            </>
          ) : (
            <>
              <h3>No Cards Yet</h3>
              <p>Start by adding your first flashcard to begin studying.</p>
              <button className="create-card-btn" onClick={onCreateCard}>
                <FaPlus /> Add Card
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CardList;
