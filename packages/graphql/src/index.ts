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
    description: String    
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

const resolvers = {
  Order: {
    username: async (parent: any, args: any, { user }: UserContext) => {
      return user?.username;
    },
    products: async (parent: any, args: any, { user }: UserContext) => {
      //TODO: fetch products as bulk
    },
  },
  User: {
    shoppingCart: async (parent: any, args: any, { user }: UserContext) => {
      try {
        const warenkorb = await tryFetchWarenkorb(user?.username!);
        return { ...warenkorb };
      } catch (err) {
        console.error(err);
        return null;
      }
    },
    orders: async (parent: any, args: any, { user }: UserContext) => {
      const result = await fetch(`${process.env.ORDERS_URL}/besteller/${user?.username}`);
      const bestellung = await result.json();
      return bestellung.items;
    },
  },
  Product: {
    title: (parent: any) => {
      return parent.titel;
    },
    price: (parent: any) => {
      return parent.preis;
    },
    description: (parent: any) => {
      return parent.beschreibung;
    },
    imageUrl: (parent: any) => {
      return parent.bild;
    },
  },
  ShoppingCart: {
    totalCount: async (parent: any, args: any, { user }: UserContext) => {
      return parent?.produkte?.length || 0;
    },
    totalPrice: async (parent: any, args: any, { user }: UserContext) => {
      return parent?.produkte?.reduce((c: number, n: any) => c + n.preis, 0.0);
    },
    products: (parent: any) => {
      return parent.produkte;
    },
  },
  Query: {
    me: async (parent: any, args: any, { user }: UserContext) => {
      const shoppingCart = await tryFetchWarenkorb(user?.username!);
      return { ...user, id: user?.username, shoppingCart };
    },
    products: async (parent: any, args: any, { user }: UserContext) => {
      const result = await fetch(`${process.env.PRODUCTS_URL}/produkte`);
      const products = await result.json();

      return products.items.map((x: any) => ({
        ...x,
        title: x.titel,
        price: x.preis,
        imageUrl: x.bild,
        description: x.beschreibung,
      }));
    },
  },
  Mutation: {
    shoppingCartAdd: async (parent: any, { productId }: any, { user }: UserContext) => {
      const existingWarenkorb = await tryFetchWarenkorb(user?.username!);
      await fetch(`${process.env.SHOPPINGCART_URL}/warenkorb/${user?.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...existingWarenkorb,
          produkte: [...existingWarenkorb.produkte.map((x: any) => x.id), productId],
        }),
      });

      return await tryFetchWarenkorb(user?.username!);
    },
    shoppingCartCheckout: async (parent: any, args: any, { user }: UserContext) => {
      const warenkorb = await tryFetchWarenkorb(user?.username!);
      const order = {
        bestellerId: user?.username,
        preis: warenkorb.produkte.reduce((c: number, n: any) => c + n.preis, 0.0),
        produkte: warenkorb.produkte.reduce(
          (c: any, n: any) => ({
            ...c,
            [n.id]: (c[n.id] || 0) + 1,
          }),
          {}
        ),
      };

      const result = await fetch(`${process.env.ORDERS_URL}/bestellungen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      const data = await result.json();
      return { ...user, ...data };
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

async function tryFetchWarenkorb(id: string) {
  const result = await fetch(`${process.env.SHOPPINGCART_URL}/warenkorb/${id}`);
  if (result.status !== 200)
    return {
      id,
      produkte: [],
    };

  const warenkorb = await result.json();

  const produktePromises = warenkorb.produkte
    .filter((x: string) => parseInt(x))
    .filter(Boolean)
    .map(async (x: string) => {
      const result = await fetch(`${process.env.PRODUCTS_URL}/produkte/${x}`);
      return await result.json();
    });

  const produkte = await Promise.all(produktePromises);

  return { ...warenkorb, produkte: produkte.filter(Boolean) };
}
