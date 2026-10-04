const APP_URL = "https://script.google.com/macros/s/AKfycbytBi9-Zpgs286ouGqI6DG5GiA5uYhqhCnFFmdoi3fXD-roBkPQhVNzx8i7aAKXGLAY/exec";

function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

exports.handler = async (event) => {
  const eventId = (event.queryStringParameters && event.queryStringParameters.id || "").trim();

  if (!eventId) {
    return { statusCode: 400, headers: { "Content-Type": "text/plain; charset=utf-8" }, body: "Missing event ID." };
  }

  const metaUrl = `${APP_URL}?page=meta&event=${encodeURIComponent(eventId)}`;
  const requestUrl = `${APP_URL}?page=request&event=${encodeURIComponent(eventId)}`;

  try {
    const response = await fetch(metaUrl, { redirect: "follow" });
    if (!response.ok) throw new Error(`Metadata request failed: ${response.status}`);
    const data = await response.json();

    if (!data || !data.success) {
      return { statusCode: 404, headers: { "Content-Type": "text/plain; charset=utf-8" }, body: "Event not found." };
    }

    const title = `${data.eventName} | Request My Jam`;
    const description = `Request a song for ${data.eventName}${data.town ? " in " + data.town : ""}.`;
    const image = data.featuredImageUrl || "";
    const canonical = `https://${event.headers.host}/event?id=${encodeURIComponent(eventId)}`;

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
${image ? `<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ""}
<meta http-equiv="refresh" content="0;url=${esc(requestUrl)}">
<script>window.location.replace(${JSON.stringify(requestUrl)});</script>
</head>
<body style="margin:0;background:#121212;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center">
<div><h1>Request My Jam</h1><p>Opening ${esc(data.eventName)}…</p>
<p><a style="color:#fff" href="${esc(requestUrl)}">Continue to song requests</a></p></div>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60"
      },
      body: html
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "Unable to load event information."
    };
  }
};
