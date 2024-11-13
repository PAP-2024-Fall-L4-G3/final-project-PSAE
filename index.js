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
        fetchSimilarArtistsAlbums(token);
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  }
});

//Exchange Authorization Code for Access Token
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

  // Extract artist IDs from top tracks
  const artistIds = data.items.map(track => track.artists[0].id);
  localStorage.setItem('topArtistIds', JSON.stringify(artistIds)); // Store artist IDs in local storage
  displayTracks(data.items);
}

// Display Tracks in HTML
function displayTracks(tracks) {
  const trackDiv = document.getElementById('tracks');
  trackDiv.innerHTML = ''; // Clear previous content if any

  tracks.forEach((track, index) => {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-item';

    const trackNumber = document.createElement('span');
    trackNumber.className = 'track-number';
    trackNumber.textContent = index + 1;

    const trackInfo = document.createElement('div');
    trackInfo.className = 'track-info';
    trackInfo.textContent = `${track.name} by ${track.artists.map(artist => artist.name).join(', ')}`;

    // Get the album image (e.g., the largest size)
    const albumImage = document.createElement('img');
    albumImage.className = 'album-image';
    albumImage.src = track.album.images[0].url;  // Using the largest image (index 0)
    albumImage.alt = `${track.name} album cover`;

    // Append the album image to the track element
    trackElement.appendChild(albumImage);
    trackElement.appendChild(trackNumber);
    trackElement.appendChild(trackInfo);
    trackDiv.appendChild(trackElement);
  });
}


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
function displayRecommendations(recommendations) {
  const recommendationsDiv = document.getElementById('recommendations');
  recommendationsDiv.innerHTML = ''; // Clear previous content if any

  recommendations.forEach((recommendation, index) => {
    const recommendationElement = document.createElement('div');
    recommendationElement.className = 'recommendation-item';

    // Create the album image element
    const albumImage = document.createElement('img');
    albumImage.className = 'album-image';
    albumImage.src = recommendation.album.images[0].url;  // Use the largest album image
    albumImage.alt = `${recommendation.name} album cover`;

    const recommendationNumber = document.createElement('span');
    recommendationNumber.className = 'recommendation-number';
    recommendationNumber.textContent = index + 1;

    const recommendationInfo = document.createElement('div');
    recommendationInfo.className = 'recommendation-info';
    recommendationInfo.textContent = `${recommendation.name} by ${recommendation.artists.map(artist => artist.name).join(', ')}`;

    // Append the album image, recommendation number, and recommendation info
    recommendationElement.appendChild(albumImage);
    recommendationElement.appendChild(recommendationNumber);
    recommendationElement.appendChild(recommendationInfo);
    recommendationsDiv.appendChild(recommendationElement);
  });
}




// Assign the click event to the recommend button
document.getElementById('recommend-button').onclick = getRecommendations;

const getRefreshToken = async () => {
  // Get the refresh token from localStorage
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    console.error('No refresh token found!');
    return;
  }

  const url = 'https://accounts.spotify.com/api/token';

  // Prepare the payload for the refresh request
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  };

  try {
    const response = await fetch(url, payload);
    const data = await response.json();

    if (response.ok) {
      // Store the new access token in localStorage
      localStorage.setItem('access_token', data.access_token);

      // If a new refresh token is returned, update it in localStorage
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      console.log('Access token refreshed successfully');
    } else {
      console.error('Failed to refresh token:', data);
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
};


async function fetchSimilarArtistsAlbums(token) {
  const artistIds = JSON.parse(localStorage.getItem('topArtistIds'));
  if (!artistIds || artistIds.length === 0) {
    console.error('No artist IDs available for recommendations');
    return;
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/recommendations?limit=5&seed_artists=${artistIds.join(',')}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    const recommendedArtists = data.tracks.map(track => track.artists[0].id);
    displaySimilarArtistsAlbums(token, recommendedArtists);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
  }
}

// Function to display new releases on the page
async function displaySimilarArtistsAlbums(token, artistIds) {
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = ''; // Clear previous content

  for (const artistId of artistIds) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=1`, { // Limit to 1 album per artist
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.items.length > 0) {
        const album = data.items[0]; // Get only the first album

        const albumDiv = document.createElement('div');
        albumDiv.innerHTML = `
          <h3>${album.name}</h3>
          <img src="${album.images[0].url}" alt="${album.name}" style="width: 100px; height: 100px;">
          <p>Release Date: ${album.release_date}</p>
          <p>Artists: ${album.artists.map(artist => artist.name).join(', ')}</p>
          <a href="${album.external_urls.spotify}" target="_blank">Listen on Spotify</a>
        `;
        outputDiv.appendChild(albumDiv);
      }
    } catch (error) {
      console.error('Error fetching albums for artist:', artistId, error);
    }
  }
}



// Function to sign out and redirect to the login page
document.getElementById('signout-btn').addEventListener('click', function() {
  // You can add additional sign-out functionality here, e.g., clearing user data, tokens, etc.

  // Redirect to the login page
  window.location.href = 'login.html';  // Replace 'login.html' with your actual login page URL
});


document.getElementById('signout-btn').addEventListener('click', function() {
  // You can add additional sign-out functionality here, e.g., clearing user data, tokens, etc.

  // Redirect to the login page
  window.location.href = 'login.html';  // Replace 'login.html' with your actual login page URL
});

const tracksUri = await fetchTopTracks();  // Fetch user's top 5 tracks
const createdPlaylist = await createPlaylist(tracksUri);  // Create playlist with the tracks
console.log(createdPlaylist.name, createdPlaylist.id);



// Call this function when you detect that the access token needs refreshing
// await getRefreshToken();

// Now you can use the new access token for Spotify API requests
// const token = localStorage.getItem('access_token');
// console.log('Access Token:', token);
