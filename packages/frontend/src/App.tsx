import { Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Home from './components/Home';
import Cart from './components/Cart';
import Orders from './components/Orders';
import NoMatch from './components/NoMatch';
import './App.css';

export default function App() {
  return (
    <>
      <header className="container">
        <Navigation />
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="home" element={<Home />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<Orders />} />
          <Route path="login" element={<Login />} />
          <Route path="*" element={<NoMatch />} />
        </Routes>
      </main>
    </>
  );
}
