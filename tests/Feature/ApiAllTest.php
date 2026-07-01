<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ApiAllTest extends TestCase
{
    use DatabaseTransactions;

    protected function getAdminToken()
    {
        $user = User::where('username', 'admin')->first();
        if (!$user) {
            $this->markTestSkipped('Admin user not found');
        }
        $user->tokens()->delete();
        return $user->createToken('api-token')->plainTextToken;
    }

    protected function authHeaders($token)
    {
        return ['Authorization' => 'Bearer ' . $token];
    }

    // ─── Auth ────────────────────────────────────────────────

    public function test_login_returns_token()
    {
        User::where('username', 'admin')->firstOrFail();
        $response = $this->postJson('/api/login', [
            'username' => 'admin',
            'password' => '071799',
        ]);
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'user', 'token', 'redirect']);
        $this->assertNotNull($response->json('token'));
    }

    public function test_register_creates_user_and_returns_token()
    {
        $uniq = 'test' . time();
        $response = $this->postJson('/api/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => $uniq . '@example.com',
            'username' => $uniq,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'user', 'token']);
        $this->assertNotNull($response->json('token'));
    }

    public function test_logout_deletes_token()
    {
        $user = User::where('username', 'admin')->firstOrFail();
        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/logout');
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $this->assertCount(0, $user->tokens);
    }

    public function test_login_with_invalid_credentials_returns_422()
    {
        $response = $this->postJson('/api/login', [
            'username' => 'admin',
            'password' => 'wrongpassword',
        ]);
        $response->assertStatus(422);
    }

    // ─── User & Dashboard ────────────────────────────────────

    public function test_user_endpoint_returns_authenticated_user()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->getJson('/api/user');
        $response->assertStatus(200);
        $response->assertJsonStructure(['user' => ['id', 'username', 'email']]);
        $this->assertEquals('admin', $response->json('user.username'));
    }

    public function test_dashboard_returns_stats_and_routes()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->getJson('/api/dashboard');
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'user', 'stats' => ['totalSaved'], 'routes']);
    }

    // ─── Unauthenticated Access ──────────────────────────────

    public function test_unauthenticated_returns_401()
    {
        $this->getJson('/api/dashboard')->assertStatus(401);
        $this->getJson('/api/user')->assertStatus(401);
        $this->getJson('/api/transactions')->assertStatus(401);
        $this->getJson('/api/accounts')->assertStatus(401);
        $this->getJson('/api/categories')->assertStatus(401);
        $this->getJson('/api/budgets')->assertStatus(401);
        $this->getJson('/api/budget-plans')->assertStatus(401);
    }

    // ─── Accounts CRUD ───────────────────────────────────────

    public function test_accounts_index()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->getJson('/api/accounts');
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'accounts']);
    }

    public function test_create_account()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/accounts', [
                'name' => 'Test Account ' . time(),
                'initial_balance' => 500,
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $response->assertJsonStructure(['account' => ['id', 'name', 'balance']]);
        $this->assertEquals(500, $response->json('account.balance'));
    }

    public function test_update_account()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $account = $user->accounts()->create([
            'name' => 'Old Name',
            'initial_balance' => 100,
            'balance' => 100,
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->putJson('/api/accounts/' . $account->id, [
                'name' => 'Updated Name',
                'initial_balance' => 200,
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertEquals('Updated Name', $response->json('account.name'));
    }

    public function test_delete_account()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $account = $user->accounts()->create([
            'name' => 'To Delete',
            'initial_balance' => 0,
            'balance' => 0,
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->deleteJson('/api/accounts/' . $account->id);
        $response->assertStatus(200);
        $response->assertJson(['success' => true, 'message' => 'Account deleted.']);
    }

    public function test_create_account_without_name_returns_422()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/accounts', []);
        $response->assertStatus(422);
    }

    // ─── Categories CRUD ─────────────────────────────────────

    public function test_categories_index()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->getJson('/api/categories');
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'categories']);
    }

    public function test_create_category()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/categories', [
                'name' => 'Test Category ' . time(),
                'type' => 'expense',
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $response->assertJsonStructure(['category' => ['id', 'name', 'type']]);
        $this->assertEquals('expense', $response->json('category.type'));
    }

    public function test_update_category()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $category = $user->categories()->create([
            'name' => 'Old Category',
            'type' => 'expense',
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->putJson('/api/categories/' . $category->id, [
                'name' => 'Updated Category',
                'type' => 'income',
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertEquals('Updated Category', $response->json('category.name'));
        $this->assertEquals('income', $response->json('category.type'));
    }

    public function test_delete_category()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $category = $user->categories()->create([
            'name' => 'To Delete',
            'type' => 'expense',
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->deleteJson('/api/categories/' . $category->id);
        $response->assertStatus(200);
        $response->assertJson(['success' => true, 'message' => 'Category deleted.']);
    }

    public function test_create_category_with_invalid_type_returns_422()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/categories', [
                'name' => 'Invalid',
                'type' => 'invalid',
            ]);
        $response->assertStatus(422);
    }

    // ─── Transactions CRUD ───────────────────────────────────

    public function test_transactions_index()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->getJson('/api/transactions');
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'transactions']);
    }

    public function test_create_transaction()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $category = $user->categories()->create(['name' => 'TxCat', 'type' => 'expense']);
        $account = $user->accounts()->create(['name' => 'TxAcct', 'initial_balance' => 0, 'balance' => 0]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/transactions', [
                'account_id' => $account->id,
                'category_id' => $category->id,
                'type' => 'expense',
                'amount' => 50,
                'description' => 'Test expense',
                'date' => now()->format('Y-m-d H:i'),
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $response->assertJsonStructure(['transaction' => ['id', 'amount', 'type', 'account', 'category']]);
        $this->assertEquals(50, $response->json('transaction.amount'));
    }

    public function test_update_transaction()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $category = $user->categories()->create(['name' => 'UpdCat', 'type' => 'expense']);
        $account = $user->accounts()->create(['name' => 'UpdAcct', 'initial_balance' => 0, 'balance' => 0]);

        $transaction = $user->transactions()->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 100,
            'description' => 'Original',
            'date' => now()->format('Y-m-d H:i'),
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->putJson('/api/transactions/' . $transaction->id, [
                'type' => 'expense',
                'amount' => 200,
                'date' => now()->format('Y-m-d H:i'),
                'description' => 'Updated',
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertEquals(200, $response->json('transaction.amount'));
        $this->assertEquals('Updated', $response->json('transaction.description'));
    }

    public function test_delete_transaction()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $category = $user->categories()->create(['name' => 'DelCat', 'type' => 'expense']);
        $account = $user->accounts()->create(['name' => 'DelAcct', 'initial_balance' => 0, 'balance' => 0]);

        $transaction = $user->transactions()->create([
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 30,
            'description' => 'To delete',
            'date' => now()->format('Y-m-d H:i'),
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->deleteJson('/api/transactions/' . $transaction->id);
        $response->assertStatus(200);
        $response->assertJson(['success' => true, 'message' => 'Transaction deleted.']);
    }

    public function test_create_transaction_without_type_returns_422()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/transactions', [
                'amount' => 100,
                'date' => now()->format('Y-m-d'),
            ]);
        $response->assertStatus(422);
    }

    // ─── Budgets CRUD ────────────────────────────────────────

    public function test_budgets_index()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->getJson('/api/budgets');
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'budgets']);
    }

    public function test_create_budget()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();
        $category = $user->categories()->create(['name' => 'BudgetCat', 'type' => 'expense']);

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/budgets', [
                'category_id' => $category->id,
                'limit_amount' => 1000,
                'period' => 'monthly',
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $response->assertJsonStructure(['budget' => ['id', 'limit_amount', 'period', 'category']]);
        $this->assertEquals(1000, $response->json('budget.limit_amount'));
    }

    public function test_update_budget()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();
        $category = $user->categories()->create(['name' => 'UpdBgtCat', 'type' => 'expense']);

        $budget = $user->budgets()->create([
            'category_id' => $category->id,
            'limit_amount' => 500,
            'period' => 'monthly',
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->putJson('/api/budgets/' . $budget->id, [
                'category_id' => $category->id,
                'limit_amount' => 2000,
                'period' => 'yearly',
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertEquals(2000, $response->json('budget.limit_amount'));
        $this->assertEquals('yearly', $response->json('budget.period'));
    }

    public function test_delete_budget()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();
        $category = $user->categories()->create(['name' => 'DelBgtCat', 'type' => 'expense']);

        $budget = $user->budgets()->create([
            'category_id' => $category->id,
            'limit_amount' => 300,
            'period' => 'weekly',
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->deleteJson('/api/budgets/' . $budget->id);
        $response->assertStatus(200);
        $response->assertJson(['success' => true, 'message' => 'Budget deleted.']);
    }

    public function test_create_budget_without_limit_returns_422()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/budgets', [
                'period' => 'monthly',
            ]);
        $response->assertStatus(422);
    }

    // ─── Budget Plans + Items CRUD ───────────────────────────

    public function test_budget_plans_index()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->getJson('/api/budget-plans');
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'plans']);
    }

    public function test_create_budget_plan()
    {
        $token = $this->getAdminToken();
        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/budget-plans', [
                'name' => 'Vacation Plan',
                'budget' => 5000,
                'year' => 2026,
                'month' => 12,
            ]);
        $response->assertStatus(201);
        $response->assertJson(['success' => true, 'message' => 'Budget plan created.']);
        $response->assertJsonStructure(['plan' => ['id', 'name', 'items']]);
    }

    public function test_show_budget_plan()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $plan = $user->budgetPlans()->create([
            'name' => 'My Plan',
            'budget' => 1000,
            'year' => 2026,
            'month' => 7,
            'day' => 1,
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->getJson('/api/budget-plans/' . $plan->id);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $response->assertJsonStructure(['plan' => ['id', 'name', 'items']]);
    }

    public function test_update_budget_plan()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $plan = $user->budgetPlans()->create([
            'name' => 'Old Plan',
            'budget' => 1000,
            'year' => 2026,
            'month' => 7,
            'day' => 1,
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->putJson('/api/budget-plans/' . $plan->id, [
                'name' => 'Updated Plan',
                'budget' => 2500,
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertEquals('Updated Plan', $response->json('plan.name'));
    }

    public function test_delete_budget_plan()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $plan = $user->budgetPlans()->create([
            'name' => 'Delete Plan',
            'budget' => 500,
            'year' => 2026,
            'month' => 8,
            'day' => 1,
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->deleteJson('/api/budget-plans/' . $plan->id);
        $response->assertStatus(200);
        $response->assertJson(['success' => true, 'message' => 'Budget plan deleted.']);
    }

    // ─── Budget Plan Items ───────────────────────────────────

    public function test_create_budget_plan_item()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $plan = $user->budgetPlans()->create([
            'name' => 'Plan With Items',
            'budget' => 1000,
            'year' => 2026,
            'month' => 7,
            'day' => 1,
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/budget-plans/' . $plan->id . '/items', [
                'name' => 'Hotel',
                'amount' => 300,
                'date' => '2026-07-15',
            ]);
        $response->assertStatus(201);
        $response->assertJson(['success' => true, 'message' => 'Item added.']);
        $response->assertJsonStructure(['item' => ['id', 'name', 'amount'], 'plan']);
    }

    public function test_update_budget_plan_item()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $plan = $user->budgetPlans()->create([
            'name' => 'Item Update Plan',
            'budget' => 1000,
            'year' => 2026,
            'month' => 7,
            'day' => 1,
        ]);

        $item = $plan->items()->create([
            'name' => 'Flight',
            'amount' => 200,
            'date' => '2026-07-10',
            'type' => 'Expense',
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->putJson('/api/budget-plans/' . $plan->id . '/items/' . $item->id, [
                'amount' => 350,
                'name' => 'Flight Upgrade',
            ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertEquals(350, $response->json('item.amount'));
        $this->assertEquals('Flight Upgrade', $response->json('item.name'));
    }

    public function test_delete_budget_plan_item()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $plan = $user->budgetPlans()->create([
            'name' => 'Item Delete Plan',
            'budget' => 1000,
            'year' => 2026,
            'month' => 7,
            'day' => 1,
        ]);

        $item = $plan->items()->create([
            'name' => 'Souvenirs',
            'amount' => 50,
            'date' => '2026-07-20',
            'type' => 'Expense',
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->deleteJson('/api/budget-plans/' . $plan->id . '/items/' . $item->id);
        $response->assertStatus(200);
        $response->assertJson(['success' => true, 'message' => 'Item deleted.']);
        $response->assertJsonStructure(['plan']);
    }

    public function test_create_budget_plan_item_without_amount_returns_422()
    {
        $token = $this->getAdminToken();
        $user = User::where('username', 'admin')->firstOrFail();

        $plan = $user->budgetPlans()->create([
            'name' => 'Validation Plan',
            'budget' => 500,
            'year' => 2026,
            'month' => 7,
            'day' => 1,
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/budget-plans/' . $plan->id . '/items', [
                'name' => 'No Amount',
                'date' => '2026-07-01',
            ]);
        $response->assertStatus(422);
    }

    // ─── 403 Forbidden Tests ────────────────────────────────

    public function test_cannot_update_other_users_transaction()
    {
        $admin = User::where('username', 'admin')->firstOrFail();
        $otherUser = User::factory()->create(['username' => 'other_' . time()]);

        $token = $this->getAdminToken();

        $cat = $otherUser->categories()->create(['name' => 'OtherCat', 'type' => 'expense']);
        $acct = $otherUser->accounts()->create(['name' => 'OtherAcct', 'initial_balance' => 0, 'balance' => 0]);
        $tx = $otherUser->transactions()->create([
            'account_id' => $acct->id,
            'category_id' => $cat->id,
            'type' => 'expense',
            'amount' => 10,
            'date' => now()->format('Y-m-d H:i'),
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->putJson('/api/transactions/' . $tx->id, [
                'type' => 'expense',
                'amount' => 99,
                'date' => now()->format('Y-m-d H:i'),
            ]);
        $response->assertStatus(403);
    }

    public function test_cannot_delete_other_users_account()
    {
        $token = $this->getAdminToken();
        $otherUser = User::factory()->create(['username' => 'other_' . time()]);

        $acct = $otherUser->accounts()->create([
            'name' => 'Their Account',
            'initial_balance' => 0,
            'balance' => 0,
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->deleteJson('/api/accounts/' . $acct->id);
        $response->assertStatus(403);
    }

    public function test_cannot_update_other_users_category()
    {
        $token = $this->getAdminToken();
        $otherUser = User::factory()->create(['username' => 'other_' . time()]);

        $cat = $otherUser->categories()->create(['name' => 'TheirCat', 'type' => 'income']);

        $response = $this->withHeaders($this->authHeaders($token))
            ->putJson('/api/categories/' . $cat->id, [
                'name' => 'Hacked',
                'type' => 'expense',
            ]);
        $response->assertStatus(403);
    }
}
