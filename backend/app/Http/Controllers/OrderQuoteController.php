<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderQuoteRequest;
use App\Services\OrderQuoteService;
use Illuminate\Http\JsonResponse;

class OrderQuoteController extends Controller
{
    public function __invoke(OrderQuoteRequest $request, OrderQuoteService $orders): JsonResponse
    {
        return response()->json($orders->quote($request->validated()));
    }
}
