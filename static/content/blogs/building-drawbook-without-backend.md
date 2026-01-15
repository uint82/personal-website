---
title:
  text: "Building Drawbook Without Backend"
  config: "2 4ci 2i 4c"
description: "How I built a persistent drawing guestbook using Cloudflare Workers, ImgBB, and Google Sheets as a database."
published_at: "January 10, 2026"
tags: ["cloudflare", "googlesheets", "serverless", "canvas", "gallery", "googleform", "tutorial"]
author: "abror"
reading_time: 6
draft: false
---

I recently built <a href="/drawbook">**DrawBook**</a>, a digital guestbook where visitors can leave doodles instead of comments. I wanted it to be persistent and public, but I didn't want to spin up a PostgreSQL instance, manage a VPS, or pay for storage buckets.

I wanted a "backendless" backend.

Here is how I wired together **Cloudflare Workers**, **ImgBB**, **Google Forms** and **Google Sheets** to create a completely free, serverless persistence layer.

## The Architecture

The flow of data is a bit of a Rube Goldberg machine, but it’s robust enough for a side project:

1.  **User draws** on an HTML Canvas.
2.  **Upload:** A Cloudflare Worker receives the image and proxies it to the ImgBB API.
3.  **Save:** The Worker returns an image URL, which the frontend submits to a Google Form.
4.  **Store:** The Google Form automatically dumps the data into a Google Sheet.
5.  **Read:** The frontend fetches the Google Sheet as a CSV to render the gallery.

## Step 1: The Middleman (Cloudflare Workers)

Directly calling the ImgBB API from the browser is a bad idea because it exposes your API key. I needed a proxy.

I set up a simple Cloudflare Worker. It accepts the image `FormData` from the frontend, appends my secret ImgBB API key, and forwards it to ImgBB.

```typescript
// worker.ts
export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      const formData = await request.formData();

      // Append the API key server-side so it's not exposed in the client
      formData.append("key", env.IMGBB_API_KEY);

      // Proxy to ImgBB
      const response = await fetch(
        "[https://api.imgbb.com/1/upload](https://api.imgbb.com/1/upload)",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      // Return just the URL to our frontend
      return new Response(JSON.stringify({ imageUrl: data.data.url }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Method not allowed", { status: 405 });
  },
};
```

This keeps my API keys safe and handles CORS headers automatically.

## Step 2: Google Forms as a "Write" API

Once ImgBB returns the hosted image URL, we need to save it somewhere. Instead of setting up a database, I used **Google Forms**.

Google Forms allows you to pre-fill URL parameters. By inspecting the form's HTML, you can find the `name` attribute of the input field (usually something like `entry.123456789`).

We can then `POST` data directly to the form's endpoint without the user ever seeing the actual Google Form UI.

```typescript
// Inside drawbook.ts
const googleFormData = new FormData();
// entry.1529687651 corresponds to the "Image URL" question in my form
googleFormData.append("entry.1529687651", imageUrl);

await fetch(
  "[https://docs.google.com/forms/d/e/.../formResponse](https://docs.google.com/forms/d/e/.../formResponse)",
  {
    method: "POST",
    body: googleFormData,
    mode: "no-cors", // Important: Google Forms doesn't send CORS headers
  },
);
```

Using `mode: "no-cors"` is the trick here. We can't read the response (to check if it succeeded), but the data still gets sent.

## Step 3: Google Sheets as a "Read" API

Every Google Form is connected to a Google Sheet. To read the data back into the website, we just need to publish the sheet to the web.

1.  Open the linked Google Sheet.
2.  Go to **File > Share > Publish to web**.
3.  Select **CSV** as the format.

This gives us a public URL that returns raw CSV data. Parsing it in TypeScript is trivial:

```typescript
const sheetURL =
  "[https://docs.google.com/spreadsheets/d/.../export?format=csv](https://docs.google.com/spreadsheets/d/.../export?format=csv)";

const response = await fetch(sheetURL);
const csvText = await response.text();
const rows = csvText.split("\n").slice(1); // Remove header row

rows.reverse().forEach((row) => {
  const [timestamp, imageUrl] = row.split(",");
  // Render the image...
});
```

## Conclusion

Is this production-ready? **No.** Google limits the number of requests you can make, and `no-cors` mode makes error handling difficult.

But for a personal site or a guestbook? It's perfect. It costs $0, requires zero maintenance, and I essentially get a database with a built-in admin UI (Google Sheets) for free.

If you want to leave a mark, check out the <a href="/drawbook">**DrawBook**</a> page and add your masterpiece to the spreadsheet.
