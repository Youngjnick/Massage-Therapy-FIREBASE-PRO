// scripts/listBadgeImages.js
// Node.js script to list all image files in public/badges/
const fs = require('fs');
const path = require('path');

const badgesDir = path.resolve(__dirname, '../public/badges');

fs.readdir(badgesDir, (err, files) => {
  if (err) {
    console.error('Error reading badges directory:', err);
    process.exit(1);
  }
  // Filter for image files (png, jpg, jpeg, svg, gif, webp)
  const images = files.filter(f => /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(f));
  console.log('Badge images in public/badges/:');
  images.forEach(img => console.log(img));
});
