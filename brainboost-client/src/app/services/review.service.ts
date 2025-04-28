import api from './api';
import { ReviewResult } from '../store/slices/review.slice';

/**
 * Service to handle all review-related API calls
 */
const reviewService = {
  // Get cards due for review
  getDueCards: async (params?: {
    deckId?: string;
    limit?: number;
    includeNew?: boolean;
    newCardLimit?: number;
  }) => {
    const response = await api.get('/reviews/due', { params });
    return response.data.data;
  },

  // Submit a review result for a card
  submitReview: async (
    cardId: string,
    result: ReviewResult,
    sessionId?: string
  ) => {
    const response = await api.post('/reviews', {
      cardId,
      isCorrect: result.isCorrect,
      responseTime: result.responseTime,
      confidence: result.confidence,
      sessionId,
    });
    return response.data.data;
  },

  // Start a new review session
  startSession: async (params?: {
    deckId?: string;
    timeLimit?: number;
    cardLimit?: number;
  }) => {
    const response = await api.post('/reviews/sessions', params);
    return response.data.data;
  },

  // Get a review session by ID
  getSessionById: async (sessionId: string) => {
    const response = await api.get(`/reviews/sessions/${sessionId}`);
    return response.data.data;
  },

  // Get user study statistics
  getStudyStats: async (deckId?: string) => {
    const response = await api.get('/reviews/stats', {
      params: { deckId },
    });
    return response.data.data;
  },

  // Reset a card's learning progress
  resetCardProgress: async (cardId: string) => {
    const response = await api.post(`/reviews/reset/${cardId}`);
    return response.data.data;
  },

  // Get review history
  getReviewHistory: async (params?: {
    deckId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/reviews/history', { params });
    return response.data.data;
  },

  // Get study streak information
  getStreakInfo: async () => {
    const response = await api.get('/reviews/streak');
    return response.data.data;
  },
};

export default reviewService;
