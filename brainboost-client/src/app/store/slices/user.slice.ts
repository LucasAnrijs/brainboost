import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import userService from '../../services/user.service';

// Types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  preferences: {
    theme: string;
    studyGoal: number;
    emailNotifications: boolean;
  };
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await userService.getProfile();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      const data = await userService.updateProfile(profileData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (
    preferences: {
      theme?: string;
      studyGoal?: number;
      emailNotifications?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await userService.updatePreferences(preferences);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update preferences');
    }
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update preferences
      .addCase(updateUserPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const { clearUserError } = userSlice.actions;

// Selectors
export const selectUserProfile = (state: RootState) => state.user.profile;
export const selectUserLoading = (state: RootState) => state.user.isLoading;
export const selectUserError = (state: RootState) => state.user.error;

export default userSlice.reducer;
