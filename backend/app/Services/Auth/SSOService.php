<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Models\SocialAccount;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class SSOService
{
    /**
     * Get list of available SSO providers.
     */
    public function getAvailableProviders(): array
    {
        return collect(config('sso.providers'))
            ->filter(fn ($provider) => $provider['enabled'])
            ->map(fn ($provider, $key) => [
                'id' => $key,
                'name' => $provider['name'],
                'icon' => $provider['icon'],
                'color' => $provider['color'],
            ])
            ->values()
            ->all();
    }

    /**
     * Check if SSO is globally enabled.
     */
    public function isEnabled(): bool
    {
        return config('sso.enabled', false);
    }

    /**
     * Check if a provider is valid and enabled.
     */
    public function isValidProvider(string $provider): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        $providers = config('sso.providers', []);
        return isset($providers[$provider]) && $providers[$provider]['enabled'];
    }

    /**
     * Get the redirect URL for a provider.
     */
    public function getRedirectUrl(string $provider, ?string $state = null): string
    {
        $driver = Socialite::driver($provider);

        if ($state) {
            $driver->with(['state' => $state]);
        }

        return $driver->redirect()->getTargetUrl();
    }

    /**
     * Get the user data from the SSO provider callback.
     */
    public function getSocialUser(string $provider): SocialiteUser
    {
        return Socialite::driver($provider)->user();
    }

    /**
     * Find existing social account by provider and ID.
     */
    public function findSocialAccount(string $provider, string $providerId): ?SocialAccount
    {
        return SocialAccount::where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();
    }

    /**
     * Find user by email.
     */
    public function findUserByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /**
     * Handle SSO callback and return appropriate result.
     */
    public function handleCallback(string $provider): array
    {
        try {
            $socialUser = $this->getSocialUser($provider);
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'authentication_failed',
                'message' => $e->getMessage(),
            ];
        }

        // Check if this social account is already linked to a user
        $socialAccount = $this->findSocialAccount($provider, $socialUser->getId());

        if ($socialAccount) {
            // Update the existing social account
            $this->updateSocialAccount($socialAccount, $socialUser);

            return [
                'success' => true,
                'user' => $socialAccount->user,
                'action' => 'login',
            ];
        }

        // Check if user exists with this email
        $user = $this->findUserByEmail($socialUser->getEmail());

        if ($user) {
            // Link social account to existing user
            if (config('sso.allow_linking')) {
                $this->createSocialAccount($user, $provider, $socialUser);

                return [
                    'success' => true,
                    'user' => $user,
                    'action' => 'linked',
                ];
            }

            return [
                'success' => false,
                'error' => 'account_exists',
                'message' => 'An account with this email already exists',
            ];
        }

        // Create new user if auto-registration is enabled
        if (config('sso.auto_register')) {
            $user = $this->createUserFromSocial($provider, $socialUser);
            $this->createSocialAccount($user, $provider, $socialUser);

            return [
                'success' => true,
                'user' => $user,
                'action' => 'registered',
            ];
        }

        return [
            'success' => false,
            'error' => 'registration_required',
            'message' => 'Please register an account first',
        ];
    }

    /**
     * Link a social provider to an existing user.
     */
    public function linkProvider(User $user, string $provider, SocialiteUser $socialUser): SocialAccount
    {
        // Check if already linked
        $existing = $user->socialAccounts()->where('provider', $provider)->first();

        if ($existing) {
            throw new \RuntimeException('Provider already linked');
        }

        // Check if this social account is linked to another user
        $existingAccount = $this->findSocialAccount($provider, $socialUser->getId());

        if ($existingAccount && $existingAccount->user_id !== $user->id) {
            throw new \RuntimeException('This social account is already linked to another user');
        }

        return $this->createSocialAccount($user, $provider, $socialUser);
    }

    /**
     * Unlink a social provider from a user.
     */
    public function unlinkProvider(User $user, string $provider): void
    {
        $socialAccount = $user->socialAccounts()->where('provider', $provider)->first();

        if (!$socialAccount) {
            throw new \RuntimeException('Provider not linked');
        }

        // Ensure user has another login method
        $hasPassword = $user->password !== null;
        $otherSocialAccounts = $user->socialAccounts()->where('provider', '!=', $provider)->count();

        if (!$hasPassword && $otherSocialAccounts === 0) {
            throw new \RuntimeException('Cannot unlink last authentication method');
        }

        $socialAccount->delete();
    }

    /**
     * Get linked social accounts for a user.
     */
    public function getLinkedAccounts(User $user): array
    {
        return $user->socialAccounts()
            ->get()
            ->map(fn ($account) => [
                'provider' => $account->provider,
                'nickname' => $account->nickname,
                'avatar' => $account->avatar,
                'linked_at' => $account->created_at,
            ])
            ->all();
    }

    /**
     * Create a social account record.
     */
    public function createSocialAccount(User $user, string $provider, SocialiteUser $socialUser): SocialAccount
    {
        return $user->socialAccounts()->create([
            'provider' => $provider,
            'provider_id' => $socialUser->getId(),
            'provider_token' => $socialUser->token,
            'provider_refresh_token' => $socialUser->refreshToken ?? null,
            'provider_token_expires_at' => $socialUser->expiresIn ? now()->addSeconds($socialUser->expiresIn) : null,
            'avatar' => $socialUser->getAvatar(),
            'nickname' => $socialUser->getNickname(),
        ]);
    }

    /**
     * Update an existing social account.
     */
    public function updateSocialAccount(SocialAccount $socialAccount, SocialiteUser $socialUser): void
    {
        $socialAccount->update([
            'provider_token' => $socialUser->token,
            'provider_refresh_token' => $socialUser->refreshToken ?? $socialAccount->provider_refresh_token,
            'provider_token_expires_at' => $socialUser->expiresIn ? now()->addSeconds($socialUser->expiresIn) : null,
            'avatar' => $socialUser->getAvatar(),
            'nickname' => $socialUser->getNickname(),
        ]);
    }

    /**
     * Create a user from social login data.
     */
    public function createUserFromSocial(string $provider, SocialiteUser $socialUser): User
    {
        return User::create([
            'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
            'email' => $socialUser->getEmail(),
            'avatar' => $socialUser->getAvatar(),
            'email_verified_at' => config('sso.trust_provider_email') ? now() : null,
            'is_admin' => User::count() === 0, // First user is admin
        ]);
    }

    /**
     * Refresh a provider token if supported.
     */
    public function refreshToken(SocialAccount $socialAccount): ?string
    {
        if (!$socialAccount->provider_refresh_token) {
            return null;
        }

        try {
            $newToken = Socialite::driver($socialAccount->provider)
                ->refreshToken($socialAccount->provider_refresh_token);

            $socialAccount->update([
                'provider_token' => $newToken->token,
                'provider_refresh_token' => $newToken->refreshToken ?? $socialAccount->provider_refresh_token,
                'provider_token_expires_at' => $newToken->expiresIn ? now()->addSeconds($newToken->expiresIn) : null,
            ]);

            return $newToken->token;
        } catch (\Exception $e) {
            return null;
        }
    }
}
