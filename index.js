const clientId = '8b3279c55bd14a56a3a59e632a2c3e81';
const redirectUri = 'http://127.0.0.1:5500/homePage.html';
const scopes = 'user-top-read playlist-modify-public playlist-modify-private';

window.addEventListener('load', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    const codeVerifier = localStorage.getItem('code_verifier');
    try {
      const token = await exchangeCodeForToken(code, codeVerifier);
      if (token) {
        console.log('Access Token retrieved:', token);
        localStorage.setItem('spotify_access_token', token);
        fetchTopTracks(token);
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  }
});

// Exchange Authorization Code for Access Token
async function exchangeCodeForToken(code, codeVerifier) {
  try {
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
    if (response.ok) {
      return data.access_token;
    } else {
      console.error('Failed to retrieve token:', data);
      return null;
    }
  } catch (error) {
    console.error('Error in token exchange request:', error);
    return null;
  }
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



// Get User's Spotify ID for playlist

// async function getUserId(token) {
//   try {
//     const response = await fetch('https://api.spotify.com/v1/me', {
//       headers: { 'Authorization': `Bearer ${token}` }
//     });
//     const data = await response.json();

//     if (response.ok) {
//       return data.id;
//     } else {
//       console.error('Failed to fetch user ID:', data);
//       return null;
//     }
//   } catch (error) {
//     console.error('Error fetching user ID:', error);
//     return null;
//   }
// }



// Recommendation Fetching Logic
async function getRecommendations() {
  const token = localStorage.getItem('spotify_access_token');
  const topTracksIds = JSON.parse(localStorage.getItem('topTracksIds'));

  if (!token || !topTracksIds) {
    console.error('Token or top track IDs missing for recommendations');
    return;
  }

  // Change button text to "Change Recommendations" when clicked
  const recommendButton = document.getElementById('recommend-button');
  recommendButton.textContent = 'Change Recommendations';

  try {
    const response = await fetch(`https://api.spotify.com/v1/recommendations?limit=5&seed_tracks=${topTracksIds.join(',')}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (response.ok) {
      console.log('Recommendations retrieved:', data.tracks);
      displayRecommendations(data.tracks);
    } else {
      console.error('Failed to fetch recommendations:', data);
    }
  } catch (error) {
    console.error('Error fetching recommendations:', error);
  }
}

// Display Recommendations in HTML
function displayRecommendations(tracks) {
  const recommendDiv = document.getElementById('recommendations');
  recommendDiv.innerHTML = ''; // Clear previous recommendations

  tracks.forEach(track => {
    const trackElement = document.createElement('p');
    trackElement.textContent = `${track.name} by ${track.artists.map(artist => artist.name).join(', ')}`;
    recommendDiv.appendChild(trackElement);
  });
}


// Assign the click event to the recommend button
document.getElementById('recommend-button').onclick = getRecommendations;
