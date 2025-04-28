import api from './api';
import { Deck } from '../store/slices/deck.slice';

/**
 * Service to handle all deck-related API calls
 */
const deckService = {
  // Get all decks for the current user
  getDecks: async () => {
    const response = await api.get('/decks');
    return response.data.data;
  },

  // Get a specific deck by ID
  getDeckById: async (deckId: string) => {
    const response = await api.get(`/decks/${deckId}`);
    return response.data.data;
  },

  // Create a new deck
  createDeck: async (deckData: Omit<Deck, '_id' | 'owner' | 'cardCount' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post('/decks', deckData);
    return response.data.data;
  },

  // Update an existing deck
  updateDeck: async (deckId: string, deckData: Partial<Omit<Deck, '_id' | 'owner' | 'cardCount' | 'createdAt' | 'updatedAt'>>) => {
    const response = await api.put(`/decks/${deckId}`, deckData);
    return response.data.data;
  },

  // Delete a deck
  deleteDeck: async (deckId: string) => {
    await api.delete(`/decks/${deckId}`);
    return deckId;
  },

  // Toggle sharing status of a deck
  toggleShare: async (deckId: string, isPublic: boolean) => {
    const response = await api.put(`/decks/${deckId}/share`, { isPublic });
    return response.data.data;
  },

  // Get public decks
  getPublicDecks: async (params?: {
    page?: number;
    limit?: number;
    query?: string;
    tags?: string[];
  }) => {
    const response = await api.get('/decks/public', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        q: params?.query || '',
        tags: params?.tags?.join(',') || '',
      },
    });
    return response.data.data;
  },

  // Search decks
  searchDecks: async (query: string) => {
    const response = await api.get(`/decks/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  },

  // Copy a public deck to user's collection
  copyDeck: async (deckId: string, newName?: string) => {
    const response = await api.post(`/decks/${deckId}/copy`, { name: newName });
    return response.data.data;
  },
};

export default deckService;
