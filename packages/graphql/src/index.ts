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

const besteller: any = {
  qjpS3mFY: { items: [{ id: '1', produkte: ['a', 'b'], orderAt: new Date().toUTCString() }] },
};

const produkte: any = {
  items: [
    { id: 'a', title: 'A', price: 10.11 },
    { id: 'b', title: 'A', price: 20.22 },
  ],
};

const warenkorb: any = {
  qjpS3mFY: { producte: ['a', 'b'] },
};

const resolvers = {
  Order: {
    username: async (parent: any, args: any, { user }: UserContext) => {
      return user?.username;
    },
    products: async (parent: any, args: any, { user }: UserContext) => {},
  },
  User: {
    orders: async (parent: any, args: any, { user }: UserContext) => {
      const bestellerId = user?.username!;
      return besteller[bestellerId].items;
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
    totalPrice: async (parent: any, args: any, { user }: UserContext) => {},
    products: async (parent: any, args: any, { user }: UserContext) => {},
  },
  Query: {
    me: async (parent: any, args: any, { user }: UserContext) => {
      return {
        ...user,
      };
    },
    products: async (parent: any, args: any, { user }: UserContext) => {
      return produkte.items;
    },
  },
  Mutation: {
    shoppingCartAdd: async (parent: any, { productId }: any, { user }: UserContext) => {},
    shoppingCartTransfer: async (parent: any, { fromId }: any, { user }: UserContext) => {},
    shoppingCartCheckout: async (parent: any, args: any, { user }: UserContext) => {},
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
