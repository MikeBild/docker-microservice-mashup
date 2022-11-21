import { useQuery, useMutation } from '@apollo/client';
import { GET_ME, SHOPPING_CART_CHECKOUT } from '../lib/graphql';
import { useNavigate } from 'react-router-dom';
import Products from './Products';

export default function Cart() {
  const navigate = useNavigate();
  const { error, loading, data } = useQuery(GET_ME);
  const [shoppingCartCheckout] = useMutation(SHOPPING_CART_CHECKOUT);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  async function checkout() {
    await shoppingCartCheckout();
    navigate('/orders');
  }

  return (
    <>
      <div className="grid">
        <h4>Products total: {data?.me?.shoppingCart?.totalCount || 0}</h4>
        <h4>Total price: {data?.me?.shoppingCart?.totalPrice || 0}</h4>
      </div>
      {Boolean(data?.me?.shoppingCart?.totalCount) && <button onClick={checkout}>Checkout</button>}
      <h2>My cart</h2>
      <Products products={data?.me?.shoppingCart?.products} />
    </>
  );
}
