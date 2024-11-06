const clientId = '8b3279c55bd14a56a3a59e632a2c3e81'; // Replace with your actual Spotify Client ID
const redirectUri = 'http://127.0.0.1:5500/homePage.html';
const scopes = 'user-top-read';


document.getElementById('login-btn').addEventListener('click', async () => {
  const codeVerifier = generateCodeVerifier();
  localStorage.setItem('code_verifier', codeVerifier);

  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

  window.location.href = authUrl;
});


window.addEventListener('load', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    const codeVerifier = localStorage.getItem('code_verifier');
    const token = await exchangeCodeForToken(code, codeVerifier);

    if (token) {
      fetchTopTracks(token); // Fetch and display the tracks
    }
  }
});

// Generate Code Verifier (PKCE)
function generateCodeVerifier() {
  const array = new Uint32Array(56 / 2);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

// Generate Code Challenge from Verifier
async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

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

// Fetch Top 5 Tracks
async function fetchTopTracks(token) {
  const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=5', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  displayTracks(data.items); // Display tracks after fetching
}

// Display Tracks in HTML
function displayTracks(tracks) {
  const trackDiv = document.getElementById('tracks');
  trackDiv.innerHTML = ''; // Clear previous content if any

  tracks.forEach(track => {
    const trackElement = document.createElement('p');
    trackElement.textContent = `${track.name} by ${track.artists.map(artist => artist.name).join(', ')}`;
    trackDiv.appendChild(trackElement);
  });
}
