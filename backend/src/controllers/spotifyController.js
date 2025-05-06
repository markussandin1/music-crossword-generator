const getPlaylistData = async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    console.log('Received playlist URL:', playlistUrl); // Debug log

    if (!playlistUrl) {
      return res.status(400).json({ error: 'Missing playlist URL' });
    }

    const playlistData = await spotifyService.getPlaylistData(playlistUrl);
    console.log('Fetched playlist data:', playlistData); // Debug log

    return res.status(200).json({ success: true, data: playlistData });
  } catch (error) {
    console.error('Error fetching playlist data:', error); // Log the error
    return res.status(500).json({ error: 'Failed to fetch playlist data', message: error.message });
  }
};
