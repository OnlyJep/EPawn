<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Budget;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $budgets = Budget::where('user_id', $request->user()->id)
            ->with('category:id,name')
            ->get();

        return response()->json(['success' => true, 'budgets' => $budgets]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'limit_amount' => 'required|numeric|min:0',
            'period' => 'required|in:monthly,weekly,yearly',
        ]);

        $budget = Budget::create([
            'user_id' => $request->user()->id,
            'category_id' => $request->category_id,
            'limit_amount' => $request->limit_amount,
            'period' => $request->period,
        ]);

        ActivityLog::log($request->user()->id, 'create_budget', ['budget_id' => $budget->id], $request);

        return response()->json(['success' => true, 'budget' => $budget->load('category:id,name')]);
    }

    public function update(Request $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'limit_amount' => 'required|numeric|min:0',
            'period' => 'required|in:monthly,weekly,yearly',
        ]);

        $budget->update($request->only('category_id', 'limit_amount', 'period'));

        ActivityLog::log($request->user()->id, 'update_budget', ['budget_id' => $budget->id], $request);

        return response()->json(['success' => true, 'budget' => $budget->fresh()->load('category:id,name')]);
    }

    public function destroy(Request $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            abort(403);
        }

        ActivityLog::log($request->user()->id, 'delete_budget', ['budget_id' => $budget->id], $request);

        $budget->delete();

        return response()->json(['success' => true, 'message' => 'Budget deleted.']);
    }
}