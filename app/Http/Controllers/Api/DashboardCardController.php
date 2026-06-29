<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DashboardCard;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DashboardCardController extends Controller
{
    public function index(Request $request)
    {
        $cards = $request->user()->dashboardCards()->orderBy('sort_order')->get();

        return response()->json([
            'success' => true,
            'cards' => $cards,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'card_type' => ['required', 'string', Rule::in([
                'total_balance', 'income', 'expenses', 'recent_transactions',
                'accounts_summary', 'budget_summary', 'monthly_income',
                'monthly_expenses', 'custom',
            ])],
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:100',
            'settings' => 'nullable|array',
        ]);

        $maxOrder = $request->user()->dashboardCards()->max('sort_order') ?? 0;

        $card = DashboardCard::create([
            'user_id' => $request->user()->id,
            'card_type' => $validated['card_type'],
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'sort_order' => $maxOrder + 1,
            'settings' => $validated['settings'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard card created.',
            'card' => $card,
        ], 201);
    }

    public function update(Request $request, DashboardCard $card)
    {
        if ($card->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'card_type' => ['sometimes', 'string', Rule::in([
                'total_balance', 'income', 'expenses', 'recent_transactions',
                'accounts_summary', 'budget_summary', 'monthly_income',
                'monthly_expenses', 'custom',
            ])],
            'title' => 'sometimes|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'sort_order' => 'sometimes|integer|min:0',
            'settings' => 'nullable|array',
            'is_visible' => 'sometimes|boolean',
        ]);

        $card->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard card updated.',
            'card' => $card->fresh(),
        ]);
    }

    public function destroy(Request $request, DashboardCard $card)
    {
        if ($card->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $card->delete();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard card deleted.',
        ]);
    }
}
