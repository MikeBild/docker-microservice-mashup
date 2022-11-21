import { gql } from '@apollo/client';

export const GET_ME = gql`
  query GetMe {
    me {
      id
      username
      token
      shoppingCart {
        id
        totalPrice
        totalCount
        products {
          id
          title
          price
          imageUrl
        }
      }
    }
  }
`;

export const GET_ORDERS = gql`
  query GetOrders {
    me {
      id
      username
      token
      orders {
        id
        orderAt
        username
        products {
          id
          title
          price
          imageUrl
        }
      }
    }
  }
`;

export const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      title
      price
      imageUrl
    }
  }
`;

export const SHOPPING_CART_ADD = gql`
  mutation ShoppingCartAdd($productId: ID!) {
    shoppingCartAdd(productId: $productId) {
      id
      totalPrice
      totalCount
      products {
        id
        title
        price
        imageUrl
      }
    }
  }
`;

export const SHOPPING_CART_TRANSFER = gql`
  mutation ShoppingCartTransfer($fromId: ID!) {
    shoppingCartTransfer(fromId: $fromId) {
      id
      token
      username
      shoppingCart {
        id
        totalPrice
        totalCount
        products {
          id
          title
          price
          imageUrl
        }
      }
    }
  }
`;

export const SHOPPING_CART_CHECKOUT = gql`
  mutation ShoppingCartCheckout {
    shoppingCartCheckout {
      id
      token
      username
      shoppingCart {
        id
        totalPrice
        totalCount
        products {
          id
          title
          price
          imageUrl
        }
      }
      orders {
        id
        orderAt
        username
        products {
          id
          title
          price
          imageUrl
        }
      }
    }
  }
`;
