<?php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use App\Services\NotificationTemplateService;
use Illuminate\Support\Facades\Http;

class WebPushChannel implements ChannelInterface
{
    private string $publicKey;
    private string $privateKey;
    private string $subject;

    public function __construct()
    {
        $this->publicKey = config('notifications.channels.webpush.public_key', '');
        $this->privateKey = config('notifications.channels.webpush.private_key', '');
        $this->subject = config('notifications.channels.webpush.subject', '');
    }

    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        $resolved = $this->resolveContent($user, $type, $title, $message, $data);
        $title = $resolved['title'];
        $message = $resolved['body'];

        $subscription = $user->getSetting('webpush_subscription');

        if (!$subscription) {
            throw new \RuntimeException('Web Push subscription not configured for user');
        }

        if (is_string($subscription)) {
            $subscription = json_decode($subscription, true);
        }

        if (!isset($subscription['endpoint']) || !isset($subscription['keys'])) {
            throw new \RuntimeException('Invalid Web Push subscription format');
        }

        if (!$this->publicKey || !$this->privateKey) {
            throw new \RuntimeException('VAPID keys not configured');
        }

        // Build the notification payload
        $payload = json_encode([
            'title' => $title,
            'body' => $message,
            'icon' => $data['icon'] ?? '/icon-192.png',
            'badge' => $data['badge'] ?? '/badge.png',
            'data' => $data,
            'timestamp' => time() * 1000,
        ]);

        // Encrypt the payload
        $encrypted = $this->encryptPayload($payload, $subscription['keys']);

        // Generate VAPID headers
        $vapidHeaders = $this->generateVapidHeaders($subscription['endpoint']);

        // Send the push notification
        $response = Http::withHeaders(array_merge([
            'Content-Type' => 'application/octet-stream',
            'Content-Encoding' => 'aes128gcm',
            'Content-Length' => strlen($encrypted['ciphertext']),
            'TTL' => 86400, // 24 hours
        ], $vapidHeaders, $encrypted['headers']))
            ->withBody($encrypted['ciphertext'], 'application/octet-stream')
            ->post($subscription['endpoint']);

        if (!$response->successful() && $response->status() !== 201) {
            throw new \RuntimeException('Web Push failed: ' . $response->body());
        }

        return [
            'endpoint' => $subscription['endpoint'],
            'sent' => true,
        ];
    }

    /**
     * Encrypt the payload using the subscription keys.
     */
    private function encryptPayload(string $payload, array $keys): array
    {
        $userPublicKey = base64_decode(strtr($keys['p256dh'], '-_', '+/'));
        $userAuthToken = base64_decode(strtr($keys['auth'], '-_', '+/'));

        // Generate a random salt
        $salt = random_bytes(16);

        // Generate local key pair
        $localKey = openssl_pkey_new([
            'curve_name' => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
        ]);

        $localKeyDetails = openssl_pkey_get_details($localKey);
        $localPublicKey = $this->serializePublicKey($localKeyDetails);

        // Derive shared secret using ECDH
        $sharedSecret = $this->deriveSharedSecret($localKey, $userPublicKey);

        // Derive encryption keys using HKDF
        $info = "WebPush: info\x00" . $userPublicKey . $localPublicKey;
        $ikm = $this->hkdf($userAuthToken, $sharedSecret, "Content-Encoding: auth\x00", 32);
        $prk = hash_hmac('sha256', $ikm, $salt, true);

        $cekInfo = "Content-Encoding: aes128gcm\x00";
        $nonceInfo = "Content-Encoding: nonce\x00";

        $cek = $this->hkdf($prk, '', $cekInfo, 16);
        $nonce = $this->hkdf($prk, '', $nonceInfo, 12);

        // Pad and encrypt the payload
        $paddedPayload = pack('n', 0) . $payload; // 2 bytes padding length + payload
        $ciphertext = openssl_encrypt($paddedPayload, 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag);

        // Build the encrypted content with headers
        $recordSize = pack('N', 4096);
        $keyIdLen = chr(strlen($localPublicKey));
        $header = $salt . $recordSize . $keyIdLen . $localPublicKey;

        return [
            'ciphertext' => $header . $ciphertext . $tag,
            'headers' => [],
        ];
    }

    /**
     * Generate VAPID authentication headers.
     */
    private function generateVapidHeaders(string $endpoint): array
    {
        $parsedUrl = parse_url($endpoint);
        $audience = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];

        $header = json_encode(['typ' => 'JWT', 'alg' => 'ES256']);
        $payload = json_encode([
            'aud' => $audience,
            'exp' => time() + 86400,
            'sub' => $this->subject,
        ]);

        $headerB64 = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
        $payloadB64 = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');

        $data = "{$headerB64}.{$payloadB64}";

        // Sign with private key
        $privateKey = openssl_pkey_get_private($this->privateKey);
        openssl_sign($data, $signature, $privateKey, OPENSSL_ALGO_SHA256);

        // Convert DER signature to raw format
        $signature = $this->derToRaw($signature);
        $signatureB64 = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        $jwt = "{$data}.{$signatureB64}";

        return [
            'Authorization' => "vapid t={$jwt}, k={$this->publicKey}",
        ];
    }

    private function serializePublicKey(array $keyDetails): string
    {
        return chr(4) . $keyDetails['ec']['x'] . $keyDetails['ec']['y'];
    }

    private function deriveSharedSecret($privateKey, string $publicKey): string
    {
        // Simplified ECDH - in production, use a proper ECDH library
        return hash('sha256', $publicKey, true);
    }

    private function hkdf(string $ikm, string $salt, string $info, int $length): string
    {
        if (empty($salt)) {
            $salt = str_repeat("\x00", 32);
        }
        $prk = hash_hmac('sha256', $ikm, $salt, true);
        return substr(hash_hmac('sha256', $info . chr(1), $prk, true), 0, $length);
    }

    private function derToRaw(string $der): string
    {
        // Convert DER encoded ECDSA signature to raw format (64 bytes)
        $offset = 3;
        $rLen = ord($der[$offset]);
        $offset++;
        $r = substr($der, $offset, $rLen);
        $offset += $rLen + 1;
        $sLen = ord($der[$offset]);
        $offset++;
        $s = substr($der, $offset, $sLen);

        $r = ltrim($r, "\x00");
        $s = ltrim($s, "\x00");

        return str_pad($r, 32, "\x00", STR_PAD_LEFT) . str_pad($s, 32, "\x00", STR_PAD_LEFT);
    }

    public function getName(): string
    {
        return 'Web Push';
    }

    public function isAvailableFor(User $user): bool
    {
        return config('notifications.channels.webpush.enabled', false)
            && !empty($user->getSetting('webpush_subscription'));
    }

    private function resolveContent(User $user, string $type, string $title, string $message, array $data): array
    {
        $service = app(NotificationTemplateService::class);
        $template = $service->getByTypeAndChannel($type, 'push');
        if (!$template) {
            return ['title' => $title, 'body' => $message];
        }
        $variables = array_merge([
            'user' => ['name' => $user->name, 'email' => $user->email],
            'app_name' => config('app.name', 'Sourdough'),
        ], $data);
        return $service->renderTemplate($template, $variables);
    }
}
