const clientId = '8b3279c55bd14a56a3a59e632a2c3e81'; // Replace with your actual Spotify Client ID
const redirectUri = 'http://127.0.0.1:5500/homePage.html';
const scopes = 'user-top-read';

window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
  
    if (code) {
        const codeVerifier = localStorage.getItem('code_verifier');
        const token = await exchangeCodeForToken(code, codeVerifier);
  
        if (token) {
            displayNewReleases(token); // Pass the token to display new releases
        }
    }
});

// Exchange Authorization Code for Access Token
async function exchangeCodeForToken(code, codeVerifier) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier
        })
    });
    const data = await response.json();
    return data.access_token;
}

// Fetch new releases using the access token
const fetchNewReleases = async (accessToken, limit = 10, offset = 0) => {
    const url = `https://api.spotify.com/v1/browse/new-releases?limit=${limit}&offset=${offset}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
    }

    const data = await response.json();
    return data.albums.items; // Return the array of albums
};

// Function to display new releases on the page
const displayNewReleases = async (accessToken) => {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ''; // Clear previous content

    try {
        const newReleases = await fetchNewReleases(accessToken);

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
    } catch (error) {
        outputDiv.innerHTML = `<p>Error fetching new releases. Please try again later.</p>`;
        console.error(error);
    }
};
