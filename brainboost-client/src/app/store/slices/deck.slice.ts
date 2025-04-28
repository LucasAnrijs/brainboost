import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import api from '../../services/api';

// Types
export interface Deck {
  _id: string;
  name: string;
  description: string;
  owner: string;
  cardCount: number;
  coverImage?: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DeckState {
  decks: Deck[];
  currentDeck: Deck | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: DeckState = {
  decks: [],
  currentDeck: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchDecks = createAsyncThunk('deck/fetchDecks', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/decks');
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch decks');
  }
});

export const fetchDeckById = createAsyncThunk(
  'deck/fetchDeckById',
  async (deckId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/decks/${deckId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch deck');
    }
  }
);

export const createDeck = createAsyncThunk(
  'deck/createDeck',
  async (deckData: Omit<Deck, '_id' | 'owner' | 'cardCount' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/decks', deckData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create deck');
    }
  }
);

export const updateDeck = createAsyncThunk(
  'deck/updateDeck',
  async (
    {
      deckId,
      deckData,
    }: {
      deckId: string;
      deckData: Partial<Omit<Deck, '_id' | 'owner' | 'cardCount' | 'createdAt' | 'updatedAt'>>;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/decks/${deckId}`, deckData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update deck');
    }
  }
);

export const deleteDeck = createAsyncThunk(
  'deck/deleteDeck',
  async (deckId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/decks/${deckId}`);
      return deckId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete deck');
    }
  }
);

export const shareToggleDeck = createAsyncThunk(
  'deck/shareToggleDeck',
  async (
    { deckId, isPublic }: { deckId: string; isPublic: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/decks/${deckId}/share`, { isPublic });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update sharing settings');
    }
  }
);

export const fetchPublicDecks = createAsyncThunk(
  'deck/fetchPublicDecks',
  async (
    { page = 1, limit = 10, query = '', tags = [] }: { page?: number; limit?: number; query?: string; tags?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/decks/public', {
        params: { page, limit, q: query, tags: tags.join(',') },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch public decks');
    }
  }
);

// Slice
const deckSlice = createSlice({
  name: 'deck',
  initialState,
  reducers: {
    clearDeckError(state) {
      state.error = null;
    },
    setCurrentDeck(state, action: PayloadAction<Deck | null>) {
      state.currentDeck = action.payload;
    },
    clearCurrentDeck(state) {
      state.currentDeck = null;
    },
    incrementDeckCardCount(state, action: PayloadAction<string>) {
      const deck = state.decks.find((d) => d._id === action.payload);
      if (deck) {
        deck.cardCount += 1;
      }
      if (state.currentDeck && state.currentDeck._id === action.payload) {
        state.currentDeck.cardCount += 1;
      }
    },
    decrementDeckCardCount(state, action: PayloadAction<string>) {
      const deck = state.decks.find((d) => d._id === action.payload);
      if (deck && deck.cardCount > 0) {
        deck.cardCount -= 1;
      }
      if (state.currentDeck && state.currentDeck._id === action.payload && state.currentDeck.cardCount > 0) {
        state.currentDeck.cardCount -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch decks
      .addCase(fetchDecks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDecks.fulfilled, (state, action: PayloadAction<Deck[]>) => {
        state.isLoading = false;
        state.decks = action.payload;
      })
      .addCase(fetchDecks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch deck by ID
      .addCase(fetchDeckById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDeckById.fulfilled, (state, action: PayloadAction<Deck>) => {
        state.isLoading = false;
        state.currentDeck = action.payload;
      })
      .addCase(fetchDeckById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create deck
      .addCase(createDeck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDeck.fulfilled, (state, action: PayloadAction<Deck>) => {
        state.isLoading = false;
        state.decks.push(action.payload);
        state.currentDeck = action.payload;
      })
      .addCase(createDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update deck
      .addCase(updateDeck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDeck.fulfilled, (state, action: PayloadAction<Deck>) => {
        state.isLoading = false;
        state.decks = state.decks.map((deck) =>
          deck._id === action.payload._id ? action.payload : deck
        );
        if (state.currentDeck && state.currentDeck._id === action.payload._id) {
          state.currentDeck = action.payload;
        }
      })
      .addCase(updateDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete deck
      .addCase(deleteDeck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDeck.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.decks = state.decks.filter((deck) => deck._id !== action.payload);
        if (state.currentDeck && state.currentDeck._id === action.payload) {
          state.currentDeck = null;
        }
      })
      .addCase(deleteDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Share toggle deck
      .addCase(shareToggleDeck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(shareToggleDeck.fulfilled, (state, action: PayloadAction<Deck>) => {
        state.isLoading = false;
        state.decks = state.decks.map((deck) =>
          deck._id === action.payload._id ? action.payload : deck
        );
        if (state.currentDeck && state.currentDeck._id === action.payload._id) {
          state.currentDeck = action.payload;
        }
      })
      .addCase(shareToggleDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch public decks
      .addCase(fetchPublicDecks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicDecks.fulfilled, (state, action: PayloadAction<Deck[]>) => {
        state.isLoading = false;
        // These are separate from the user's decks, so we don't add them to state.decks
      })
      .addCase(fetchPublicDecks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const {
  clearDeckError,
  setCurrentDeck,
  clearCurrentDeck,
  incrementDeckCardCount,
  decrementDeckCardCount,
} = deckSlice.actions;

// Selectors
export const selectDecks = (state: RootState) => state.deck.decks;
export const selectCurrentDeck = (state: RootState) => state.deck.currentDeck;
export const selectDeckLoading = (state: RootState) => state.deck.isLoading;
export const selectDeckError = (state: RootState) => state.deck.error;

export default deckSlice.reducer;
