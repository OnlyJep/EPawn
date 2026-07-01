<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ApiAuthTest extends TestCase
{
    use DatabaseTransactions;

    public function test_login_returns_token()
    {
        $user = User::where('username', 'admin')->first();
        if (!$user) {
            $this->markTestSkipped('Admin user not found');
        }

        $response = $this->postJson('/api/login', [
            'username' => 'admin',
            'password' => '071799',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'user',
            'token',
            'redirect',
        ]);

        $token = $response->json('token');
        $this->assertNotNull($token);
    }

    public function test_dashboard_with_token()
    {
        $user = User::where('username', 'admin')->first();
        if (!$user) {
            $this->markTestSkipped('Admin user not found');
        }

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/dashboard');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'user',
            'stats',
            'routes',
        ]);
    }

    public function test_transactions_index_with_token()
    {
        $user = User::where('username', 'admin')->first();
        if (!$user) {
            $this->markTestSkipped('Admin user not found');
        }

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/transactions');

        $response->assertStatus(200);
    }

    public function test_user_endpoint_with_token()
    {
        $user = User::where('username', 'admin')->first();
        if (!$user) {
            $this->markTestSkipped('Admin user not found');
        }

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/user');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'user',
        ]);
    }

    public function test_update_transaction_with_token()
    {
        $user = User::where('username', 'admin')->first();
        if (!$user) {
            $this->markTestSkipped('Admin user not found');
        }

        $category = $user->categories()->firstOrCreate([
            'user_id' => $user->id,
            'name' => 'Test Category',
            'type' => 'expense',
        ]);
        $account = $user->accounts()->firstOrCreate([
            'user_id' => $user->id,
            'name' => 'Test Account',
            'initial_balance' => 0,
        ]);

        $transaction = $user->transactions()->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 100,
            'description' => 'Test transaction',
            'date' => now()->format('Y-m-d H:i'),
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->putJson('/api/transactions/' . $transaction->id, [
            'type' => 'expense',
            'amount' => 150,
            'date' => now()->format('Y-m-d H:i'),
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
        $this->assertEquals(150, $response->json('transaction.amount'));
    }

    public function test_unauthenticated_returns_401()
    {
        $response = $this->getJson('/api/dashboard');
        $response->assertStatus(401);
    }
}
