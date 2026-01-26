/**
 * VisuDEV Edge Function: Screenshot Capture (REALISTIC)
 * 
 * @version 2.0.0
 * @description Captures screenshots via external Screenshot API (ScreenshotOne)
 * 
 * Requirements:
 * - SCREENSHOT_API_KEY environment variable (ScreenshotOne access key)
 * - Deployed app URL (e.g., Netlify, Vercel)
 * 
 * Usage:
 * POST /visudev-screenshots/capture
 * {
 *   "deployedUrl": "https://myapp.netlify.app",
 *   "repo": "owner/name",
 *   "commitSha": "abc123",
 *   "routePrefix": "/app",
 *   "screens": [{ "id": "home", "path": "/" }]
 * }
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono({ strict: false }).basePath('/visudev-screenshots');

app.use('*', logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ==================== TYPES ====================

type ScreenshotStatus = "ok" | "failed";

interface CaptureRequest {
  deployedUrl: string;   // "https://myapp.netlify.app"
  repo?: string;         // "owner/name" (optional, for storage path)
  commitSha?: string;    // from analyzer (optional, for versioning)
  routePrefix?: string;  // optional route prefix, e.g. "/app" for routes like /app/dashboard
  screens: {
    id: string;
    path: string;        // "/", "/login", "/dashboard"
  }[];
}

interface ScreenshotResult {
  screenId: string;
  screenshotUrl: string | null;
  status: ScreenshotStatus;
  error?: string;
}

interface CaptureResponse {
  screenshots: ScreenshotResult[];
}

// ==================== SUPABASE CLIENT ====================

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ==================== SCREENSHOT API CONFIG ====================

const SCREENSHOT_API_KEY = Deno.env.get("SCREENSHOT_API_KEY");
const SCREENSHOT_API_ENDPOINT = "https://api.screenshotone.com/take";

// ==================== HELPER FUNCTIONS ====================

/**
 * Fetch screenshot from ScreenshotOne API
 */
async function fetchScreenshotFromService(targetUrl: string): Promise<{ success: true; image: Uint8Array } | { success: false; status: number; body: string }> {
  if (!SCREENSHOT_API_KEY) {
    return { success: false, status: 0, body: "SCREENSHOT_API_KEY environment variable not set" };
  }

  console.log(`[Screenshots] 📸 Fetching screenshot for: ${targetUrl}`);

  const url = new URL(SCREENSHOT_API_ENDPOINT);
  url.searchParams.set("access_key", SCREENSHOT_API_KEY);
  url.searchParams.set("url", targetUrl);
  url.searchParams.set("format", "png");
  url.searchParams.set("viewport_width", "1440");
  url.searchParams.set("viewport_height", "900");
  url.searchParams.set("device_scale_factor", "1");
  url.searchParams.set("full_page", "false");
  url.searchParams.set("delay", "1"); // Wait 1s for page load

  console.log(`[Screenshots] 🔗 API URL: ${url.toString().replace(SCREENSHOT_API_KEY, 'XXX')}`);

  const res = await fetch(url.toString());
  const status = res.status;

  console.log(`[Screenshots] 📡 Response status: ${status} ${res.statusText}`);

  if (!res.ok) {
    const errorText = await res.text();
    const bodySnippet = errorText.substring(0, 500);
    console.error(`[Screenshots] ❌ ScreenshotOne API error: ${status} ${res.statusText}`);
    console.error(`[Screenshots] 📄 Error body: ${bodySnippet}`);
    return { success: false, status, body: bodySnippet };
  }

  const arrayBuffer = await res.arrayBuffer();
  const imageData = new Uint8Array(arrayBuffer);
  
  console.log(`[Screenshots] ✅ Screenshot fetched successfully (${imageData.length} bytes)`);
  return { success: true, image: imageData };
}

/**
 * Upload screenshot to Supabase Storage
 */
async function uploadScreenshot(
  image: Uint8Array,
  deployedUrl: string,
  commitSha: string | undefined,
  screenId: string,
): Promise<string> {
  const bucketName = "visudev-screens";

  console.log(`[Screenshots] Uploading screenshot to Supabase Storage...`);

  // Ensure bucket exists
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    throw new Error(`List buckets failed: ${bucketErr.message}`);
  }

  const exists = buckets?.some((b) => b.name === bucketName);
  if (!exists) {
    console.log(`[Screenshots] Creating bucket: ${bucketName}`);
    const { error: createErr } = await supabase.storage.createBucket(bucketName, { 
      public: true 
    });
    if (createErr) {
      throw new Error(`Create bucket failed: ${createErr.message}`);
    }
  }

  // Create stable project key from deployed URL
  const projectKey = encodeURIComponent(deployedUrl.replace(/^https?:\/\//, '').replace(/\//g, '-'));

  const filename = commitSha
    ? `screens/${projectKey}/${commitSha}/${screenId}.png`
    : `screens/${projectKey}/latest/${screenId}.png`;

  console.log(`[Screenshots] Uploading to: ${bucketName}/${filename}`);

  const { error: uploadErr } = await supabase.storage
    .from(bucketName)
    .upload(filename, image, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadErr) {
    throw new Error(`Upload failed: ${uploadErr.message}`);
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filename);
  
  console.log(`[Screenshots] ✓ Uploaded successfully: ${data.publicUrl}`);
  return data.publicUrl;
}

// ==================== MAIN ENDPOINT ====================

// Root health check
app.get("/", (c) => {
  const hasApiKey = !!SCREENSHOT_API_KEY;
  return c.json({
    status: "ok",
    service: "visudev-screenshots",
    apiKeyConfigured: hasApiKey,
    availableRoutes: ["/", "/health", "/capture"]
  });
});

app.post("/capture", async (c) => {
  try {
    const body = (await c.req.json()) as CaptureRequest;
    const { deployedUrl, repo, commitSha, routePrefix, screens } = body;

    console.log(`[Screenshots] 🚀 Starting capture for ${deployedUrl}`);
    console.log(`[Screenshots] 📊 Screens to capture: ${screens.length}`);
    console.log(`[Screenshots] 🔖 Commit SHA: ${commitSha || 'none'}`);
    console.log(`[Screenshots] 🛤️  Route prefix: ${routePrefix || 'none'}`);

    // Validation
    if (!deployedUrl || !screens || screens.length === 0) {
      return c.json(
        { error: "Missing required fields: deployedUrl, screens" },
        400,
      );
    }

    if (!SCREENSHOT_API_KEY) {
      return c.json(
        { error: "SCREENSHOT_API_KEY not configured in Supabase secrets" },
        500,
      );
    }

    const results: ScreenshotResult[] = [];

    // Capture screenshots for each screen
    for (const screen of screens) {
      try {
        // Build full URL with optional route prefix
        let screenPath = screen.path || "/";
        if (routePrefix && !screenPath.startsWith(routePrefix)) {
          screenPath = routePrefix + screenPath;
        }
        
        const targetUrl = new URL(screenPath, deployedUrl).toString();
        
        console.log(`[Screenshots] 🎯 Processing screen: ${screen.id}`);
        console.log(`[Screenshots]    - Original path: ${screen.path}`);
        console.log(`[Screenshots]    - Final URL: ${targetUrl}`);

        // Fetch screenshot from API
        const screenshotResult = await fetchScreenshotFromService(targetUrl);

        if (!screenshotResult.success) {
          // API returned an error (4xx, 5xx)
          const errorMsg = `HTTP ${screenshotResult.status}: ${screenshotResult.body}`;
          console.error(`[Screenshots] ❌ Failed for ${screen.id}: ${errorMsg}`);
          
          results.push({
            screenId: screen.id,
            screenshotUrl: null,
            status: "failed",
            error: `url=${targetUrl}, status=${screenshotResult.status}, body=${screenshotResult.body.substring(0, 200)}`,
          });
          continue;
        }

        // Upload to Supabase Storage
        const screenshotUrl = await uploadScreenshot(
          screenshotResult.image,
          deployedUrl,
          commitSha,
          screen.id,
        );

        results.push({
          screenId: screen.id,
          screenshotUrl,
          status: "ok",
        });

        console.log(`[Screenshots] ✅ Success for ${screen.id}`);
      } catch (err) {
        console.error(`[Screenshots] ❌ Exception for ${screen.id}:`, err);
        results.push({
          screenId: screen.id,
          screenshotUrl: null,
          status: "failed",
          error: `Exception: ${String(err)}`,
        });
      }
    }

    const successCount = results.filter(r => r.status === "ok").length;
    console.log(`[Screenshots] 🎉 Capture complete! ${successCount}/${results.length} successful`);

    const response: CaptureResponse = { screenshots: results };
    return c.json(response);

  } catch (err) {
    console.error("[Screenshots] 💥 Fatal error:", err);
    return c.json(
      { 
        error: String(err),
        screenshots: []
      },
      500,
    );
  }
});

// Health check endpoint
app.get("/health", (c) => {
  const hasApiKey = !!SCREENSHOT_API_KEY;
  return c.json({
    status: "ok",
    apiKeyConfigured: hasApiKey,
    service: "ScreenshotOne",
  });
});

Deno.serve(app.fetch);