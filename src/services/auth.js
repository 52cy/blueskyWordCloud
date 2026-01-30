export const login = async (identifier, password) => {
    // Defaulting to bsky.social for now as it covers most users.
    // In a full app, we would resolve the DID first to find the PDS.
    // Use relative path for proxy
    const url = `/xrpc/com.atproto.server.createSession`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier,
                password,
            }),
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data; // contains accessJwt, did, handle, etc.
    } catch (error) {
        console.error('Auth Error:', error);
        throw error;
    }
};
