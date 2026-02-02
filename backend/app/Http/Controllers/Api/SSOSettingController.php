<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Services\AuditService;
use App\Services\SettingService;
use App\Services\UrlValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SSOSettingController extends Controller
{
    use ApiResponseTrait;

    private const GROUP = 'sso';

    public function __construct(
        private SettingService $settingService,
        private AuditService $auditService,
        private UrlValidationService $urlValidator
    ) {}

    /**
     * Get SSO settings.
     */
    public function show(): JsonResponse
    {
        $settings = $this->settingService->getGroup(self::GROUP);

        return $this->dataResponse([
            'settings' => $settings,
        ]);
    }

    /**
     * Update SSO settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'allow_linking' => ['sometimes', 'boolean'],
            'auto_register' => ['sometimes', 'boolean'],
            'trust_provider_email' => ['sometimes', 'boolean'],
            'google_enabled' => ['sometimes', 'boolean'],
            'github_enabled' => ['sometimes', 'boolean'],
            'microsoft_enabled' => ['sometimes', 'boolean'],
            'apple_enabled' => ['sometimes', 'boolean'],
            'discord_enabled' => ['sometimes', 'boolean'],
            'gitlab_enabled' => ['sometimes', 'boolean'],
            'oidc_enabled' => ['sometimes', 'boolean'],
            'google_client_id' => ['sometimes', 'nullable', 'string', 'max:500'],
            'google_client_secret' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'github_client_id' => ['sometimes', 'nullable', 'string', 'max:500'],
            'github_client_secret' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'microsoft_client_id' => ['sometimes', 'nullable', 'string', 'max:500'],
            'microsoft_client_secret' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'apple_client_id' => ['sometimes', 'nullable', 'string', 'max:500'],
            'apple_client_secret' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'discord_client_id' => ['sometimes', 'nullable', 'string', 'max:500'],
            'discord_client_secret' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'gitlab_client_id' => ['sometimes', 'nullable', 'string', 'max:500'],
            'gitlab_client_secret' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'oidc_client_id' => ['sometimes', 'nullable', 'string', 'max:500'],
            'oidc_client_secret' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'oidc_issuer_url' => ['sometimes', 'nullable', 'string', 'url', 'max:500'],
            'oidc_provider_name' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $userId = $request->user()->id;
        $oldSettings = $this->settingService->getGroup(self::GROUP);

        // Do not allow a provider to be enabled unless it has required credentials
        $oauthProviders = ['google', 'github', 'microsoft', 'apple', 'discord', 'gitlab'];
        foreach ($oauthProviders as $provider) {
            $clientId = $validated[$provider . '_client_id'] ?? $oldSettings[$provider . '_client_id'] ?? '';
            if (trim((string) $clientId) === '') {
                $validated[$provider . '_enabled'] = false;
            }
        }
        $oidcClientId = trim((string) ($validated['oidc_client_id'] ?? $oldSettings['oidc_client_id'] ?? ''));
        $oidcIssuerUrl = trim((string) ($validated['oidc_issuer_url'] ?? $oldSettings['oidc_issuer_url'] ?? ''));
        if ($oidcClientId === '' || $oidcIssuerUrl === '') {
            $validated['oidc_enabled'] = false;
        }

        // Do not allow a provider to be enabled unless it has passed a connection test
        foreach ($oauthProviders as $provider) {
            if (!empty($validated[$provider . '_enabled'])) {
                $testPassed = $oldSettings[$provider . '_test_passed'] ?? false;
                if (!$testPassed) {
                    $validated[$provider . '_enabled'] = false;
                }
            }
        }
        if (!empty($validated['oidc_enabled'])) {
            $oidcTestPassed = $oldSettings['oidc_test_passed'] ?? false;
            if (!$oidcTestPassed) {
                $validated['oidc_enabled'] = false;
            }
        }

        // When credentials change, clear test_passed so the provider must be re-tested
        foreach ($oauthProviders as $provider) {
            $oldId = trim((string) ($oldSettings[$provider . '_client_id'] ?? ''));
            $newId = trim((string) ($validated[$provider . '_client_id'] ?? $oldId));
            if ($oldId !== $newId) {
                $validated[$provider . '_test_passed'] = false;
            }
        }
        $oldOidcId = trim((string) ($oldSettings['oidc_client_id'] ?? ''));
        $newOidcId = trim((string) ($validated['oidc_client_id'] ?? $oldOidcId));
        $oldOidcIssuer = trim((string) ($oldSettings['oidc_issuer_url'] ?? ''));
        $newOidcIssuer = trim((string) ($validated['oidc_issuer_url'] ?? $oldOidcIssuer));
        if ($oldOidcId !== $newOidcId || $oldOidcIssuer !== $newOidcIssuer) {
            $validated['oidc_test_passed'] = false;
        }

        foreach ($validated as $key => $value) {
            $this->settingService->set(self::GROUP, $key, $value, $userId);
        }
        $this->auditService->logSettings(self::GROUP, $oldSettings, $validated, $userId);

        return $this->successResponse('SSO settings updated successfully');
    }

    /**
     * Reset an SSO setting to env default.
     */
    public function reset(Request $request, string $key): JsonResponse
    {
        $schema = config('settings-schema.sso', []);
        if (!array_key_exists($key, $schema)) {
            return $this->errorResponse('Unknown setting key', 422);
        }
        $this->settingService->reset(self::GROUP, $key);

        return $this->successResponse('Setting reset to default');
    }

    /**
     * Test SSO provider configuration by validating credentials at the provider's token endpoint.
     * Uses a fake authorization code; invalid_client = bad credentials, invalid_grant = credentials accepted.
     */
    public function test(Request $request, string $provider): JsonResponse
    {
        $provider = strtolower($provider);
        $allowed = ['google', 'github', 'microsoft', 'apple', 'discord', 'gitlab', 'oidc'];
        if (!in_array($provider, $allowed, true)) {
            return $this->errorResponse('Unknown provider. Use: ' . implode(', ', $allowed), 422);
        }

        $settings = $this->settingService->getGroup(self::GROUP);
        $redirectUri = rtrim(config('app.url'), '/') . '/api/auth/callback/' . $provider;

        if ($provider === 'oidc') {
            $issuerUrl = $settings['oidc_issuer_url'] ?? config('services.oidc.issuer_url');
            $clientId = $settings['oidc_client_id'] ?? config('services.oidc.client_id');
            $clientSecret = $settings['oidc_client_secret'] ?? config('services.oidc.client_secret');
            if (empty($issuerUrl) || empty($clientId)) {
                return $this->errorResponse('OIDC requires Issuer URL and Client ID to be set.', 422);
            }
            if (empty($clientSecret)) {
                return $this->errorResponse('OIDC requires Client Secret to be set to validate credentials.', 422);
            }
            $discoveryUrl = rtrim($issuerUrl, '/') . '/.well-known/openid-configuration';

            // Validate OIDC issuer URL for SSRF protection
            if (!$this->urlValidator->validateUrl($discoveryUrl)) {
                return $this->errorResponse('Invalid OIDC Issuer URL: URLs pointing to internal or private addresses are not allowed.');
            }

            try {
                $response = Http::timeout(10)->get($discoveryUrl);
                if (!$response->successful()) {
                    return $this->errorResponse(
                        'Could not reach OIDC discovery endpoint: ' . $response->status() . ' ' . $response->reason()
                    );
                }
                $body = $response->json();
                if (empty($body['issuer'] ?? null)) {
                    return $this->errorResponse('Discovery response missing issuer.');
                }
                $tokenEndpoint = $body['token_endpoint'] ?? null;
                if (empty($tokenEndpoint)) {
                    return $this->errorResponse('Discovery response missing token_endpoint.');
                }
                if (!$this->validateCredentialsAtTokenEndpoint($tokenEndpoint, $clientId, $clientSecret, $redirectUri)) {
                    return $this->errorResponse('Invalid OIDC client credentials. Check Client ID and Client Secret.');
                }
                $this->settingService->set(self::GROUP, 'oidc_test_passed', true, $request->user()->id);
                return $this->dataResponse(['message' => 'OIDC credentials validated successfully', 'issuer' => $body['issuer']]);
            } catch (\Throwable $e) {
                Log::warning('SSO OIDC test failed', ['provider' => $provider, 'error' => $e->getMessage()]);
                return $this->errorResponse('Connection failed: ' . $e->getMessage());
            }
        }

        $clientIdKey = $provider . '_client_id';
        $clientSecretKey = $provider . '_client_secret';
        $clientId = $settings[$clientIdKey] ?? config('services.' . $provider . '.client_id');
        $clientSecret = $settings[$clientSecretKey] ?? config('services.' . $provider . '.client_secret');
        if (empty($clientId)) {
            return $this->errorResponse('Client ID is not set. Add credentials first.');
        }
        if (empty($clientSecret)) {
            return $this->errorResponse('Client Secret is not set. Add credentials to validate.', 422);
        }

        $discoveryUrls = [
            'google' => 'https://accounts.google.com/.well-known/openid-configuration',
            'microsoft' => 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
        ];

        if (isset($discoveryUrls[$provider])) {
            try {
                $response = Http::timeout(10)->get($discoveryUrls[$provider]);
                if (!$response->successful()) {
                    return $this->errorResponse(
                        'Could not reach provider discovery: ' . $response->status() . ' ' . $response->reason()
                    );
                }
                $body = $response->json();
                $tokenEndpoint = $body['token_endpoint'] ?? null;
                if (empty($tokenEndpoint)) {
                    return $this->errorResponse('Discovery response missing token_endpoint.');
                }
                if (!$this->validateCredentialsAtTokenEndpoint($tokenEndpoint, $clientId, $clientSecret, $redirectUri)) {
                    return $this->errorResponse('Invalid credentials. Check Client ID and Client Secret.');
                }
                $this->settingService->set(self::GROUP, $provider . '_test_passed', true, $request->user()->id);
                return $this->dataResponse(['message' => 'Credentials validated successfully.']);
            } catch (\Throwable $e) {
                Log::warning('SSO provider test failed', ['provider' => $provider, 'error' => $e->getMessage()]);
                return $this->errorResponse('Connection failed: ' . $e->getMessage());
            }
        }

        // GitHub, Discord, GitLab: use known token endpoints
        $tokenEndpoints = [
            'github' => 'https://github.com/login/oauth/access_token',
            'discord' => 'https://discord.com/api/oauth2/token',
            'gitlab' => 'https://gitlab.com/oauth/token',
        ];

        if (isset($tokenEndpoints[$provider])) {
            $tokenUrl = $tokenEndpoints[$provider];
            $useJson = $provider === 'github'; // GitHub expects application/json and returns JSON
            if (!$this->validateCredentialsAtTokenEndpoint($tokenUrl, $clientId, $clientSecret, $redirectUri, $useJson)) {
                return $this->errorResponse('Invalid credentials. Check Client ID and Client Secret.');
            }
            $this->settingService->set(self::GROUP, $provider . '_test_passed', true, $request->user()->id);
            return $this->dataResponse(['message' => 'Credentials validated successfully.']);
        }

        // Apple: Sign in with Apple uses JWT client secret; token validation differs. Require credentials and mark test passed only after token check if we add it later.
        if ($provider === 'apple') {
            return $this->errorResponse('Apple credential validation is not supported. Configure redirect URI and test sign-in manually.');
        }

        return $this->errorResponse('Unknown provider.');
    }

    /**
     * Attempt token exchange with a fake auth code. Invalid client = bad credentials; invalid_grant = credentials OK.
     */
    private function validateCredentialsAtTokenEndpoint(
        string $tokenUrl,
        string $clientId,
        string $clientSecret,
        string $redirectUri,
        bool $useJsonRequest = false
    ): bool {
        $params = [
            'grant_type' => 'authorization_code',
            'code' => 'test_connection_validation',
            'redirect_uri' => $redirectUri,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
        ];

        try {
            if ($useJsonRequest) {
                $response = Http::timeout(10)
                    ->withHeaders(['Accept' => 'application/json'])
                    ->asForm()
                    ->post($tokenUrl, $params);
            } else {
                $response = Http::timeout(10)->asForm()->post($tokenUrl, $params);
            }

            $status = $response->status();
            $body = $response->json() ?? [];
            $error = $body['error'] ?? $body['error_description'] ?? '';

            // 401 or invalid_client => credentials rejected
            if ($status === 401) {
                return false;
            }
            if (is_string($error) && strtolower($error) === 'invalid_client') {
                return false;
            }

            // invalid_grant, invalid_request, bad_verification_code (GitHub) => credentials accepted, request/code invalid (expected)
            $acceptedErrors = ['invalid_grant', 'invalid_request', 'bad_verification_code'];
            if (is_string($error) && in_array(strtolower($error), $acceptedErrors, true)) {
                return true;
            }

            // incorrect_client_credentials (GitHub) => wrong credentials
            if (is_string($error) && stripos($error, 'incorrect_client') !== false) {
                return false;
            }

            // redirect_uri_mismatch => configuration issue, not valid for test
            if (is_string($error) && strtolower($error) === 'redirect_uri_mismatch') {
                return false;
            }

            // Unknown response: treat as failure for safety
            if ($status >= 400) {
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::debug('SSO token endpoint validation failed', ['url' => $tokenUrl, 'error' => $e->getMessage()]);
            return false;
        }
    }
}
