import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { 
  fetchDeckById, 
  updateDeck, 
  deleteDeck, 
  shareToggleDeck,
  selectCurrentDeck, 
  selectDeckLoading, 
  selectDeckError, 
  Deck 
} from '../../app/store/slices/deck.slice';
import { 
  fetchCards, 
  selectCardsByDeck, 
  selectCardLoading 
} from '../../app/store/slices/card.slice';
import { DeckDetail, DeckForm } from '../../components/deck';
import { Modal } from '../../components/common';
import './DeckDetailPage.scss';

const DeckDetailPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const deck = useAppSelector(selectCurrentDeck);
  const deckLoading = useAppSelector(selectDeckLoading);
  const deckError = useAppSelector(selectDeckError);
  const cards = useAppSelector(deckId ? selectCardsByDeck(deckId) : () => []);
  const cardsLoading = useAppSelector(selectCardLoading);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  // Calculate cards by state
  const cardsByState = {
    new: cards.filter(card => !card.state || card.state === 'new').length,
    learning: cards.filter(card => card.state === 'learning').length,
    review: cards.filter(card => card.state === 'review').length,
    relearning: cards.filter(card => card.state === 'relearning').length,
    mastered: cards.filter(card => card.state === 'mastered').length,
    suspended: cards.filter(card => card.state === 'suspended').length,
  };

  useEffect(() => {
    if (deckId) {
      dispatch(fetchDeckById(deckId));
      dispatch(fetchCards(deckId));
    }
  }, [dispatch, deckId]);

  // Check if user is the owner when deck data loads
  useEffect(() => {
    if (deck) {
      // In a real app, you would compare with the current user ID
      // For now, we'll assume the user is the owner
      setIsOwner(true);
    }
  }, [deck]);

  const handleUpdateDeck = (deckData: any) => {
    if (deckId) {
      dispatch(updateDeck({ deckId, deckData }))
        .unwrap()
        .then(() => {
          setShowEditModal(false);
        })
        .catch((err) => {
          console.error('Failed to update deck:', err);
        });
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    try {
      await dispatch(deleteDeck(deckId)).unwrap();
      navigate('/decks');
    } catch (err) {
      console.error('Failed to delete deck:', err);
    }
  };

  const handleArchiveDeck = async (deckId: string, archived: boolean) => {
    try {
      await dispatch(updateDeck({ 
        deckId, 
        deckData: { isArchived: archived }
      })).unwrap();
    } catch (err) {
      console.error('Failed to archive/unarchive deck:', err);
    }
  };

  const handleToggleVisibility = async (deckId: string, visibility: 'private' | 'shared' | 'public') => {
    try {
      await dispatch(updateDeck({ 
        deckId, 
        deckData: { visibility }
      })).unwrap();
    } catch (err) {
      console.error('Failed to change visibility:', err);
    }
  };

  const handleStartStudy = () => {
    navigate(`/study/${deckId}`);
  };

  const handleAddCards = () => {
    navigate(`/decks/${deckId}/cards/new`);
  };

  if (deckError) {
    return (
      <div className="error-container">
        <h2>Error Loading Deck</h2>
        <p>{deckError}</p>
        <button onClick={() => dispatch(fetchDeckById(deckId!))}>Try Again</button>
        <button onClick={() => navigate('/decks')} className="back-btn">
          Back to Decks
        </button>
      </div>
    );
  }

  if (deckLoading || !deck) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading deck...</p>
      </div>
    );
  }

  return (
    <div className="deck-detail-page">
      <DeckDetail
        deck={deck}
        cards={cards}
        cardsByState={cardsByState}
        onEditDeck={() => setShowEditModal(true)}
        onDeleteDeck={handleDeleteDeck}
        onArchiveDeck={handleArchiveDeck}
        onToggleVisibility={handleToggleVisibility}
        onStartStudy={handleStartStudy}
        onAddCards={handleAddCards}
        isLoading={cardsLoading}
        isOwner={isOwner}
      />

      {/* Edit Deck Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Deck"
        size="large"
      >
        <DeckForm
          initialValues={deck}
          onSubmit={handleUpdateDeck}
          onCancel={() => setShowEditModal(false)}
          isEditing={true}
        />
      </Modal>
    </div>
  );
};

export default DeckDetailPage;
