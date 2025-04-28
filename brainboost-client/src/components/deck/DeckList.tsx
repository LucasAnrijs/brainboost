import React, { useState } from 'react';
import { FaPlus, FaFilter, FaSearch, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import DeckCard from './DeckCard';
import { Deck } from '../../app/store/slices/deck.slice';
import './DeckList.scss';

interface DeckListProps {
  decks: Deck[];
  onCreateDeck: () => void;
  onDeleteDeck: (deckId: string) => void;
  onEditDeck: (deck: Deck) => void;
  onCopyDeck: (deckId: string) => void;
  onArchiveDeck: (deckId: string, archived: boolean) => void;
  isLoading?: boolean;
  showCreateButton?: boolean;
}

const DeckList: React.FC<DeckListProps> = ({
  decks,
  onCreateDeck,
  onDeleteDeck,
  onEditDeck,
  onCopyDeck,
  onArchiveDeck,
  isLoading = false,
  showCreateButton = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    tags: [] as string[],
    showArchived: false,
    visibility: 'all' as 'all' | 'private' | 'shared' | 'public',
  });
  const [sortField, setSortField] = useState<'title' | 'updatedAt' | 'cardCount'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Function to extract all unique tags from decks
  const getAllTags = () => {
    const tagSet = new Set<string>();
    decks.forEach((deck) => {
      if (deck.tags) {
        deck.tags.forEach((tag) => tagSet.add(tag));
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

  // Filter decks based on search term and filters
  const filteredDecks = decks.filter((deck) => {
    // Search term filter
    const matchesSearch =
      !searchTerm ||
      deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deck.description &&
        deck.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Tags filter
    const matchesTags =
      filters.tags.length === 0 ||
      (deck.tags && filters.tags.every((tag) => deck.tags.includes(tag)));

    // Archived filter
    const matchesArchived = filters.showArchived || !deck.isArchived;

    // Visibility filter
    const matchesVisibility =
      filters.visibility === 'all' || deck.visibility === filters.visibility;

    return matchesSearch && matchesTags && matchesArchived && matchesVisibility;
  });

  // Sort filtered decks
  const sortedDecks = [...filteredDecks].sort((a, b) => {
    if (sortField === 'title') {
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'cardCount') {
      return sortOrder === 'asc'
        ? a.cardCount - b.cardCount
        : b.cardCount - a.cardCount;
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

  // Set sort field
  const handleSortChange = (field: 'title' | 'updatedAt' | 'cardCount') => {
    if (sortField === field) {
      toggleSortOrder();
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="deck-list-container">
      <div className="deck-list-header">
        <h2>Your Decks</h2>
        <div className="deck-list-actions">
          {showCreateButton && (
            <button className="create-deck-btn" onClick={onCreateDeck}>
              <FaPlus /> Create Deck
            </button>
          )}
        </div>
      </div>

      <div className="deck-list-toolbar">
        <div className="search-bar">
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search decks..."
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
              className={`sort-btn ${sortField === 'title' ? 'active' : ''}`}
              onClick={() => handleSortChange('title')}
            >
              Name
            </button>
            <button
              className={`sort-btn ${sortField === 'updatedAt' ? 'active' : ''}`}
              onClick={() => handleSortChange('updatedAt')}
            >
              Last Updated
            </button>
            <button
              className={`sort-btn ${sortField === 'cardCount' ? 'active' : ''}`}
              onClick={() => handleSortChange('cardCount')}
            >
              Cards
            </button>
          </div>
          <button className="sort-order-btn" onClick={toggleSortOrder}>
            {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
          </button>
        </div>
      </div>

      {filterVisible && (
        <div className="filter-panel">
          <div className="filter-section">
            <h3>Visibility</h3>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="visibility"
                  checked={filters.visibility === 'all'}
                  onChange={() =>
                    setFilters({ ...filters, visibility: 'all' })
                  }
                />
                <span>All</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="visibility"
                  checked={filters.visibility === 'private'}
                  onChange={() =>
                    setFilters({ ...filters, visibility: 'private' })
                  }
                />
                <span>Private</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="visibility"
                  checked={filters.visibility === 'shared'}
                  onChange={() =>
                    setFilters({ ...filters, visibility: 'shared' })
                  }
                />
                <span>Shared</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="visibility"
                  checked={filters.visibility === 'public'}
                  onChange={() =>
                    setFilters({ ...filters, visibility: 'public' })
                  }
                />
                <span>Public</span>
              </label>
            </div>
          </div>
          <div className="filter-section">
            <h3>Other Filters</h3>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.showArchived}
                  onChange={() =>
                    setFilters({
                      ...filters,
                      showArchived: !filters.showArchived,
                    })
                  }
                />
                <span>Show Archived Decks</span>
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
                  showArchived: false,
                  visibility: 'all',
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
          <p>Loading your decks...</p>
        </div>
      ) : sortedDecks.length > 0 ? (
        <div className="deck-grid">
          {sortedDecks.map((deck) => (
            <DeckCard
              key={deck._id}
              deck={deck}
              onDelete={onDeleteDeck}
              onEdit={onEditDeck}
              onCopy={onCopyDeck}
              onArchive={onArchiveDeck}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          {searchTerm || filters.tags.length > 0 || filters.visibility !== 'all' ? (
            <>
              <h3>No Decks Match Your Filters</h3>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              <button
                className="clear-search-btn"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    tags: [],
                    showArchived: false,
                    visibility: 'all',
                  });
                }}
              >
                Clear Search & Filters
              </button>
            </>
          ) : (
            <>
              <h3>No Decks Yet</h3>
              <p>Start by creating your first deck to begin studying.</p>
              <button className="create-deck-btn" onClick={onCreateDeck}>
                <FaPlus /> Create Deck
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DeckList;
