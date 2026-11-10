<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'categoria' => $this->category_id,
            'nombre' => $this->name,
            'precio' => $this->price_cents,
            'descripcion' => $this->description,
            'caracteristicas' => $this->features,
            'opciones' => $this->options,
            'fotos' => $this->images,
            'porUnidad' => $this->sold_by_unit,
        ];
    }
}
