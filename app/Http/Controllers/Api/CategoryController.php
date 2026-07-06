<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::where('user_id', $request->user()->id)
            ->active()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'categories' => $categories]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')->where('user_id', $request->user()->id)],
            'type' => 'required|in:income,expense',
            'icon' => 'nullable|string|max:255',
        ]);

        $category = Category::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'type' => $request->type,
            'icon' => $request->icon,
            'sort_order' => Category::where('user_id', $request->user()->id)->max('sort_order') + 1,
        ]);

        ActivityLog::log($request->user()->id, 'create_category', ['category_id' => $category->id, 'name' => $category->name, 'type' => $category->type], $request);

        return response()->json(['success' => true, 'category' => $category]);
    }

    public function update(Request $request, Category $category)
    {
        if ($category->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')->where('user_id', $request->user()->id)->ignore($category->id)],
            'type' => 'required|in:income,expense',
            'icon' => 'nullable|string|max:255',
        ]);

        $category->update($request->only('name', 'type', 'icon'));

        ActivityLog::log($request->user()->id, 'update_category', ['category_id' => $category->id, 'name' => $category->name], $request);

        return response()->json(['success' => true, 'category' => $category]);
    }

    public function destroy(Request $request, Category $category)
    {
        if ($category->user_id !== $request->user()->id) {
            abort(403);
        }

        ActivityLog::log($request->user()->id, 'delete_category', ['category_id' => $category->id, 'name' => $category->name], $request);

        $category->delete();

        return response()->json(['success' => true, 'message' => 'Category deleted.']);
    }
}