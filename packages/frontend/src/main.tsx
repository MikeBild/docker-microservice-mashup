import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';
import { setContext } from '@apollo/client/link/context';
import { AuthProvider } from './components/AuthProvider';
import App from './App';
import '@picocss/pico';

const httpLink = createHttpLink({ uri: import.meta.env.VITE_GRAPHQL_URL });
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider client={client}>
        <ApolloProvider client={client}>
          <App />
        </ApolloProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
