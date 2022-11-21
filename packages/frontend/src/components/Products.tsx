export default function Products({ onAddToCart, products }: any) {
  return products?.map((x: any, idx: number) => (
    <article key={idx}>
      <header>
        <strong>{x.title}</strong>
      </header>
      <div className="grid">
        <img src={x.imageUrl} alt={x.title} />
        <h1>Price: {x.price}</h1>
      </div>
      <footer>
        {onAddToCart && (
          <button className="outline" onClick={() => onAddToCart(x.id)}>
            Add to cart
          </button>
        )}
      </footer>
    </article>
  ));
}
