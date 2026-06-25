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

I added <a href="/drawbook">**DrawBook**</a> to my site recently, basically a guestbook except people leave doodles instead of writing "nice site!" in the comments. The annoying part wasn't the canvas drawing itself, that's pretty straightforward, it was figuring out where to actually store everyone's drawings without setting up a real database or paying for anything.

So I ended up duct-taping together **Cloudflare Workers**, **ImgBB**, **Google Forms**, and **Google Sheets** into something that works as a free persistence layer. It's a little ridiculous when you lay it out but it does the job.

## The Architecture

The data flow looks kind of unhinged on paper, but it's held up fine so far:

1. **User draws** on an HTML Canvas.
2. **Upload:** A Cloudflare Worker grabs the image and forwards it to the ImgBB API.
3. **Save:** The Worker hands back an image URL, which gets submitted to a Google Form.
4. **Store:** The Form dumps that into a Google Sheet automatically.
5. **Read:** The frontend pulls the Sheet as CSV and renders the gallery from that.

## Step 1: Cloudflare Worker as a Proxy

You can't call the ImgBB API straight from the browser because that means shipping your API key to anyone who opens devtools. So there needs to be something in between.

The Worker just accepts the image `FormData` from the frontend, tacks on my ImgBB key server-side, and forwards the whole thing to ImgBB.

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

Keeps the key off the client and CORS just kind of works out of the box with this setup, which was a nice surprise.

## Step 2: Google Forms as a Write Endpoint

Once ImgBB gives back the hosted URL, that needs to go somewhere. Instead of a real database I just used Google Forms for this part.

Turns out Google Forms accepts pre-filled URL parameters, and if you dig through the form's HTML you can find each input's `name` attribute, usually something like `entry.123456789`.

From there you can just `POST` straight to the form's endpoint and the user never sees the actual form at all.

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

The `mode: "no-cors"` bit is the annoying part, since it means you can't actually read the response to confirm it worked. It just kind of... goes. I had to trust it for a while before checking the sheet manually to make sure submissions were landing.

## Step 3: Google Sheets as a Read Endpoint

Every Google Form has a Sheet attached to it. To get that data back into the site, you just publish the sheet to the web:

1. Open the linked Google Sheet.
2. Go to **File > Share > Publish to web**.
3. Pick **CSV** as the format.

That gives you a public URL serving raw CSV. Parsing it is barely anything:

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

This is obviously not something you'd ship for a real product. Google rate-limits requests, and `no-cors` makes debugging failed submissions kind of a pain since you're flying blind.

But for a guestbook on a personal site, it's been fine. Doesn't cost anything, nothing to maintain, and I basically got a database with a built-in admin panel for free since Sheets already does that job.

Go leave something on the <a href="/drawbook">**DrawBook**</a> page if you want, your doodle ends up sitting in my spreadsheet next to everyone else's.
