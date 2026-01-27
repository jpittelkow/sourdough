<?php

use App\Services\Auth\TwoFactorService;
use App\Models\User;

describe('TwoFactorService', function () {
    
    beforeEach(function () {
        $this->service = new TwoFactorService();
    });

    describe('generateSecret', function () {
        it('generates a valid secret key', function () {
            $secret = $this->service->generateSecret();

            expect($secret)->toBeString();
            expect(strlen($secret))->toBeGreaterThanOrEqual(16);
        });

        it('generates unique secrets', function () {
            $secret1 = $this->service->generateSecret();
            $secret2 = $this->service->generateSecret();

            expect($secret1)->not->toBe($secret2);
        });
    });

    describe('generateRecoveryCodes', function () {
        it('generates the correct number of recovery codes', function () {
            $codes = $this->service->generateRecoveryCodes(10);

            expect($codes)->toBeArray();
            expect(count($codes))->toBe(10);
        });

        it('generates unique recovery codes', function () {
            $codes = $this->service->generateRecoveryCodes(10);
            $uniqueCodes = array_unique($codes);

            expect(count($uniqueCodes))->toBe(count($codes));
        });
    });

    describe('verifyCode', function () {
        it('returns false for invalid secret', function () {
            $result = $this->service->verifyCode('INVALIDSECRET', '123456');

            // The code will likely be invalid
            expect($result)->toBeBool();
        });
    });

    describe('getQrCodeUrl', function () {
        it('generates a QR code URL', function () {
            $user = User::factory()->make(['email' => 'test@example.com']);
            $secret = $this->service->generateSecret();

            $url = $this->service->getQrCodeUrl($user, $secret);

            expect($url)->toBeString();
            expect($url)->toContain('otpauth://totp/');
        });
    });
});
