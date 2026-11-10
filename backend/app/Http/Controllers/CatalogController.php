<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $categories = Category::query()->orderBy('position')->orderBy('id')->get();
        $featured = Product::query()->where('featured', true)->orderBy('position')->orderBy('id')->limit(4)->get();
        $products = $featured->merge(Product::query()->whereIn('id', ['p07', 'c04'])->get());

        return response()->json([
            'tienda' => [
                'nombre' => config('store.name'),
                'telefono' => config('store.phone_label'),
                'whatsapp' => 'https://wa.me/'.config('store.whatsapp'),
            ],
            'categorias' => $categories->map(fn (Category $category) => [
                'id' => $category->id,
                'nombre' => $category->name,
                'foto' => $category->image,
                'tema' => $category->theme,
                'texto' => $category->caption,
            ])->values(),
            'productos' => ProductResource::collection($products)->resolve($request),
            'destacados' => $featured->pluck('id')->values(),
        ]);
    }
}
