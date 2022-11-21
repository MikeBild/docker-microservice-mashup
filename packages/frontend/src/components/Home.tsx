import { useQuery, useMutation } from '@apollo/client';
import { GET_PRODUCTS, SHOPPING_CART_ADD } from '../lib/graphql';
import Products from './Products';

export default function Home() {
  const [shoppingCartAddMutation] = useMutation(SHOPPING_CART_ADD);
  const { error, loading, data } = useQuery(GET_PRODUCTS);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;
  return (
    <Products
      products={data?.products}
      onAddToCart={(productId: string) => shoppingCartAddMutation({ variables: { productId } })}
    />
  );
}
