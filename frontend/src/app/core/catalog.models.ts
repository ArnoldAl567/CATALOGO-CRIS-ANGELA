export interface Category {
  id: string;
  nombre: string;
  foto: string;
  tema: string;
  texto: string;
}

export interface VariantGroup {
  nombre: string;
  valores: string[];
}

export interface Product {
  id: string;
  categoria: string;
  nombre: string;
  precio: number;
  descripcion: string;
  caracteristicas: string[];
  opciones: VariantGroup[];
  fotos: string[];
  porUnidad: boolean;
}

export interface Catalog {
  tienda: { nombre: string; telefono: string; whatsapp: string };
  categorias: Category[];
  productos: Product[];
  destacados: string[];
}

export interface CatalogQuery {
  category: string;
  search: string;
  range: string;
  sort: string;
  page: number;
}

export interface ProductPage {
  productos: Product[];
  total: number;
  pagina: number;
  paginas: number;
  porPagina: number;
  desde: number | null;
  hasta: number | null;
}

export interface CartItem {
  id: string;
  choices: string[];
  quantity: number;
}

export interface CartLine extends CartItem {
  product: Product;
  theme: string;
  variant: string;
  subtotal: number;
}

export interface Order {
  cliente: string;
  notas: string;
  items: CartItem[];
}

export interface Quote {
  subtotal: number;
  total: number;
  whatsapp: string;
}
