<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class MailSettingController extends Controller
{
    /**
     * Get mail settings.
     */
    public function show(): JsonResponse
    {
        $settings = SystemSetting::getGroup('mail');

        return response()->json([
            'settings' => $settings,
        ]);
    }

    /**
     * Update mail settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', 'in:smtp,mailgun,sendgrid,ses,postmark'],
            'host' => ['required_if:provider,smtp', 'nullable', 'string'],
            'port' => ['required_if:provider,smtp', 'nullable', 'integer', 'min:1', 'max:65535'],
            'encryption' => ['sometimes', 'string', 'in:tls,ssl'],
            'username' => ['sometimes', 'nullable', 'string'],
            'password' => ['sometimes', 'nullable', 'string'],
            'from_address' => ['required', 'string', 'email'],
            'from_name' => ['required', 'string', 'max:255'],
            'mailgun_domain' => ['required_if:provider,mailgun', 'nullable', 'string'],
            'mailgun_secret' => ['required_if:provider,mailgun', 'nullable', 'string'],
            'sendgrid_api_key' => ['required_if:provider,sendgrid', 'nullable', 'string'],
            'ses_key' => ['required_if:provider,ses', 'nullable', 'string'],
            'ses_secret' => ['required_if:provider,ses', 'nullable', 'string'],
            'ses_region' => ['required_if:provider,ses', 'nullable', 'string'],
            'postmark_token' => ['required_if:provider,postmark', 'nullable', 'string'],
        ]);

        $user = $request->user();

        foreach ($validated as $key => $value) {
            SystemSetting::set($key, $value, 'mail', $user->id, false);
        }

        // Update Laravel mail config cache
        $this->updateMailConfig($validated);

        return response()->json([
            'message' => 'Mail settings updated successfully',
        ]);
    }

    /**
     * Send test email.
     */
    public function sendTestEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'to' => ['required', 'email'],
        ]);

        try {
            // Update config temporarily for test
            $settings = SystemSetting::getGroup('mail');
            $this->updateMailConfig($settings);

            Mail::raw('This is a test email from your application.', function ($message) use ($validated, $settings) {
                $message->to($validated['to'])
                    ->subject('Test Email')
                    ->from($settings['from_address'] ?? config('mail.from.address'), $settings['from_name'] ?? config('mail.from.name'));
            });

            return response()->json([
                'message' => 'Test email sent successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send test email: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update Laravel mail configuration.
     */
    private function updateMailConfig(array $settings): void
    {
        $config = config('mail');

        if (isset($settings['provider'])) {
            $config['default'] = $settings['provider'];
        }

        if ($settings['provider'] === 'smtp') {
            $config['mailers']['smtp'] = [
                'transport' => 'smtp',
                'host' => $settings['host'] ?? env('MAIL_HOST'),
                'port' => $settings['port'] ?? env('MAIL_PORT', 587),
                'encryption' => $settings['encryption'] ?? env('MAIL_ENCRYPTION'),
                'username' => $settings['username'] ?? env('MAIL_USERNAME'),
                'password' => $settings['password'] ?? env('MAIL_PASSWORD'),
            ];
        } elseif ($settings['provider'] === 'mailgun') {
            $config['mailers']['mailgun'] = [
                'transport' => 'mailgun',
                'domain' => $settings['mailgun_domain'] ?? env('MAILGUN_DOMAIN'),
                'secret' => $settings['mailgun_secret'] ?? env('MAILGUN_SECRET'),
            ];
        } elseif ($settings['provider'] === 'sendgrid') {
            $config['mailers']['sendgrid'] = [
                'transport' => 'sendgrid',
                'api_key' => $settings['sendgrid_api_key'] ?? env('SENDGRID_API_KEY'),
            ];
        } elseif ($settings['provider'] === 'ses') {
            $config['mailers']['ses'] = [
                'transport' => 'ses',
                'key' => $settings['ses_key'] ?? env('AWS_ACCESS_KEY_ID'),
                'secret' => $settings['ses_secret'] ?? env('AWS_SECRET_ACCESS_KEY'),
                'region' => $settings['ses_region'] ?? env('AWS_DEFAULT_REGION', 'us-east-1'),
            ];
        } elseif ($settings['provider'] === 'postmark') {
            $config['mailers']['postmark'] = [
                'transport' => 'postmark',
                'token' => $settings['postmark_token'] ?? env('POSTMARK_TOKEN'),
            ];
        }

        if (isset($settings['from_address'])) {
            $config['from']['address'] = $settings['from_address'];
        }
        if (isset($settings['from_name'])) {
            $config['from']['name'] = $settings['from_name'];
        }

        config(['mail' => $config]);
    }
}
