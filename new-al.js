// Spotify API constants
const clientId = '8b3279c55bd14a56a3a59e632a2c3e81'; // Your Spotify app client ID
const redirectUri = 'http://127.0.0.1:5500/callback'; // Redirect URI
const scope = 'user-top-read user-read-private user-read-email'; // Scopes

// Function to generate a random string
const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

// Generate code verifier
const codeVerifier = generateRandomString(64);
localStorage.setItem('code_verifier', codeVerifier);

// Function to hash the code verifier using SHA256
const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
};

// Function to base64 URL encode
const base64UrlEncode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};

// Generate code challenge
const generateCodeChallenge = async (codeVerifier) => {
    const hashed = await sha256(codeVerifier);
    return base64UrlEncode(hashed);
};

// Function to request user authorization
const requestAuthorization = async () => {
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const authUrl = new URL("https://accounts.spotify.com/authorize");
    const params = {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state: generateRandomString(16), // Generate a random state for CSRF protection
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
};

// Function to handle the callback after authentication
const handleCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
        console.error('Error during authentication:', error);
        return;
    }

    if (code) {
        const accessToken = await getAccessToken(code);
        if (accessToken) {
            fetchNewReleases(accessToken); // Fetch new releases after getting the token
        }
    }
};

// Function to get the access token
const getAccessToken = async (code) => {
    const codeVerifier = localStorage.getItem('code_verifier');

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }),
    };

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', payload);
        const data = await response.json();

        if (data.access_token) {
            console.log('Access Token:', data.access_token);
            localStorage.setItem('access_token', data.access_token); // Store the access token
            return data.access_token; // Return the access token
        } else {
            console.error('Error getting access token:', data);
        }
    } catch (error) {
        console.error('Error fetching access token:', error);
    }
};

// Function to fetch new releases using the access token
const fetchNewReleases = async (token) => {
    const response = await fetch('https://api.spotify.com/v1/browse/new-releases', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        console.log('New Releases:', data.albums.items);
        displayNewReleases(data.albums.items); // Call the function to display new releases
    } else {
        console.error('Error fetching new releases:', response.statusText);
    }
};

// Function to display new releases on the page
const displayNewReleases = (newReleases) => {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ''; // Clear previous content

    if (newReleases.length === 0) {
        outputDiv.innerHTML = '<p>No new releases available.</p>';
        return;
    }

    newReleases.forEach(album => {
        const albumDiv = document.createElement('div');
        albumDiv.innerHTML = `
            <h3>${album.name}</h3>
            <img src="${album.images[0].url}" alt="${album.name}" style="width: 100px; height: 100px;">
            <p>Release Date: ${album.release_date}</p>
            <p>Artists: ${album.artists.map(artist => artist.name).join(', ')}</p>
            <a href="${album.external_urls.spotify}" target="_blank">Listen on Spotify</a>
        `;
        outputDiv.appendChild(albumDiv);
    });
};

// Event listener for the login button
document.getElementById('login-btn').addEventListener('click', requestAuthorization);

// Check if this is the callback page and handle accordingly
if (window.location.href.includes('code=')) {
    handleCallback();
}
