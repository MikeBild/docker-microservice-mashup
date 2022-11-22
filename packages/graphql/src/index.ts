import 'dotenv/config';
import { randomUUID } from 'crypto';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import fetch from 'cross-fetch';
import { generateAccessToken, verifyAccessToken } from './lib/jwt';
import { AddressInfo } from 'net';
import { generate } from 'randomstring';
import auth from './router/auth';
import images from './router/images';

interface UserContext {
  user?: { username: string };
  origin?: string;
}

const DBURL = process.env.DBURL;
const typeDefs = `
  interface Entity {
    id: ID!
  }

  type Order {
    id: ID
    username: String
    products: [Product]
    orderAt: String
  }

  type User implements Entity {
    id: ID!
    username: String
    token: String
    shoppingCart: ShoppingCart
    orders: [Order]
  }

  type ShoppingCart implements Entity {
    id: ID!
    products: [Product]
    totalPrice: Float
    totalCount: Int
  }

  type Product implements Entity {
    id: ID!
    title: String
    price: Float
    imageUrl: String
  }

  type Query {
    me: User
    products: [Product]    
  }

  type Mutation {    
    shoppingCartAdd(productId: ID!): ShoppingCart    
    shoppingCartTransfer(fromId: ID!): User
    shoppingCartCheckout: User
  }
`;

const shoppingsCarts: any = {};
const resolvers = {
  Order: {
    products: async (parent: any, args: any, { user }: UserContext) => {
      const response = await fetch(`${DBURL}/products/_bulk_get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docs: parent.productIds?.map((x: any) => ({ id: x })).filter(Boolean),
        }),
      });
      const result = await response.json();
      const docs = result?.results?.reduce((c: any, n: any) => [...c, ...n.docs], []);
      return docs?.map((x: any) => ({ ...x.ok, id: x.ok._id }));
    },
  },
  User: {
    orders: async (parent: any, args: any, { user }: UserContext) => {
      const response = await fetch(`${DBURL}/orders/_find?include_docs=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: {
            username: { $eq: user?.username },
          },
        }),
      });
      const result = await response.json();
      return result?.docs?.map((x: any) => ({ ...x, id: x._id }));
    },
  },
  Product: {
    imageUrl: async (parent: any, args: any, { origin }: UserContext) => {
      return `${origin}/images/${parent.id}.jpg`;
    },
  },
  ShoppingCart: {
    totalCount: async (parent: any, args: any, { user }: UserContext) => {
      return parent?.productIds?.length || 0;
    },
    totalPrice: async (parent: any, args: any, { user }: UserContext) => {
      const shoppingCart = shoppingsCarts[user?.username!] || { id: user?.username!, productIds: [] };
      const response = await fetch(`${DBURL}/products/_bulk_get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docs: shoppingCart?.productIds?.map((x: any) => ({ id: x })).filter(Boolean),
        }),
      });
      const result = await response.json();
      const docs = result?.results?.reduce((c: any, n: any) => [...c, ...n.docs], []);
      const allProducts = docs?.map((x: any) => ({ ...x.ok, id: x.ok._id }));

      return allProducts?.reduce((c: any, n: any) => c + n.price, 0);
    },
    products: async (parent: any, args: any, { user }: UserContext) => {
      const shoppingCart = shoppingsCarts[user?.username!] || { id: user?.username!, productIds: [] };
      const response = await fetch(`${DBURL}/products/_all_docs?include_docs=true`);
      const result = await response.json();
      const allProducts = result?.rows?.map((x: any) => ({ ...x.doc, id: x.doc._id }));

      return shoppingCart?.productIds?.map((x: string) => allProducts.find((y: any) => x === y.id));
    },
  },
  Query: {
    me: async (parent: any, args: any, { user }: UserContext) => {
      const shoppingCart = shoppingsCarts[user?.username!] || { id: user?.username };
      return { ...user, shoppingCart, id: user?.username };
    },
    products: async (parent: any, args: any, { user }: UserContext) => {
      const response = await fetch(`${DBURL}/products/_all_docs?include_docs=true`);
      const result = await response.json();
      return result?.rows?.map((x: any) => ({ ...x.doc, id: x.doc._id }));
    },
  },
  Mutation: {
    shoppingCartAdd: async (parent: any, { productId }: any, { user }: UserContext) => {
      const shoppingCart = shoppingsCarts[user?.username!];
      if (!shoppingCart) shoppingsCarts[user?.username!] = { id: user?.username!, productIds: [] };

      shoppingsCarts[user?.username!].productIds = [...(shoppingsCarts[user?.username!].productIds || []), productId];

      return shoppingsCarts[user?.username!];
    },
    shoppingCartTransfer: async (parent: any, { fromId }: any, { user }: UserContext) => {
      shoppingsCarts[user?.username!] = shoppingsCarts[fromId];

      return {
        id: user?.username!,
        ...user,
        shoppingCart: { ...shoppingsCarts[user?.username!], id: user?.username! },
      };
    },
    shoppingCartCheckout: async (parent: any, args: any, { user }: UserContext) => {
      const shoppingCart = shoppingsCarts[user?.username!];
      const response = await fetch(`${DBURL}/orders/${randomUUID()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username,
          productIds: shoppingCart.productIds,
          orderAt: new Date().toUTCString(),
        }),
      });
      shoppingCart.productIds = null;

      return { ...user, shoppingCart, id: user?.username };
    },
  },
};

main();

async function main() {
  const app = express();
  app.use(cors({ origin: '*', methods: '*', allowedHeaders: '*' }));
  app.use(bodyParser.json());
  app.get('/healthcheck', (_, res) => {
    res.sendStatus(200);
  });
  app.use('/auth', auth);
  app.use('/images', images);

  const apolloServer = new ApolloServer<UserContext>({
    typeDefs,
    resolvers,
  });
  await apolloServer.start();

  app.use(
    '/',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const user: any = token
          ? await verifyAccessToken(token)
          : {
              username: generate({ length: 8, readable: true }),
            };
        return {
          origin: `${req.protocol}://${req.headers.host}`,
          user: { ...user, token: token || generateAccessToken(user.username) },
        };
      },
    })
  );

  const server = app.listen(process.env.PORT, () => {
    const { port } = server.address() as AddressInfo;
    console.log(`GraphQL server running on http://localhost:${port}.`);
  });

  process.on('SIGTERM', onExit);
  process.on('SIGINT', onExit);

  async function onExit() {
    await apolloServer.stop();
    server.close(() => {
      console.log('GraphQL server shutdown.');
      process.exit(0);
    });
  }
}
