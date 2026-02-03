<?php

use App\Models\User;

describe('Authentication', function () {
    
    describe('Registration', function () {
        it('can register a new user', function () {
            $response = $this->postJson('/api/auth/register', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
            ]);

            $response->assertStatus(201)
                ->assertJsonStructure([
                    'user' => ['id', 'name', 'email'],
                    'message',
                ]);

            $this->assertDatabaseHas('users', [
                'email' => 'test@example.com',
            ]);
        });

        it('validates required fields on registration', function () {
            $response = $this->postJson('/api/auth/register', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['name', 'email', 'password']);
        });

        it('prevents duplicate email registration', function () {
            User::factory()->create(['email' => 'test@example.com']);

            $response = $this->postJson('/api/auth/register', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
        });
    });

    describe('Login', function () {
        it('can login with valid credentials', function () {
            $user = User::factory()->create([
                'password' => bcrypt('Password123!'),
            ]);

            $response = $this->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'Password123!',
            ]);

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'user' => ['id', 'name', 'email'],
                ]);
        });

        it('fails with invalid credentials', function () {
            $user = User::factory()->create([
                'password' => bcrypt('Password123!'),
            ]);

            $response = $this->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'WrongPassword123!',
            ]);

            $response->assertStatus(401);
        });
    });

    describe('Logout', function () {
        it('can logout authenticated user', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user, 'sanctum')
                ->postJson('/api/auth/logout');

            $response->assertStatus(200)
                ->assertJson(['message' => 'Logged out successfully']);
        });
    });

    describe('Current User', function () {
        it('returns authenticated user data', function () {
            $user = User::factory()->create();

            $response = $this->actingAs($user, 'sanctum')
                ->getJson('/api/auth/user');

            $response->assertStatus(200)
                ->assertJson([
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                    ],
                ]);
        });

        it('returns 401 for unauthenticated request', function () {
            $response = $this->getJson('/api/auth/user');

            $response->assertStatus(401);
        });
    });
});
