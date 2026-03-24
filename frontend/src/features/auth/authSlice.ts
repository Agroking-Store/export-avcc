import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "../../services/authApi";
import { authStorage } from "../../utils/authStorage";
import {
  AuthState,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from "../../types/auth.types";
import { toast } from "react-toastify";

const initialState: AuthState = {
  user: authStorage.getUser(),
  token: authStorage.getToken(),
  refreshToken: authStorage.getRefreshToken(),
  loading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authApi.register(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed",
      );
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await authApi.logout();
  } catch (error) {
    console.error("Logout error:", error);
  }
});

export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getProfile();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile",
      );
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data: { name: string; email: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Update failed");
    }
  },
);


// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      authStorage.setToken(action.payload.accessToken);
      authStorage.setRefreshToken(action.payload.refreshToken);
      authStorage.setUser(action.payload.user);
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload!.user;
        state.token = action.payload!.accessToken;
        state.refreshToken = action.payload!.refreshToken;
        authStorage.setToken(action.payload!.accessToken);
        authStorage.setRefreshToken(action.payload!.refreshToken);
        authStorage.setUser(action.payload!.user);
        toast.success("Login successful!");
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload!.user;
        state.token = action.payload!.accessToken;
        state.refreshToken = action.payload!.refreshToken;
        authStorage.setToken(action.payload!.accessToken);
        authStorage.setRefreshToken(action.payload!.refreshToken);
        authStorage.setUser(action.payload!.user);
        toast.success("Registration successful!");
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        authStorage.clearTokens();
        toast.success("Logged out successfully");
      })
      // Get Profile
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload!;
        authStorage.setUser(action.payload!);
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        authStorage.setUser(action.payload);
        toast.success("Profile updated successfully!");
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;

