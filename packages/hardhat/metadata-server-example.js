// Simple Express.js server for NFT metadata
const express = require('express');
const app = express();
const port = 3000;

// Card metadata database (replace with your actual database)
const cardMetadata = {
  1: {
    "name": "Fire Drake",
    "description": "A fierce dragon with flames that can melt steel.",
    "image": "https://your-bucket.s3.amazonaws.com/cards/1.png",
    "attributes": [
      {"trait_type": "Rarity", "value": "Common"},
      {"trait_type": "Attack", "value": 150},
      {"trait_type": "Defense", "value": 100},
      {"trait_type": "Agility", "value": 80},
      {"trait_type": "HP", "value": 1200}
    ]
  },
  2: {
    "name": "Water Spirit",
    "description": "An ethereal being that controls the flow of water.",
    "image": "https://your-bucket.s3.amazonaws.com/cards/2.png",
    "attributes": [
      {"trait_type": "Rarity", "value": "Common"},
      {"trait_type": "Attack", "value": 120},
      {"trait_type": "Defense", "value": 140},
      {"trait_type": "Agility", "value": 90},
      {"trait_type": "HP", "value": 1300}
    ]
  }
  // Add more card metadata...
};

// Pack metadata
const packMetadata = {
  1: {
    "name": "Starter Pack",
    "description": "A basic booster pack containing common and rare cards.",
    "image": "https://your-bucket.s3.amazonaws.com/packs/starter.png",
    "attributes": [
      {"trait_type": "Pack Type", "value": "Starter"},
      {"trait_type": "Cards", "value": 3}
    ]
  }
  // Add more pack metadata...
};

// API endpoints
app.get('/api/avamon/:tokenId', (req, res) => {
  const tokenId = parseInt(req.params.tokenId);
  const metadata = cardMetadata[tokenId];

  if (!metadata) {
    return res.status(404).json({ error: "Card not found" });
  }

  // Add standard ERC721 metadata fields
  const fullMetadata = {
    ...metadata,
    external_url: `https://avamon.game/card/${tokenId}`,
    properties: {
      card_type: "Avamon",
      token_id: tokenId
    }
  };

  res.json(fullMetadata);
});

app.get('/api/pack/:packId', (req, res) => {
  const packId = parseInt(req.params.packId);
  const metadata = packMetadata[packId];

  if (!metadata) {
    return res.status(404).json({ error: "Pack not found" });
  }

  res.json(metadata);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Metadata server running at http://localhost:${port}`);
  console.log(`Card metadata: http://localhost:${port}/api/avamon/{tokenId}`);
  console.log(`Pack metadata: http://localhost:${port}/api/pack/{packId}`);
});
