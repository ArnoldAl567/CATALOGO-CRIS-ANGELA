<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'categoria' => ['nullable', 'string', 'max:64', 'exists:categories,id'],
            'q' => ['nullable', 'string', 'max:120'],
            'min' => ['nullable', 'integer', 'min:0'],
            'max' => ['nullable', 'integer', 'min:0'],
            'orden' => ['nullable', Rule::in(['asc', 'desc'])],
            'page' => ['nullable', 'integer', 'min:1', 'max:100000'],
        ]);
        $query = Product::query()->select('products.*')
            ->join('categories', 'categories.id', '=', 'products.category_id');
        if (!empty($filters['categoria'])) $query->where('category_id', $filters['categoria']);
        if (isset($filters['min'])) $query->where('price_cents', '>=', $filters['min']);
        if (isset($filters['max'])) $query->where('price_cents', '<=', $filters['max']);

        // Fold Spanish accents on both sides without requiring a PostgreSQL extension.
        $name = 'products.name';
        foreach (['á'=>'a', 'é'=>'e', 'í'=>'i', 'ó'=>'o', 'ú'=>'u', 'ü'=>'u', 'ñ'=>'n',
            'Á'=>'a', 'É'=>'e', 'Í'=>'i', 'Ó'=>'o', 'Ú'=>'u', 'Ü'=>'u', 'Ñ'=>'n'] as $accent => $plain) {
            $name = "REPLACE($name, '$accent', '$plain')";
        }
        foreach (preg_split('/\s+/u', trim(Str::ascii(mb_strtolower($filters['q'] ?? ''))), -1, PREG_SPLIT_NO_EMPTY) as $word) {
            $word = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $word);
            $query->whereRaw("LOWER($name) LIKE ? ESCAPE '!'", ['%'.$word.'%']);
        }
        if (!empty($filters['orden'])) $query->orderBy('price_cents', $filters['orden']);
        $query->orderBy('categories.position')->orderBy('products.position')->orderBy('products.id');
        $page = $query->paginate(12);
        if ($page->currentPage() > $page->lastPage()) {
            $page = $query->paginate(12, ['products.*'], 'page', $page->lastPage());
        }
        return response()->json([
            'productos' => ProductResource::collection($page->items())->resolve($request),
            'total' => $page->total(), 'pagina' => $page->currentPage(),
            'paginas' => $page->lastPage(), 'porPagina' => $page->perPage(),
            'desde' => $page->firstItem(), 'hasta' => $page->lastItem(),
        ])->header('Cache-Control', 'public, max-age=15, s-maxage=60, stale-while-revalidate=60');
    }

    public function selection(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'max:100'],
            'ids.*' => ['required', 'string', 'max:64', 'distinct'],
        ]);
        return response()->json([
            'productos' => ProductResource::collection(Product::query()->whereIn('id', $data['ids'])->get())->resolve($request),
        ]);
    }
}
