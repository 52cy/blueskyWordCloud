import React, { useState } from 'react';
import { login } from '../services/auth';
import './Login.css';

const Login = ({ onLogin }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const session = await login(identifier, password);
            onLogin(session);
        } catch (err) {
            setError('Login failed. Please check your handle and app password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Bluesky Event Monitor</h1>
                <p>Login required for historical search</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Handle (e.g. alice.bsky.social)</label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="username.bsky.social"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>App Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="xxxx-xxxx-xxxx-xxxx"
                            required
                        />
                        <small>
                            Create one in Settings &gt; Advanced &gt; App Passwords.<br />
                            Do NOT use your main password.
                        </small>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
