import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function Navigation() {
  const { user, onLogout, shoppingCartCount } = useAuth();

  return (
    <nav>
      <ul>
        <li>
          <strong>
            <NavLink to="/">Shop</NavLink>
          </strong>
        </li>
      </ul>
      <ul>
        <li>
          <NavLink to="/home">Products</NavLink>
        </li>
        <li>
          <NavLink to="/cart">Cart ({shoppingCartCount})</NavLink>
        </li>
        <li>
          <NavLink to="/orders">My orders</NavLink>
        </li>
        <li>
          {!user && <NavLink to="/login">Login</NavLink>}
          {user && (
            <a href="#" onClick={() => onLogout()}>
              Logout {user}
            </a>
          )}
        </li>
      </ul>
    </nav>
  );
}
