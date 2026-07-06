<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\ActivityLog;
use App\Models\BudgetPlan;
use App\Models\BudgetPlanItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BudgetPlanController extends Controller
{
    public function index(Request $request)
    {
        $plans = $request->user()->budgetPlans()
            ->with('items')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'plans' => $plans]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'budget' => 'required|numeric|min:0',
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
            'day' => 'sometimes|integer|min:1|max:31',
            'box_color' => 'nullable|string|max:20',
            'text_color' => 'nullable|string|max:20',
        ]);

        $totalBalance = Account::where('user_id', $request->user()->id)->sum('balance');
        if ($validated['budget'] > $totalBalance) {
            return response()->json([
                'success' => false,
                'message' => 'Budget plan amount (₱' . number_format($validated['budget'], 2) . ') exceeds your total balance (₱' . number_format($totalBalance, 2) . ').',
                'errors' => ['budget' => ['Budget exceeds total balance.']],
            ], 422);
        }

        $plan = BudgetPlan::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'budget' => $validated['budget'],
            'year' => $validated['year'],
            'month' => $validated['month'],
            'day' => $validated['day'] ?? 1,
            'box_color' => $validated['box_color'] ?? null,
            'text_color' => $validated['text_color'] ?? null,
        ]);

        ActivityLog::log($request->user()->id, 'create_budget_plan', ['plan_id' => $plan->id, 'name' => $plan->name], $request);

        return response()->json([
            'success' => true,
            'message' => 'Budget plan created.',
            'plan' => $plan->load('items'),
        ], 201);
    }

    public function show(Request $request, BudgetPlan $plan)
    {
        if ($plan->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        return response()->json([
            'success' => true,
            'plan' => $plan->load('items'),
        ]);
    }

    public function update(Request $request, BudgetPlan $plan)
    {
        if ($plan->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'budget' => 'sometimes|numeric|min:0',
            'year' => 'sometimes|integer',
            'month' => 'sometimes|integer|min:1|max:12',
            'day' => 'sometimes|integer|min:1|max:31',
            'box_color' => 'nullable|string|max:20',
            'text_color' => 'nullable|string|max:20',
        ]);

        if (isset($validated['budget'])) {
            $totalBalance = Account::where('user_id', $request->user()->id)->sum('balance');
            if ($validated['budget'] > $totalBalance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Budget plan amount (₱' . number_format($validated['budget'], 2) . ') exceeds your total balance (₱' . number_format($totalBalance, 2) . ').',
                    'errors' => ['budget' => ['Budget exceeds total balance.']],
                ], 422);
            }
        }

        $plan->update($validated);

        ActivityLog::log($request->user()->id, 'update_budget_plan', ['plan_id' => $plan->id], $request);

        return response()->json([
            'success' => true,
            'message' => 'Budget plan updated.',
            'plan' => $plan->fresh()->load('items'),
        ]);
    }

    public function destroy(Request $request, BudgetPlan $plan)
    {
        if ($plan->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        ActivityLog::log($request->user()->id, 'delete_budget_plan', ['plan_id' => $plan->id], $request);

        $plan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Budget plan deleted.',
        ]);
    }

    public function storeItem(Request $request, BudgetPlan $plan)
    {
        if ($plan->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'type' => 'sometimes|string|in:Income,Expense',
            'notes' => 'nullable|string',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'archived' => 'sometimes|boolean',
        ]);

        $item = BudgetPlanItem::create([
            'budget_plan_id' => $plan->id,
            'name' => $validated['name'] ?? null,
            'category' => $validated['category'] ?? null,
            'type' => $validated['type'] ?? 'Expense',
            'notes' => $validated['notes'] ?? null,
            'amount' => $validated['amount'],
            'date' => $validated['date'],
            'archived' => $validated['archived'] ?? false,
        ]);

        ActivityLog::log($request->user()->id, 'create_budget_plan_item', null, $request);

        return response()->json([
            'success' => true,
            'message' => 'Item added.',
            'item' => $item,
            'plan' => $plan->fresh()->load('items'),
        ], 201);
    }

    public function updateItem(Request $request, BudgetPlan $plan, BudgetPlanItem $item)
    {
        if ($plan->user_id !== $request->user()->id || $item->budget_plan_id !== $plan->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'type' => 'sometimes|string|in:Income,Expense',
            'notes' => 'nullable|string',
            'amount' => 'sometimes|numeric|min:0.01',
            'date' => 'sometimes|date',
            'archived' => 'sometimes|boolean',
        ]);

        $item->update($validated);

        ActivityLog::log($request->user()->id, 'update_budget_plan_item', null, $request);

        return response()->json([
            'success' => true,
            'message' => 'Item updated.',
            'item' => $item->fresh(),
            'plan' => $plan->fresh()->load('items'),
        ]);
    }

    public function destroyItem(Request $request, BudgetPlan $plan, BudgetPlanItem $item)
    {
        if ($plan->user_id !== $request->user()->id || $item->budget_plan_id !== $plan->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        ActivityLog::log($request->user()->id, 'delete_budget_plan_item', null, $request);

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item deleted.',
            'plan' => $plan->fresh()->load('items'),
        ]);
    }
}
