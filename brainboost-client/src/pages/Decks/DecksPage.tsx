import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { 
  fetchDecks, 
  createDeck, 
  updateDeck,
  deleteDeck, 
  shareToggleDeck,
  selectDecks, 
  selectDeckLoading, 
  selectDeckError, 
  Deck 
} from '../../app/store/slices/deck.slice';
import { DeckList, DeckForm } from '../../components/deck';
import { Modal } from '../../components/common';
import './DecksPage.scss';

const DecksPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const decks = useAppSelector(selectDecks);
  const isLoading = useAppSelector(selectDeckLoading);
  const error = useAppSelector(selectDeckError);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);

  useEffect(() => {
    dispatch(fetchDecks());
  }, [dispatch]);

  const handleCreateDeck = (deckData: any) => {
    dispatch(createDeck(deckData))
      .unwrap()
      .then((deck) => {
        setShowCreateModal(false);
        navigate(`/decks/${deck._id}`);
      })
      .catch((err) => {
        console.error('Failed to create deck:', err);
      });
  };

  const handleUpdateDeck = (deckData: any) => {
    if (currentDeck) {
      dispatch(updateDeck({ deckId: currentDeck._id, deckData }))
        .unwrap()
        .then(() => {
          setShowEditModal(false);
          setCurrentDeck(null);
        })
        .catch((err) => {
          console.error('Failed to update deck:', err);
        });
    }
  };

  const handleDeleteDeck = (deckId: string) => {
    return dispatch(deleteDeck(deckId))
      .unwrap()
      .catch((err) => {
        console.error('Failed to delete deck:', err);
      });
  };

  const handleEditDeck = (deck: Deck) => {
    setCurrentDeck(deck);
    setShowEditModal(true);
  };

  const handleCopyDeck = (deckId: string) => {
    // TODO: Implement copy deck functionality
    console.log('Copy deck:', deckId);
  };

  const handleArchiveDeck = (deckId: string, archived: boolean) => {
    dispatch(updateDeck({ 
      deckId, 
      deckData: { isArchived: archived }
    }))
      .unwrap()
      .catch((err) => {
        console.error('Failed to archive/unarchive deck:', err);
      });
  };

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Decks</h2>
        <p>{error}</p>
        <button onClick={() => dispatch(fetchDecks())}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="decks-page">
      <DeckList
        decks={decks}
        isLoading={isLoading}
        onCreateDeck={() => setShowCreateModal(true)}
        onDeleteDeck={handleDeleteDeck}
        onEditDeck={handleEditDeck}
        onCopyDeck={handleCopyDeck}
        onArchiveDeck={handleArchiveDeck}
      />

      {/* Create Deck Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Deck"
        size="large"
      >
        <DeckForm
          onSubmit={handleCreateDeck}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Deck Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setCurrentDeck(null);
        }}
        title="Edit Deck"
        size="large"
      >
        {currentDeck && (
          <DeckForm
            initialValues={currentDeck}
            onSubmit={handleUpdateDeck}
            onCancel={() => {
              setShowEditModal(false);
              setCurrentDeck(null);
            }}
            isEditing={true}
          />
        )}
      </Modal>
    </div>
  );
};

export default DecksPage;
