import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { CatalogApi } from '../core/catalog.api';
import { price } from '../core/catalog-format';
import { CartItem, Quote } from '../core/catalog.models';
import { closeOnBackdrop } from '../shared/dialog-backdrop';
import { CartStore, maxQuantity } from './cart.store';

@Component({
  selector: 'store-cart-dialog',
  templateUrl: './cart-dialog.html',
})
export class CartDialog implements AfterViewInit {
  readonly store = inject(CartStore);
  private readonly api = inject(CatalogApi);
  private readonly destroy = inject(DestroyRef);
  private readonly cart = viewChild.required<ElementRef<HTMLDialogElement>>('cart');
  private readonly order = viewChild.required<ElementRef<HTMLDialogElement>>('order');
  readonly closed = output<void>();
  readonly explore = output<void>();
  readonly price = price;
  readonly maxQuantity = maxQuantity;
  readonly closeOnBackdrop = closeOnBackdrop;
  readonly pending = signal(false);
  readonly error = signal('');
  readonly revisedQuote = signal<{ quote: Quote; items: CartItem[] } | null>(null);
  private quoteRequest?: Subscription;

  ngAfterViewInit() {
    this.cart().nativeElement.showModal();
  }

  submit(event: SubmitEvent) {
    event.preventDefault();
    if (this.pending()) return;
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const items = this.store.payload();
    const total = this.store.total();
    const cliente = String(data.get('cliente') ?? '').trim();
    if (!cliente) {
      this.error.set('Escribe tu nombre.');
      return;
    }
    this.pending.set(true);
    this.error.set('');
    this.revisedQuote.set(null);
    this.quoteRequest = this.api.quote({ cliente, notas: String(data.get('notas') ?? '').trim(), items })
      .pipe(takeUntilDestroyed(this.destroy), finalize(() => this.pending.set(false)))
      .subscribe({
        next: (quote) => {
          if (!this.order().nativeElement.open) return;
          if (this.store.payload() !== items) {
            this.error.set('El carrito cambió. Revisa los productos y vuelve a intentarlo.');
          } else if (quote.total !== total) {
            this.revisedQuote.set({ quote, items });
          } else {
            window.location.assign(quote.whatsapp);
          }
        },
        error: (error: HttpErrorResponse) => {
          const validation = error.error?.errors;
          this.error.set(error.status === 422 && validation
            ? String(Object.values(validation).flat()[0])
            : 'No pudimos preparar el pedido. Intenta nuevamente.');
        },
      });
  }

  clearQuote() {
    this.error.set('');
    this.revisedQuote.set(null);
  }

  cancelQuote() {
    this.quoteRequest?.unsubscribe();
    this.clearQuote();
  }

  confirmRevisedQuote(event: MouseEvent) {
    if (this.revisedQuote()?.items === this.store.payload()) return;
    event.preventDefault();
    this.revisedQuote.set(null);
    this.error.set('El carrito cambió. Revisa los productos y vuelve a intentarlo.');
  }
}
