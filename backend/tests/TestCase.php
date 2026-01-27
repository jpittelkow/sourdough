<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Setup the test environment.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Add any global test setup here
    }

    /**
     * Create an authenticated user for testing.
     */
    protected function actingAsUser(array $attributes = []): self
    {
        $user = \App\Models\User::factory()->create($attributes);
        return $this->actingAs($user, 'sanctum');
    }

    /**
     * Create an authenticated admin user for testing.
     */
    protected function actingAsAdmin(array $attributes = []): self
    {
        return $this->actingAsUser(array_merge(['is_admin' => true], $attributes));
    }
}
