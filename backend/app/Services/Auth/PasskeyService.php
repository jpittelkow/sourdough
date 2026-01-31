<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Laragear\WebAuthn\Facades\WebAuthn;

class PasskeyService
{
    /**
     * Generate registration (attestation) options for a new passkey.
     */
    public function generateRegistrationOptions(User $user): array
    {
        $request = WebAuthn::prepareAttestation($user);

        return $request->toArray();
    }

    /**
     * Register a new passkey for the user.
     */
    public function registerPasskey(User $user, array $credential, ?string $name = null): void
    {
        WebAuthn::register($user, $credential, $name);
    }

    /**
     * Generate authentication (assertion) options for passkey login.
     * Pass null for $user to support discoverable (usernameless) credentials.
     */
    public function generateAuthenticationOptions(?User $user = null): array
    {
        $request = WebAuthn::prepareAssertion($user);

        return $request->toArray();
    }

    /**
     * Verify passkey authentication and return the authenticated user, or null on failure.
     */
    public function verifyAuthentication(array $credential): ?User
    {
        $authenticatable = WebAuthn::login($credential);

        return $authenticatable instanceof User ? $authenticatable : null;
    }

    /**
     * List user's registered passkeys with safe metadata.
     */
    public function listPasskeys(User $user): array
    {
        $credentials = $user->webauthnCredentials()->orderBy('created_at', 'desc')->get();

        return $credentials->map(fn ($cred) => [
            'id' => $cred->id,
            'alias' => $cred->alias ?? 'Passkey',
            'created_at' => $cred->created_at?->toIso8601String(),
            'updated_at' => $cred->updated_at?->toIso8601String(),
        ])->values()->all();
    }

    /**
     * Delete a passkey by credential id.
     */
    public function deletePasskey(User $user, string $credentialId): bool
    {
        $credential = $user->webauthnCredentials()->where('id', $credentialId)->first();

        if (!$credential) {
            return false;
        }

        $credential->delete();

        return true;
    }

    /**
     * Rename a passkey.
     */
    public function renamePasskey(User $user, string $credentialId, string $name): bool
    {
        $credential = $user->webauthnCredentials()->where('id', $credentialId)->first();

        if (!$credential) {
            return false;
        }

        $credential->forceFill(['alias' => $name])->save();

        return true;
    }
}
