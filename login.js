const clientId = '8b3279c55bd14a56a3a59e632a2c3e81'; 
const redirectUri = 'http://127.0.0.1:5500/homePage.html'; 
const scopes = 'user-top-read';

// Step 1: Handle the login process
document.getElementById('login-btn').addEventListener('click', async () => {
  const codeVerifier = generateCodeVerifier();
  localStorage.setItem('code_verifier', codeVerifier);

  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

  window.location.href = authUrl;
});

// Step 2: Handle redirect and exchange authorization code for token
window.onload = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code'); // Extract the 'code' parameter from the URL

  if (code) {
    const codeVerifier = localStorage.getItem('code_verifier');
    if (codeVerifier) {
      const accessToken = await exchangeCodeForToken(code, codeVerifier);
      // Store the access token in localStorage
      localStorage.setItem('access_token', accessToken);
      console.log('Access token stored successfully');

      // Redirect to a different page or update the UI to reflect the user is logged in
      window.location.href = 'homePage.html'; // Or wherever you'd like to go after login
    }
  }
};

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
  return data.access_token; // Return the access token
}
