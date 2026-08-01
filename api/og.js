export default function handler(req, res) {
  const { place, img } = req.query;

  const placeName = place ? decodeURIComponent(place) : "MyGreece";
  const imageUrl  = img   ? decodeURIComponent(img)   : "https://i.imgur.com/TwfbviO.jpeg";
  const appUrl    = `https://mygreece-app.vercel.app/?place=${encodeURIComponent(placeName)}`;

  const description = place
    ? `Discover ${placeName} in Crete — hand-picked by locals via MyGreece.`
    : "Beaches, tavernas, hidden villages & stays — hand-picked by locals for you.";

  const title = place
    ? `${placeName} — MyGreece`
    : "MyGreece — Your Insider Guide to Crete";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600");
  res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:site_name"   content="MyGreece" />
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image"       content="${imageUrl}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url"         content="${appUrl}" />

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image"       content="${imageUrl}" />

  <!-- Redirect humans to the app immediately -->
  <meta http-equiv="refresh" content="0;url=${appUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${appUrl}">MyGreece</a>…</p>
</body>
</html>`);
}
