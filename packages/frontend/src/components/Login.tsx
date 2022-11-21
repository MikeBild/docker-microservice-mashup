import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function Login() {
  const { onLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div>
      <div>
        <label>
          Username
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Password
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
      </div>
      <div>
        <input type="submit" value="login" onClick={() => onLogin(username, password)} />
      </div>
    </div>
  );
}
