import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import api from '../../services/api';
import { incrementDeckCardCount, decrementDeckCardCount } from './deck.slice';

// Types
export interface CardContent {
  front: string;
  back: string;
  hint?: string;
  frontImage?: string;
  backImage?: string;
  tags?: string[];
}

export interface Card {
  _id: string;
  deckId: string;
  content: CardContent;
  createdAt: string;
  updatedAt: string;
}

export interface CardWithState extends Card {
  state?: string;
  interval?: number;
  due?: string;
  factor?: number;
  streak?: number;
  lapses?: number;
}

export interface CardsState {
  cards: CardWithState[];
  currentCard: CardWithState | null;
  isLoading: boolean;
  error: string | null;
  cardsByDeck: Record<string, CardWithState[]>;
}

// Initial state
const initialState: CardsState = {
  cards: [],
  currentCard: null,
  isLoading: false,
  error: null,
  cardsByDeck: {},
};

// Async thunks
export const fetchCards = createAsyncThunk(
  'card/fetchCards',
  async (deckId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/cards/${deckId}`);
      return { deckId, cards: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cards');
    }
  }
);

export const fetchCardById = createAsyncThunk(
  'card/fetchCardById',
  async (cardId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/cards/card/${cardId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch card');
    }
  }
);

export const createCard = createAsyncThunk(
  'card/createCard',
  async (
    { deckId, cardData }: { deckId: string; cardData: CardContent },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await api.post(`/cards/${deckId}`, cardData);
      // Increment the card count in the related deck
      dispatch(incrementDeckCardCount(deckId));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create card');
    }
  }
);

export const updateCard = createAsyncThunk(
  'card/updateCard',
  async (
    { cardId, cardData }: { cardId: string; cardData: Partial<CardContent> },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/cards/${cardId}`, cardData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update card');
    }
  }
);

export const deleteCard = createAsyncThunk(
  'card/deleteCard',
  async ({ cardId, deckId }: { cardId: string; deckId: string }, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/cards/${cardId}`);
      // Decrement the card count in the related deck
      dispatch(decrementDeckCardCount(deckId));
      return { cardId, deckId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete card');
    }
  }
);

export const bulkCreateCards = createAsyncThunk(
  'card/bulkCreateCards',
  async (
    { deckId, cardsData }: { deckId: string; cardsData: CardContent[] },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await api.post(`/cards/${deckId}/bulk`, { cards: cardsData });
      // Increment the card count in the related deck
      dispatch(incrementDeckCardCount(deckId));
      return { deckId, cards: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create cards in bulk');
    }
  }
);

export const importCards = createAsyncThunk(
  'card/importCards',
  async (
    { deckId, file }: { deckId: string; file: File },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/cards/${deckId}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Increment the card count in the related deck
      dispatch(incrementDeckCardCount(deckId));
      return { deckId, cards: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to import cards');
    }
  }
);

// Slice
const cardSlice = createSlice({
  name: 'card',
  initialState,
  reducers: {
    clearCardError(state) {
      state.error = null;
    },
    setCurrentCard(state, action: PayloadAction<CardWithState | null>) {
      state.currentCard = action.payload;
    },
    clearCurrentCard(state) {
      state.currentCard = null;
    },
    clearCardsByDeck(state, action: PayloadAction<string>) {
      delete state.cardsByDeck[action.payload];
    },
    updateCardState(state, action: PayloadAction<{ cardId: string; updatedState: Partial<CardWithState> }>) {
      const { cardId, updatedState } = action.payload;
      
      // Update in cards array
      const cardIndex = state.cards.findIndex(card => card._id === cardId);
      if (cardIndex !== -1) {
        state.cards[cardIndex] = { ...state.cards[cardIndex], ...updatedState };
      }
      
      // Update in cardsByDeck
      if (state.cards[cardIndex]) {
        const deckId = state.cards[cardIndex].deckId;
        const deckCardIndex = state.cardsByDeck[deckId]?.findIndex(card => card._id === cardId);
        
        if (deckCardIndex !== undefined && deckCardIndex !== -1 && state.cardsByDeck[deckId]) {
          state.cardsByDeck[deckId][deckCardIndex] = { 
            ...state.cardsByDeck[deckId][deckCardIndex], 
            ...updatedState 
          };
        }
      }
      
      // Update current card if it's the one being modified
      if (state.currentCard && state.currentCard._id === cardId) {
        state.currentCard = { ...state.currentCard, ...updatedState };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch cards
      .addCase(fetchCards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCards.fulfilled, (state, action: PayloadAction<{ deckId: string; cards: CardWithState[] }>) => {
        state.isLoading = false;
        // We keep cards organized by deck ID for efficient access
        state.cardsByDeck[action.payload.deckId] = action.payload.cards;
        
        // Also update the flat cards array
        // Remove existing cards for this deck first to avoid duplicates
        state.cards = state.cards.filter(card => card.deckId !== action.payload.deckId);
        // Then add the new cards
        state.cards = [...state.cards, ...action.payload.cards];
      })
      .addCase(fetchCards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch card by ID
      .addCase(fetchCardById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCardById.fulfilled, (state, action: PayloadAction<CardWithState>) => {
        state.isLoading = false;
        state.currentCard = action.payload;
        
        // Update in the main cards array
        const index = state.cards.findIndex(card => card._id === action.payload._id);
        if (index !== -1) {
          state.cards[index] = action.payload;
        } else {
          state.cards.push(action.payload);
        }
        
        // Update in cardsByDeck
        if (!state.cardsByDeck[action.payload.deckId]) {
          state.cardsByDeck[action.payload.deckId] = [];
        }
        
        const deckIndex = state.cardsByDeck[action.payload.deckId].findIndex(
          card => card._id === action.payload._id
        );
        
        if (deckIndex !== -1) {
          state.cardsByDeck[action.payload.deckId][deckIndex] = action.payload;
        } else {
          state.cardsByDeck[action.payload.deckId].push(action.payload);
        }
      })
      .addCase(fetchCardById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create card
      .addCase(createCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCard.fulfilled, (state, action: PayloadAction<CardWithState>) => {
        state.isLoading = false;
        state.cards.push(action.payload);
        state.currentCard = action.payload;
        
        // Add to cardsByDeck
        if (!state.cardsByDeck[action.payload.deckId]) {
          state.cardsByDeck[action.payload.deckId] = [];
        }
        state.cardsByDeck[action.payload.deckId].push(action.payload);
      })
      .addCase(createCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update card
      .addCase(updateCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCard.fulfilled, (state, action: PayloadAction<CardWithState>) => {
        state.isLoading = false;
        
        // Update in cards array
        state.cards = state.cards.map(card =>
          card._id === action.payload._id ? action.payload : card
        );
        
        // Update in cardsByDeck
        if (state.cardsByDeck[action.payload.deckId]) {
          state.cardsByDeck[action.payload.deckId] = state.cardsByDeck[action.payload.deckId].map(
            card => (card._id === action.payload._id ? action.payload : card)
          );
        }
        
        // Update current card if it's the one being modified
        if (state.currentCard && state.currentCard._id === action.payload._id) {
          state.currentCard = action.payload;
        }
      })
      .addCase(updateCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete card
      .addCase(deleteCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCard.fulfilled, (state, action: PayloadAction<{ cardId: string; deckId: string }>) => {
        state.isLoading = false;
        
        // Remove from cards array
        state.cards = state.cards.filter(card => card._id !== action.payload.cardId);
        
        // Remove from cardsByDeck
        if (state.cardsByDeck[action.payload.deckId]) {
          state.cardsByDeck[action.payload.deckId] = state.cardsByDeck[action.payload.deckId].filter(
            card => card._id !== action.payload.cardId
          );
        }
        
        // Clear current card if it's the one being deleted
        if (state.currentCard && state.currentCard._id === action.payload.cardId) {
          state.currentCard = null;
        }
      })
      .addCase(deleteCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Bulk create cards
      .addCase(bulkCreateCards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkCreateCards.fulfilled, (state, action: PayloadAction<{ deckId: string; cards: CardWithState[] }>) => {
        state.isLoading = false;
        
        // Add to cards array
        state.cards = [...state.cards, ...action.payload.cards];
        
        // Add to cardsByDeck
        if (!state.cardsByDeck[action.payload.deckId]) {
          state.cardsByDeck[action.payload.deckId] = [];
        }
        state.cardsByDeck[action.payload.deckId] = [
          ...state.cardsByDeck[action.payload.deckId],
          ...action.payload.cards
        ];
      })
      .addCase(bulkCreateCards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Import cards
      .addCase(importCards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importCards.fulfilled, (state, action: PayloadAction<{ deckId: string; cards: CardWithState[] }>) => {
        state.isLoading = false;
        
        // Add to cards array
        state.cards = [...state.cards, ...action.payload.cards];
        
        // Add to cardsByDeck
        if (!state.cardsByDeck[action.payload.deckId]) {
          state.cardsByDeck[action.payload.deckId] = [];
        }
        state.cardsByDeck[action.payload.deckId] = [
          ...state.cardsByDeck[action.payload.deckId],
          ...action.payload.cards
        ];
      })
      .addCase(importCards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const {
  clearCardError,
  setCurrentCard,
  clearCurrentCard,
  clearCardsByDeck,
  updateCardState
} = cardSlice.actions;

// Selectors
export const selectCards = (state: RootState) => state.card.cards;
export const selectCurrentCard = (state: RootState) => state.card.currentCard;
export const selectCardsByDeck = (deckId: string) => (state: RootState) => 
  state.card.cardsByDeck[deckId] || [];
export const selectCardLoading = (state: RootState) => state.card.isLoading;
export const selectCardError = (state: RootState) => state.card.error;

export default cardSlice.reducer;
