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
