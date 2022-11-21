import { useQuery } from '@apollo/client';
import { GET_ORDERS } from '../lib/graphql';

export default function Orders() {
  const { error, loading, data } = useQuery(GET_ORDERS);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return data?.me?.orders?.map((x: any, idx: number) => (
    <article key={idx}>
      <header>
        <div className="grid">
          <div>
            <strong>{x.orderAt}</strong>
          </div>
          <div>ID: {x.id}</div>
        </div>
      </header>

      <div>Products: {x.products?.length || 0}</div>
    </article>
  ));
}
