import api from './api';
import { CardContent } from '../store/slices/card.slice';

/**
 * Service to handle all card-related API calls
 */
const cardService = {
  // Get all cards for a deck
  getCards: async (deckId: string) => {
    const response = await api.get(`/cards/${deckId}`);
    return response.data.data;
  },

  // Get a specific card by ID
  getCardById: async (cardId: string) => {
    const response = await api.get(`/cards/card/${cardId}`);
    return response.data.data;
  },

  // Create a new card in a deck
  createCard: async (deckId: string, cardData: CardContent) => {
    const response = await api.post(`/cards/${deckId}`, cardData);
    return response.data.data;
  },

  // Update an existing card
  updateCard: async (cardId: string, cardData: Partial<CardContent>) => {
    const response = await api.put(`/cards/${cardId}`, cardData);
    return response.data.data;
  },

  // Delete a card
  deleteCard: async (cardId: string) => {
    await api.delete(`/cards/${cardId}`);
    return cardId;
  },

  // Create multiple cards at once
  bulkCreateCards: async (deckId: string, cardsData: CardContent[]) => {
    const response = await api.post(`/cards/${deckId}/bulk`, { cards: cardsData });
    return response.data.data;
  },

  // Import cards from a file
  importCards: async (deckId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/cards/${deckId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Generate cards using AI
  generateCards: async (deckId: string, content: string) => {
    const response = await api.post(`/ai/generate`, { 
      deckId, 
      content 
    });
    return response.data.data;
  },

  // Export cards in specific format
  exportCards: async (deckId: string, format: 'csv' | 'anki' | 'pdf' | 'json') => {
    const response = await api.get(`/cards/${deckId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};

export default cardService;
