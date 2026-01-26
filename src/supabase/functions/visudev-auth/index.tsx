/**
 * VisuDEV Edge Function: Authentication
 * 
 * @version 1.0.0
 * @description OAuth flow for GitHub and Supabase integrations
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// KV Store Implementation
const kvClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const kvSet = async (key: string, value: any): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_edf036ef").upsert({ key, value });
  if (error) throw new Error(error.message);
};

const kvGet = async (key: string): Promise<any> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_edf036ef").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

const kvDel = async (key: string): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_edf036ef").delete().eq("key", key);
  if (error) throw new Error(error.message);
};

const app = new Hono().basePath('/visudev-auth');

app.use('*', logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ==================== GITHUB OAUTH ====================

// Step 1: Initiate GitHub OAuth
app.get("/github/authorize", async (c) => {
  const clientId = Deno.env.get("GITHUB_CLIENT_ID");
  const redirectUri = Deno.env.get("GITHUB_REDIRECT_URI") || 
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/visudev-auth/github/callback`;
  
  if (!clientId) {
    return c.json({ success: false, error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID environment variable." }, 500);
  }

  const state = crypto.randomUUID();
  const scope = "repo,read:user";
  
  // Get the return URL from query parameter (more reliable than referer header)
  const returnUrl = c.req.query("return_url") || "";
  
  console.log(`[VisuDEV Auth] OAuth initiated with return_url: ${returnUrl}`);
  
  // Store the return URL so we can redirect back after OAuth
  if (returnUrl) {
    await kvSet(`github_oauth_return:${state}`, {
      return_url: returnUrl,
      created_at: new Date().toISOString(),
    });
  }
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  
  return c.json({ success: true, authUrl, state });
});

// Step 2: GitHub OAuth Callback
app.get("/github/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  
  if (!code) {
    return c.html(`
      <html>
        <body>
          <h1>Error: No code received from GitHub</h1>
          <script>window.close()</script>
        </body>
      </html>
    `);
  }

  const clientId = Deno.env.get("GITHUB_CLIENT_ID");
  const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET");
  
  if (!clientId || !clientSecret) {
    return c.html(`
      <html>
        <body>
          <h1>Error: GitHub OAuth not configured</h1>
          <p>Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET</p>
          <script>window.close()</script>
        </body>
      </html>
    `);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error("No access token received");
    }

    // Get user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept": "application/vnd.github.v3+json",
      },
    });

    const userData = await userResponse.json();

    // Store token in session (temporary storage with state as key)
    await kvSet(`github_session:${state}`, {
      access_token: tokenData.access_token,
      user: userData,
      created_at: new Date().toISOString(),
    });

    // Get the return URL that was stored during authorization
    const returnData = await kvGet(`github_oauth_return:${state}`);
    let redirectUrl = `https://www.figma.com/?github_auth_state=${state}`;
    
    console.log(`[VisuDEV Auth] Return data from KV:`, JSON.stringify(returnData));
    
    if (returnData && returnData.return_url) {
      try {
        // Parse the stored return URL and add our state parameter
        const targetUrl = new URL(returnData.return_url);
        targetUrl.searchParams.set('github_auth_state', state);
        redirectUrl = targetUrl.toString();
        
        console.log(`[VisuDEV Auth] ✓ Redirecting back to stored URL: ${redirectUrl}`);
      } catch (error) {
        console.log(`[VisuDEV Auth] Error parsing return URL: ${error}, using default`);
      }
    } else {
      console.log(`[VisuDEV Auth] No return URL found in KV store, using default: ${redirectUrl}`);
    }
    
    // Clean up return URL data
    if (state) {
      await kvDel(`github_oauth_return:${state}`);
    }
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
      },
    });
  } catch (error) {
    console.log(`GitHub OAuth error: ${error}`);
    return c.html(`
      <html>
        <body>
          <h1>Error connecting to GitHub</h1>
          <p>${error}</p>
          <script>window.close()</script>
        </body>
      </html>
    `);
  }
});

// Get GitHub session data
app.post("/github/session", async (c) => {
  try {
    const body = await c.req.json();
    const { state } = body;

    if (!state) {
      return c.json({ success: false, error: "State required" }, 400);
    }

    const session = await kvGet(`github_session:${state}`);
    
    if (!session) {
      return c.json({ success: false, error: "Session not found or expired" }, 404);
    }

    return c.json({ success: true, data: session });
  } catch (error) {
    console.log(`Error fetching GitHub session: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get GitHub repositories for authenticated user
app.post("/github/repos", async (c) => {
  try {
    const body = await c.req.json();
    const { access_token } = body;

    if (!access_token) {
      return c.json({ success: false, error: "Access token required" }, 400);
    }

    const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const repos = await response.json();
    
    return c.json({ success: true, data: repos });
  } catch (error) {
    console.log(`Error fetching GitHub repos: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== SUPABASE TOKEN ====================

// Validate and store Supabase Management Token
app.post("/supabase/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { management_token } = body;

    if (!management_token) {
      return c.json({ success: false, error: "Management token required" }, 400);
    }

    // Validate token by fetching projects
    const response = await fetch("https://api.supabase.com/v1/projects", {
      headers: {
        "Authorization": `Bearer ${management_token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Invalid Supabase management token");
    }

    const projects = await response.json();

    return c.json({ success: true, data: { projects, valid: true } });
  } catch (error) {
    console.log(`Error validating Supabase token: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get Supabase projects
app.post("/supabase/projects", async (c) => {
  try {
    const body = await c.req.json();
    const { management_token } = body;

    if (!management_token) {
      return c.json({ success: false, error: "Management token required" }, 400);
    }

    const response = await fetch("https://api.supabase.com/v1/projects", {
      headers: {
        "Authorization": `Bearer ${management_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.statusText}`);
    }

    const projects = await response.json();

    return c.json({ success: true, data: projects });
  } catch (error) {
    console.log(`Error fetching Supabase projects: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);