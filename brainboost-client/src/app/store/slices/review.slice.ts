import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import api from '../../services/api';
import { CardWithState, updateCardState } from './card.slice';

// Types
export interface ReviewResult {
  isCorrect: boolean;
  responseTime: number;
  confidence?: number;
}

export interface SessionStats {
  totalCards: number;
  completedCards: number;
  correctCards: number;
  accuracy: number;
  averageResponseTime: number;
  completionPercentage: number;
}

export interface ReviewSession {
  _id: string;
  userId: string;
  deckId: string;
  startTime: string;
  endTime: string | null;
  totalCards: number;
  completedCards: number;
  correctCards: number;
  cards: {
    cardId: string;
    reviewed: boolean;
    result: boolean | null;
    responseTime: number | null;
  }[];
}

interface StudyStats {
  totalCards: number;
  cardsByState: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
    mastered: number;
    suspended: number;
  };
  reviewStats: {
    totalReviews: number;
    correctReviews: number;
    averageResponseTime: number;
    retentionRate: number;
    reviewsLast7Days: number;
    reviewsLast30Days: number;
  };
  streakStats: {
    currentStreak: number;
    longestStreak: number;
  };
}

export interface ReviewState {
  dueCards: CardWithState[];
  currentSession: ReviewSession | null;
  activeCard: CardWithState | null;
  stats: StudyStats | null;
  sessionStats: SessionStats | null;
  reviewHistory: ReviewSession[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: ReviewState = {
  dueCards: [],
  currentSession: null,
  activeCard: null,
  stats: null,
  sessionStats: null,
  reviewHistory: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchDueCards = createAsyncThunk(
  'review/fetchDueCards',
  async (
    { deckId, limit = 20, includeNew = true }: { deckId?: string; limit?: number; includeNew?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/reviews/due', {
        params: { deckId, limit, includeNew },
      });
      return response.data.data.cards;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch due cards');
    }
  }
);

export const startReviewSession = createAsyncThunk(
  'review/startSession',
  async (
    { deckId, timeLimit, cardLimit }: { deckId?: string; timeLimit?: number; cardLimit?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/reviews/sessions', {
        deckId,
        timeLimit,
        cardLimit,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start review session');
    }
  }
);

export const getSessionById = createAsyncThunk(
  'review/getSessionById',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/sessions/${sessionId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get session');
    }
  }
);

export const submitReview = createAsyncThunk(
  'review/submitReview',
  async (
    {
      cardId,
      result,
      sessionId,
    }: {
      cardId: string;
      result: ReviewResult;
      sessionId?: string;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await api.post('/reviews', {
        cardId,
        isCorrect: result.isCorrect,
        responseTime: result.responseTime,
        confidence: result.confidence,
        sessionId,
      });

      // Update the card state in the cards slice
      dispatch(
        updateCardState({
          cardId,
          updatedState: {
            state: response.data.data.state,
            interval: response.data.data.interval,
            due: response.data.data.due,
            factor: response.data.data.factor,
            streak: response.data.data.streak,
            lapses: response.data.data.lapses,
          },
        })
      );

      return {
        review: response.data.data,
        result,
        cardId,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit review');
    }
  }
);

export const resetCardProgress = createAsyncThunk(
  'review/resetCardProgress',
  async (cardId: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post(`/reviews/reset/${cardId}`);

      // Update the card state in the cards slice
      dispatch(
        updateCardState({
          cardId,
          updatedState: {
            state: 'new',
            interval: 0,
            due: new Date().toISOString(),
            factor: 2.5, // Default ease factor
            streak: 0,
            lapses: 0,
          },
        })
      );

      return {
        cardId,
        newState: response.data.data,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset card progress');
    }
  }
);

export const getStudyStats = createAsyncThunk(
  'review/getStudyStats',
  async (deckId?: string, { rejectWithValue }) => {
    try {
      const response = await api.get('/reviews/stats', {
        params: { deckId },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get study statistics');
    }
  }
);

// Slice
const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    clearReviewError(state) {
      state.error = null;
    },
    setActiveCard(state, action: PayloadAction<CardWithState | null>) {
      state.activeCard = action.payload;
    },
    clearActiveCard(state) {
      state.activeCard = null;
    },
    endSession(state) {
      state.currentSession = null;
      state.activeCard = null;
      state.dueCards = [];
    },
    updateSessionStats(state, action: PayloadAction<Partial<SessionStats>>) {
      if (state.sessionStats) {
        state.sessionStats = { ...state.sessionStats, ...action.payload };
      } else {
        state.sessionStats = action.payload as SessionStats;
      }
    },
    resetReviewState(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch due cards
      .addCase(fetchDueCards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDueCards.fulfilled, (state, action: PayloadAction<CardWithState[]>) => {
        state.isLoading = false;
        state.dueCards = action.payload;
        
        // Set the first card as the active card if there are cards and no active card
        if (action.payload.length > 0 && !state.activeCard) {
          state.activeCard = action.payload[0];
        }
      })
      .addCase(fetchDueCards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Start review session
      .addCase(startReviewSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startReviewSession.fulfilled, (state, action: PayloadAction<ReviewSession>) => {
        state.isLoading = false;
        state.currentSession = action.payload;
        
        // Initialize session stats
        state.sessionStats = {
          totalCards: action.payload.totalCards,
          completedCards: action.payload.completedCards,
          correctCards: action.payload.correctCards,
          accuracy: action.payload.correctCards / (action.payload.completedCards || 1),
          averageResponseTime: 0, // This will be calculated as reviews are submitted
          completionPercentage: (action.payload.completedCards / action.payload.totalCards) * 100,
        };
      })
      .addCase(startReviewSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get session by ID
      .addCase(getSessionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSessionById.fulfilled, (state, action: PayloadAction<ReviewSession>) => {
        state.isLoading = false;
        state.currentSession = action.payload;
        
        // Update session stats
        state.sessionStats = {
          totalCards: action.payload.totalCards,
          completedCards: action.payload.completedCards,
          correctCards: action.payload.correctCards,
          accuracy: action.payload.correctCards / (action.payload.completedCards || 1),
          averageResponseTime: 0, // This would be calculated from the full data
          completionPercentage: (action.payload.completedCards / action.payload.totalCards) * 100,
        };
      })
      .addCase(getSessionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Submit review
      .addCase(submitReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state, action: PayloadAction<{
        review: any;
        result: ReviewResult;
        cardId: string;
      }>) => {
        state.isLoading = false;
        
        // Update the current session if it exists
        if (state.currentSession) {
          const { cardId, result } = action.payload;
          
          // Find the card in the session
          const cardIndex = state.currentSession.cards.findIndex(c => c.cardId === cardId);
          
          if (cardIndex !== -1) {
            // Update the card in the session
            state.currentSession.cards[cardIndex] = {
              ...state.currentSession.cards[cardIndex],
              reviewed: true,
              result: result.isCorrect,
              responseTime: result.responseTime,
            };
          }
          
          // Update session counters
          state.currentSession.completedCards += 1;
          if (result.isCorrect) {
            state.currentSession.correctCards += 1;
          }
          
          // Update session stats
          if (state.sessionStats) {
            const totalResponseTime = (state.sessionStats.averageResponseTime * state.sessionStats.completedCards) + result.responseTime;
            const newCompletedCards = state.sessionStats.completedCards + 1;
            
            state.sessionStats = {
              ...state.sessionStats,
              completedCards: newCompletedCards,
              correctCards: result.isCorrect ? state.sessionStats.correctCards + 1 : state.sessionStats.correctCards,
              accuracy: (result.isCorrect ? state.sessionStats.correctCards + 1 : state.sessionStats.correctCards) / newCompletedCards,
              averageResponseTime: totalResponseTime / newCompletedCards,
              completionPercentage: (newCompletedCards / state.sessionStats.totalCards) * 100,
            };
          }
        }
        
        // Remove the reviewed card from dueCards
        state.dueCards = state.dueCards.filter(card => card._id !== action.payload.cardId);
        
        // If there are cards left, set the next one as active
        if (state.dueCards.length > 0) {
          state.activeCard = state.dueCards[0];
        } else {
          state.activeCard = null;
        }
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Reset card progress
      .addCase(resetCardProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetCardProgress.fulfilled, (state, action: PayloadAction<{
        cardId: string;
        newState: any;
      }>) => {
        state.isLoading = false;
        
        // If the card is in dueCards, update its state
        const cardIndex = state.dueCards.findIndex(card => card._id === action.payload.cardId);
        if (cardIndex !== -1) {
          state.dueCards[cardIndex] = {
            ...state.dueCards[cardIndex],
            state: 'new',
            interval: 0,
            due: new Date().toISOString(),
            factor: 2.5,
            streak: 0,
            lapses: 0,
          };
        }
        
        // If the card is the active card, update it too
        if (state.activeCard && state.activeCard._id === action.payload.cardId) {
          state.activeCard = {
            ...state.activeCard,
            state: 'new',
            interval: 0,
            due: new Date().toISOString(),
            factor: 2.5,
            streak: 0,
            lapses: 0,
          };
        }
      })
      .addCase(resetCardProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get study stats
      .addCase(getStudyStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStudyStats.fulfilled, (state, action: PayloadAction<StudyStats>) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(getStudyStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const {
  clearReviewError,
  setActiveCard,
  clearActiveCard,
  endSession,
  updateSessionStats,
  resetReviewState,
} = reviewSlice.actions;

// Selectors
export const selectDueCards = (state: RootState) => state.review.dueCards;
export const selectActiveCard = (state: RootState) => state.review.activeCard;
export const selectCurrentSession = (state: RootState) => state.review.currentSession;
export const selectSessionStats = (state: RootState) => state.review.sessionStats;
export const selectStudyStats = (state: RootState) => state.review.stats;
export const selectReviewLoading = (state: RootState) => state.review.isLoading;
export const selectReviewError = (state: RootState) => state.review.error;

export default reviewSlice.reducer;
