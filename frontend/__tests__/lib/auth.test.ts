import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state
    vi.resetModules();
  });

  it('initializes with default state', async () => {
    const { useAuth } = await import('@/lib/auth');
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches user on mount', async () => {
    const { api } = await import('@/lib/api');
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    
    (api.get as any).mockResolvedValueOnce({ data: { user: mockUser } });

    const { useAuth } = await import('@/lib/auth');
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.fetchUser();
    });

    expect(api.get).toHaveBeenCalledWith('/auth/user');
  });

  it('handles login', async () => {
    const { api } = await import('@/lib/api');
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    
    (api.post as any).mockResolvedValueOnce({ data: { user: mockUser } });

    const { useAuth } = await import('@/lib/auth');
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('handles logout', async () => {
    const { api } = await import('@/lib/api');
    
    (api.post as any).mockResolvedValueOnce({});

    const { useAuth } = await import('@/lib/auth');
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    expect(result.current.user).toBeNull();
  });

  it('handles registration', async () => {
    const { api } = await import('@/lib/api');
    const mockUser = { id: 1, name: 'New User', email: 'new@example.com' };
    
    (api.post as any).mockResolvedValueOnce({ data: { user: mockUser } });

    const { useAuth } = await import('@/lib/auth');
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register('New User', 'new@example.com', 'password');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'New User',
      email: 'new@example.com',
      password: 'password',
      password_confirmation: 'password',
    });
  });

  it('handles errors', async () => {
    const { api } = await import('@/lib/api');
    
    (api.post as any).mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    const { useAuth } = await import('@/lib/auth');
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrongpassword');
      } catch (e) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Invalid credentials');
  });
});
