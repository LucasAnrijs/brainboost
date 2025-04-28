import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import userReducer from './slices/user.slice';
import deckReducer from './slices/deck.slice';
import cardReducer from './slices/card.slice';
import reviewReducer from './slices/review.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    deck: deckReducer,
    card: cardReducer,
    review: reviewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user', 'user.profile'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
