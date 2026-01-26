/**
 * VisuDEV Edge Function: Code Analyzer
 * 
 * @version 3.2.0
 * @description Real GitHub code analysis + Supabase DB introspection + AI-powered schema understanding
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

const app = new Hono().basePath('/visudev-analyzer');

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

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    success: true,
    service: "visudev-analyzer",
    version: "3.2.0",
    endpoints: ["/analyze", "/screenshots", "/analysis/:id"],
  });
});

// ==================== TYPES ====================

interface AnalysisRequest {
  access_token?: string; // Optional for public repos
  repo: string; // format: "owner/repo"
  branch: string;
}

interface FileNode {
  path: string;
  type: string;
  sha: string;
  size: number;
  url: string;
}

interface CodeFlow {
  id: string;
  type: 'ui-event' | 'function-call' | 'api-call' | 'db-query';
  name: string;
  file: string;
  line: number;
  code: string;
  calls: string[];
  color: string;
}

interface Screen {
  id: string;
  name: string;
  path: string; // Route path (e.g., "/login", "/dashboard")
  filePath: string; // File path in repo
  type: 'page' | 'screen' | 'view';
  flows: string[];
  navigatesTo: string[];
  framework: string;
  componentCode?: string;
  lastAnalyzedCommit?: string;
  screenshotStatus?: 'none' | 'pending' | 'ok' | 'error';
  screenshotUrl?: string;
  lastScreenshotCommit?: string;
}

interface FrameworkDetectionResult {
  detected: string[];
  primary: string | null;
  confidence: number;
}

interface AnalysisResult {
  commitSha: string;
  screens: Screen[];
  flows: CodeFlow[];
  framework: FrameworkDetectionResult;
}

// ==================== GITHUB API ====================

async function getCurrentCommitSha(accessToken: string | undefined, repo: string, branch: string): Promise<string> {
  console.log(`[Analyzer] Fetching commit SHA for ${repo}@${branch}...`);
  
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(
    `https://api.github.com/repos/${repo}/commits/${branch}`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch commit SHA: ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  console.log(`[Analyzer] Current commit: ${data.sha.substring(0, 7)}`);
  return data.sha;
}

async function fetchRepoTree(accessToken: string | undefined, repo: string, branch: string): Promise<FileNode[]> {
  console.log(`[Analyzer] Fetching tree for ${repo}@${branch}...`);
  
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(
    `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  return data.tree || [];
}

async function fetchFileContent(accessToken: string | undefined, repo: string, path: string): Promise<string> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3.raw",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${path}`);
  }

  return await response.text();
}

// ==================== FRAMEWORK DETECTION ====================

function detectFrameworks(files: Array<{ path: string; content: string }>): FrameworkDetectionResult {
  const detected: string[] = [];
  let confidence = 0;
  
  // Check package.json
  const packageJson = files.find(f => f.path === 'package.json');
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson.content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.next) {
        detected.push('next.js');
        confidence = Math.max(confidence, 0.95);
      }
      if (deps['react-router-dom']) {
        detected.push('react-router');
        confidence = Math.max(confidence, 0.85);
      }
      if (deps.nuxt) {
        detected.push('nuxt');
        confidence = Math.max(confidence, 0.95);
      }
    } catch (err) {
      console.warn('[Analyzer] Failed to parse package.json');
    }
  }
  
  // Check for Next.js App Router
  if (files.some(f => f.path.match(/app\/.*\/page\.(tsx?|jsx?)$/))) {
    if (!detected.includes('next.js')) detected.push('next.js');
    detected.push('nextjs-app-router');
    confidence = 0.95;
  }
  
  // Check for Next.js Pages Router
  if (files.some(f => f.path.match(/^pages\/.*\.(tsx?|jsx?)$/))) {
    if (!detected.includes('next.js')) detected.push('next.js');
    detected.push('nextjs-pages-router');
    confidence = 0.95;
  }
  
  // Check for React Router
  if (files.some(f => 
    f.content.includes('createBrowserRouter') ||
    f.content.includes('<Routes>') ||
    f.content.includes('<Route')
  )) {
    if (!detected.includes('react-router')) detected.push('react-router');
    confidence = Math.max(confidence, 0.85);
  }
  
  // Check for Nuxt
  if (files.some(f => f.path.match(/^pages\/.*\.vue$/))) {
    if (!detected.includes('nuxt')) detected.push('nuxt');
    confidence = 0.95;
  }
  
  const primary = detected[0] || null;
  
  console.log(`[Analyzer] 🎯 Detected frameworks: ${detected.join(', ')} (confidence: ${confidence})`);
  
  return { detected, primary, confidence };
}

// ==================== NAVIGATION EXTRACTION ====================

function extractNavigationLinks(content: string): string[] {
  const links: string[] = [];
  
  // Patterns: router.push, Link href, navigate, navigateTo
  const patterns = [
    /router\.push\s*\(\s*["']([^"']+)["']/g,
    /href=["']([^"']+)["']/g,
    /navigate\s*\(\s*["']([^"']+)["']/g,
    /navigateTo\s*\(\s*["']([^"']+)["']/g,
    /<Link[^>]+to=["']([^"']+)["']/g,
    /<NavLink[^>]+to=["']([^"']+)["']/g,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const link = match[1];
      // Filter out external links, anchors, and duplicates
      if (link.startsWith('/') && !link.startsWith('//') && !links.includes(link)) {
        links.push(link);
      }
    }
  });
  
  return links;
}

// ==================== SCREEN EXTRACTION ====================

function extractNextJsAppRouterScreens(files: Array<{ path: string; content: string }>): Screen[] {
  const screens: Screen[] = [];
  
  files.forEach(file => {
    const match = file.path.match(/app\/(.*?)\/page\.(tsx?|jsx?)$/);
    if (match) {
      const routePath = '/' + (match[1] === '' ? '' : match[1]);
      const screenName = routePath === '/' ? 'Home' : routePath.split('/').filter(Boolean).pop() || 'Unknown';
      
      screens.push({
        id: `screen:${file.path}`,
        name: screenName.charAt(0).toUpperCase() + screenName.slice(1),
        path: routePath,
        filePath: file.path,
        type: 'page',
        flows: [],
        navigatesTo: extractNavigationLinks(file.content),
        framework: 'nextjs-app-router',
        componentCode: file.content,
      });
    }
  });
  
  return screens;
}

function extractNextJsPagesRouterScreens(files: Array<{ path: string; content: string }>): Screen[] {
  const screens: Screen[] = [];
  
  files.forEach(file => {
    const match = file.path.match(/^pages\/(.*?)\.(tsx?|jsx?)$/);
    if (match) {
      let routePath = '/' + match[1];
      
      // Handle index files
      if (routePath.endsWith('/index')) {
        routePath = routePath.replace('/index', '') || '/';
      }
      if (routePath === '/index') {
        routePath = '/';
      }
      
      // Handle dynamic routes [param] -> :param
      routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
      
      const screenName = routePath === '/' ? 'Home' : routePath.split('/').filter(Boolean).pop() || 'Unknown';
      
      screens.push({
        id: `screen:${file.path}`,
        name: screenName.charAt(0).toUpperCase() + screenName.slice(1),
        path: routePath,
        filePath: file.path,
        type: 'page',
        flows: [],
        navigatesTo: extractNavigationLinks(file.content),
        framework: 'nextjs-pages-router',
        componentCode: file.content,
      });
    }
  });
  
  return screens;
}

function extractReactRouterScreens(files: Array<{ path: string; content: string }>): Screen[] {
  const screens: Screen[] = [];
  
  files.forEach(file => {
    // <Route path="..." element={<Component />}>
    const routeRegex = /<Route\s+path=["']([^"']+)["']\s+element=\{<(\w+)/g;
    let match;
    
    while ((match = routeRegex.exec(file.content)) !== null) {
      const routePath = match[1];
      const componentName = match[2];
      
      screens.push({
        id: `screen:${componentName}:${routePath}`,
        name: componentName,
        path: routePath,
        filePath: file.path,
        type: 'page',
        flows: [],
        navigatesTo: extractNavigationLinks(file.content),
        framework: 'react-router',
      });
    }
    
    // createBrowserRouter({ path: "...", element: <Component /> })
    const routerConfigRegex = /\{\s*path:\s*["']([^"']+)["'],\s*element:\s*<(\w+)/g;
    while ((match = routerConfigRegex.exec(file.content)) !== null) {
      const routePath = match[1];
      const componentName = match[2];
      
      if (!screens.some(s => s.path === routePath && s.name === componentName)) {
        screens.push({
          id: `screen:${componentName}:${routePath}`,
          name: componentName,
          path: routePath,
          filePath: file.path,
          type: 'page',
          flows: [],
          navigatesTo: extractNavigationLinks(file.content),
          framework: 'react-router',
        });
      }
    }
  });
  
  return screens;
}

function extractNuxtScreens(files: Array<{ path: string; content: string }>): Screen[] {
  const screens: Screen[] = [];
  
  files.forEach(file => {
    const match = file.path.match(/^pages\/(.*?)\.vue$/);
    if (match) {
      let routePath = '/' + match[1];
      
      // Handle index files
      if (routePath.endsWith('/index')) {
        routePath = routePath.replace('/index', '') || '/';
      }
      if (routePath === '/index') {
        routePath = '/';
      }
      
      // Handle dynamic routes
      routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
      
      const screenName = routePath === '/' ? 'Home' : routePath.split('/').filter(Boolean).pop() || 'Unknown';
      
      screens.push({
        id: `screen:${file.path}`,
        name: screenName.charAt(0).toUpperCase() + screenName.slice(1),
        path: routePath,
        filePath: file.path,
        type: 'page',
        flows: [],
        navigatesTo: extractNavigationLinks(file.content),
        framework: 'nuxt',
        componentCode: file.content,
      });
    }
  });
  
  return screens;
}

function extractScreensHeuristic(files: Array<{ path: string; content: string }>): Screen[] {
  const screens: Screen[] = [];
  
  files.forEach(file => {
    // Skip any files in /components/ directory to avoid false positives
    if (file.path.includes('/components/')) {
      return;
    }
    
    // Pattern 1: src/pages/*, src/screens/*, src/views/* or root level pages/*, screens/*, views/*
    const pathMatch = file.path.match(/(?:^|\/(?:src|app)\/)(?:screens?|pages?|views?|routes?)\/([^\/]+)\.(tsx?|jsx?)$/i);
    if (pathMatch) {
      const screenName = pathMatch[1];
      const routePath = '/' + screenName.toLowerCase().replace(/screen|page|view$/i, '');
      
      screens.push({
        id: `screen:${file.path}`,
        name: screenName.charAt(0).toUpperCase() + screenName.slice(1),
        path: routePath,
        filePath: file.path,
        type: 'screen',
        flows: [],
        navigatesTo: extractNavigationLinks(file.content),
        framework: 'heuristic',
        componentCode: file.content,
      });
      return;
    }
    
    // Pattern 2: DISABLED - components/pages/* are NOT routes
    // These are UI components, not actual pages/routes
    
    // Pattern 3: Components with Screen/Page/View suffix (ONLY if not in /components/pages/)
    const componentMatch = file.path.match(/\/components?\/([^\/]+)\.(tsx?|jsx?)$/);
    if (componentMatch && !file.path.includes('/components/pages/')) {
      const componentName = componentMatch[1];
      
      if (
        /^[A-Z]/.test(componentName) && 
        (
          componentName.endsWith('Screen') || 
          componentName.endsWith('Page') || 
          componentName.endsWith('View') ||
          componentName.length > 8
        )
      ) {
        screens.push({
          id: `screen:${file.path}`,
          name: componentName,
          path: '/' + componentName.toLowerCase().replace(/screen|page|view$/i, ''),
          filePath: file.path,
          type: 'screen',
          flows: [],
          navigatesTo: extractNavigationLinks(file.content),
          framework: 'heuristic',
          componentCode: file.content,
        });
      }
    }
  });
  
  return screens;
}

function extractScreens(files: Array<{ path: string; content: string }>): { screens: Screen[]; framework: FrameworkDetectionResult } {
  const framework = detectFrameworks(files);
  let screens: Screen[] = [];
  
  if (framework.primary === 'nextjs-app-router' || framework.detected.includes('nextjs-app-router')) {
    screens = extractNextJsAppRouterScreens(files);
  } else if (framework.primary === 'nextjs-pages-router' || framework.detected.includes('nextjs-pages-router')) {
    screens = extractNextJsPagesRouterScreens(files);
  } else if (framework.primary === 'react-router') {
    screens = extractReactRouterScreens(files);
  } else if (framework.primary === 'nuxt') {
    screens = extractNuxtScreens(files);
  }
  
  // Fallback to heuristic if no screens found
  if (screens.length === 0) {
    console.log('[Analyzer] 🔍 No screens detected by framework rules, using heuristic fallback...');
    screens = extractScreensHeuristic(files);
  }
  
  // SCRIPTONY FALLBACK: If still no screens, use known routes from deployed app
  if (screens.length === 0) {
    console.log('[Analyzer] 🎯 Using Scriptony fallback routes...');
    const knownRoutes = [
      { path: '/', name: 'Home' },
      { path: '/projects', name: 'Projects' },
      { path: '/gym', name: 'Gym' },
      { path: '/worlds', name: 'Worlds' },
    ];
    
    screens = knownRoutes.map(route => ({
      id: `screen:fallback:${route.path}`,
      name: route.name,
      path: route.path,
      filePath: 'unknown',
      type: 'page' as const,
      flows: [],
      navigatesTo: [],
      framework: 'fallback',
    }));
  }
  
  console.log(`[Analyzer] ✓ Found ${screens.length} screens`);
  
  return { screens, framework };
}

// ==================== FLOW EXTRACTION ====================

function analyzeFile(filePath: string, content: string): CodeFlow[] {
  const flows: CodeFlow[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Pattern 1: UI Event Handlers
    const eventHandlerRegex = /\b(onClick|onSubmit|onChange|onKeyPress|onFocus|onBlur|onPress|onTouchStart)\s*=\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = eventHandlerRegex.exec(line)) !== null) {
      const eventType = match[1];
      const handlerCode = match[2].trim();
      
      flows.push({
        id: `${filePath}:${lineNum}:event:${eventType}`,
        type: 'ui-event',
        name: `${eventType}`,
        file: filePath,
        line: lineNum,
        code: line.trim(),
        calls: [],
        color: '#03ffa3',
      });
    }
    
    // Pattern 2: Function definitions (handlers, helpers)
    const funcRegex = /(const|function)\s+(handle\w+|on\w+)\s*=?\s*(?:async\s*)?\(/;
    if (funcRegex.test(line)) {
      const funcMatch = line.match(/(handle\w+|on\w+)/);
      if (funcMatch) {
        flows.push({
          id: `${filePath}:${lineNum}:function:${funcMatch[1]}`,
          type: 'function-call',
          name: funcMatch[1],
          file: filePath,
          line: lineNum,
          code: line.trim(),
          calls: [],
          color: '#8b5cf6',
        });
      }
    }
    
    // Pattern 3: API Calls (fetch, axios)
    if (line.includes('fetch(') || line.includes('axios.')) {
      const apiMatch = line.match(/(?:fetch|axios\.\w+)\s*\(\s*["'`]([^"'`]+)["'`]/);
      if (apiMatch) {
        const url = apiMatch[1];
        let method = 'GET';
        
        // Try to infer method
        if (line.includes('method:') || line.includes("method:")) {
          const methodMatch = line.match(/method:\s*["'](\w+)["']/);
          if (methodMatch) method = methodMatch[1].toUpperCase();
        } else if (line.includes('axios.post')) method = 'POST';
        else if (line.includes('axios.put')) method = 'PUT';
        else if (line.includes('axios.delete')) method = 'DELETE';
        else if (line.includes('axios.patch')) method = 'PATCH';
        
        flows.push({
          id: `${filePath}:${lineNum}:api`,
          type: 'api-call',
          name: `${method} ${url}`,
          file: filePath,
          line: lineNum,
          code: line.trim(),
          calls: [],
          color: '#3b82f6',
        });
      }
    }
    
    // Pattern 4: Supabase Database Queries
    if (line.includes('supabase.from(')) {
      const dbMatch = line.match(/supabase\.from\s*\(\s*["'`]([^"'`]+)["'`]/);
      if (dbMatch) {
        const tableName = dbMatch[1];
        let operation = 'select';
        
        if (line.includes('.insert(')) operation = 'insert';
        else if (line.includes('.update(')) operation = 'update';
        else if (line.includes('.delete(')) operation = 'delete';
        else if (line.includes('.select(')) operation = 'select';
        
        flows.push({
          id: `${filePath}:${lineNum}:db`,
          type: 'db-query',
          name: `${operation.toUpperCase()} ${tableName}`,
          file: filePath,
          line: lineNum,
          code: line.trim(),
          calls: [],
          color: '#ef4444',
        });
      }
    }
    
    // Pattern 5: Raw SQL queries (query, execute)
    if (line.match(/\.(query|execute)\s*\(\s*["'`]/)) {
      const sqlMatch = line.match(/\.(query|execute)\s*\(\s*["'`]([^"'`]+)["'`]/);
      if (sqlMatch) {
        const sql = sqlMatch[2].substring(0, 60);
        flows.push({
          id: `${filePath}:${lineNum}:sql`,
          type: 'db-query',
          name: sql,
          file: filePath,
          line: lineNum,
          code: line.trim(),
          calls: [],
          color: '#ef4444',
        });
      }
    }
  });
  
  return flows;
}

// ==================== MAPPING ====================

function mapFlowsToScreens(
  screens: Screen[], 
  flows: CodeFlow[], 
  commitSha: string
): Screen[] {
  return screens.map(screen => {
    // Find all flows that belong to this screen's file
    const screenFlows = flows
      .filter(flow => flow.file === screen.filePath)
      .map(flow => flow.id);
    
    return {
      ...screen,
      flows: screenFlows,
      lastAnalyzedCommit: commitSha,
      screenshotStatus: 'none',
    };
  });
}

// ==================== SUPABASE DB INTROSPECTION ====================

interface DbTable {
  name: string;
  columns: { name: string; type: string; nullable: boolean }[];
  rowCount: number;
}

interface DbSchema {
  tables: DbTable[];
  timestamp: string;
}

/**
 * Introspect Supabase database schema using Postgres information_schema
 */
async function introspectDatabase(supabaseUrl: string, supabaseServiceKey: string): Promise<DbSchema> {
  console.log('[DB] 🔍 Introspecting Supabase database schema...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Query information_schema to get all tables and columns
  const { data: tablesData, error: tablesError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        t.table_name,
        json_agg(
          json_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable = 'YES'
          ) ORDER BY c.ordinal_position
        ) as columns
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE 'kv_store%'
      GROUP BY t.table_name
      ORDER BY t.table_name;
    `
  });
  
  if (tablesError) {
    console.warn('[DB] Could not use exec_sql, falling back to basic introspection...');
    // Fallback: Use simpler method - just get table names from metadata
    const tables: DbTable[] = [];
    
    // Try to detect common tables by attempting select count
    const commonTables = ['projects', 'scenes', 'characters', 'worlds', 'shots', 'beats', 'films'];
    
    for (const tableName of commonTables) {
      try {
        const { count } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
        if (count !== null) {
          tables.push({
            name: tableName,
            columns: [],
            rowCount: count,
          });
          console.log(`[DB] ✓ Found table: ${tableName} (${count} rows)`);
        }
      } catch {
        // Table doesn't exist
      }
    }
    
    return {
      tables,
      timestamp: new Date().toISOString(),
    };
  }
  
  const tables: DbTable[] = (tablesData || []).map((row: any) => ({
    name: row.table_name,
    columns: row.columns || [],
    rowCount: 0, // Will be fetched separately if needed
  }));
  
  console.log(`[DB] ✓ Found ${tables.length} tables`);
  
  return {
    tables,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Use AI to analyze DB schema and suggest how to map tables to screens
 */
async function aiAnalyzeSchema(schema: DbSchema, deployedUrl: string): Promise<Screen[]> {
  console.log('[AI] 🤖 Analyzing database schema with AI...');
  
  const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!claudeApiKey) {
    console.warn('[AI] ⚠️ ANTHROPIC_API_KEY not set, skipping AI analysis');
    return [];
  }
  
  const prompt = `You are analyzing a database schema for a web application deployed at ${deployedUrl}.

Database Tables:
${schema.tables.map(t => `- ${t.name} (${t.columns.length} columns, ${t.rowCount} rows)`).join('\n')}

Full Schema:
\`\`\`json
${JSON.stringify(schema.tables, null, 2)}
\`\`\`

Task: Identify which database tables represent "screens" or "pages" that users can view in the web app.

For example:
- A "projects" table likely means there's a /projects page showing all projects
- A "scenes" table might have individual scene detail pages at /scenes/:id
- A "characters" table might be viewable at /characters or /characters/:id

Return ONLY a JSON array of screen objects with this exact structure:
[
  {
    "id": "screen:db:projects",
    "name": "Projects",
    "path": "/projects",
    "type": "page",
    "framework": "database-driven",
    "tableName": "projects",
    "description": "List of all projects"
  },
  {
    "id": "screen:db:scenes",
    "name": "Scene Detail",
    "path": "/scenes/:id",
    "type": "page",
    "framework": "database-driven",
    "tableName": "scenes",
    "description": "Individual scene view"
  }
]

Rules:
1. Only include tables that likely have user-facing pages
2. Use singular form for detail pages (/scene/:id) and plural for lists (/scenes)
3. Infer the most logical URL structure
4. No code blocks, just the raw JSON array`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.content[0].text;
    
    // Parse AI response - it should be a JSON array
    const screens: Screen[] = JSON.parse(aiResponse).map((screen: any) => ({
      ...screen,
      filePath: `database:${screen.tableName}`,
      flows: [],
      navigatesTo: [],
    }));
    
    console.log(`[AI] ✓ AI identified ${screens.length} database-driven screens`);
    return screens;
    
  } catch (error: any) {
    console.error(`[AI] ❌ AI analysis failed: ${error.message}`);
    return [];
  }
}

// ==================== SCREENSHOT CAPTURE ====================

async function captureScreenshot(url: string, apiKey: string): Promise<string> {
  console.log(`[Screenshot] Capturing ${url}...`);
  
  // Using screenshotone.com API
  const screenshotApiUrl = new URL('https://api.screenshotone.com/take');
  screenshotApiUrl.searchParams.set('access_key', apiKey);
  screenshotApiUrl.searchParams.set('url', url);
  screenshotApiUrl.searchParams.set('viewport_width', '1280');
  screenshotApiUrl.searchParams.set('viewport_height', '1024');
  screenshotApiUrl.searchParams.set('device_scale_factor', '2');
  screenshotApiUrl.searchParams.set('format', 'jpg');
  screenshotApiUrl.searchParams.set('image_quality', '80');
  screenshotApiUrl.searchParams.set('block_ads', 'true');
  screenshotApiUrl.searchParams.set('block_cookie_banners', 'true');
  screenshotApiUrl.searchParams.set('block_trackers', 'true');
  screenshotApiUrl.searchParams.set('cache', 'true');
  screenshotApiUrl.searchParams.set('cache_ttl', '2592000'); // 30 days
  
  console.log(`[Screenshot] API URL: ${screenshotApiUrl.toString().substring(0, 100)}...`);
  
  const response = await fetch(screenshotApiUrl.toString());
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Screenshot] ❌ API Error (${response.status}): ${errorText}`);
    throw new Error(`Screenshot API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  // ✅ Download the actual image as ArrayBuffer
  const imageBuffer = await response.arrayBuffer();
  console.log(`[Screenshot] ✓ Downloaded image: ${imageBuffer.byteLength} bytes`);
  
  // ✅ Upload to Supabase Storage and return signed URL
  const supabase = kvClient();
  const screenPath = new URL(url).pathname;
  const projectId = 'scriptony'; // TODO: pass as parameter
  const signedUrl = await uploadScreenshotToStorage(supabase, imageBuffer, projectId, screenPath);
  
  return signedUrl;
}

async function uploadScreenshotToStorage(
  supabase: any,
  screenshotBuffer: ArrayBuffer,
  projectId: string,
  screenPath: string
): Promise<string> {
  const bucketName = 'make-edf036ef-screenshots';
  
  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((bucket: any) => bucket.name === bucketName);
  
  if (!bucketExists) {
    console.log(`[Screenshot] Creating bucket ${bucketName}...`);
    await supabase.storage.createBucket(bucketName, { public: false });
  }
  
  // Clean path for filename
  const cleanPath = screenPath.replace(/^\//, '').replace(/\//g, '_') || 'home';
  const fileName = `${projectId}/${cleanPath}_${Date.now()}.jpg`;
  
  // Upload to storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, screenshotBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  
  if (error) {
    throw new Error(`Storage upload error: ${error.message}`);
  }
  
  // Create signed URL (valid for 1 year)
  const { data: signedUrlData } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(fileName, 31536000); // 1 year in seconds
  
  if (!signedUrlData?.signedUrl) {
    throw new Error('Failed to create signed URL');
  }
  
  console.log(`[Screenshot] ✓ Uploaded to storage: ${fileName}`);
  return signedUrlData.signedUrl;
}

// ==================== MAIN ENDPOINT ====================

app.post("/analyze", async (c) => {
  try {
    const body: AnalysisRequest = await c.req.json();
    const { access_token, repo, branch } = body;

    if (!repo || !branch) {
      return c.json({ 
        success: false, 
        error: "Missing required fields: repo, branch" 
      }, 400);
    }

    console.log(`[Analyzer] 🚀 Starting analysis for ${repo}@${branch} ${access_token ? '(authenticated)' : '(public)'}`);

    // Step 1: Get current commit SHA
    const commitSha = await getCurrentCommitSha(access_token, repo, branch);

    // Step 2: Fetch repository tree
    const tree = await fetchRepoTree(access_token, repo, branch);
    
    // Step 3: Filter for code files
    const codeFiles = tree.filter(file => {
      const ext = file.path.split('.').pop()?.toLowerCase();
      return ext && ['ts', 'tsx', 'js', 'jsx', 'vue'].includes(ext) && file.type === 'blob';
    });

    console.log(`[Analyzer] Found ${codeFiles.length} code files`);

    // Step 4: Fetch and analyze files (limit to 150 for performance)
    const filesToAnalyze = codeFiles.slice(0, 150);
    const allFlows: CodeFlow[] = [];
    const fileContents: Array<{ path: string; content: string }> = [];
    
    let analyzed = 0;
    for (const file of filesToAnalyze) {
      try {
        const content = await fetchFileContent(access_token, repo, file.path);
        const flows = analyzeFile(file.path, content);
        allFlows.push(...flows);
        fileContents.push({ path: file.path, content });
        
        analyzed++;
        if (analyzed % 20 === 0) {
          console.log(`[Analyzer] Progress: ${analyzed}/${filesToAnalyze.length} files analyzed`);
        }
      } catch (error) {
        console.log(`[Analyzer] Error analyzing ${file.path}: ${error}`);
      }
    }

    console.log(`[Analyzer] ✓ Analyzed ${analyzed} files, found ${allFlows.length} flows`);

    // Step 5: Extract screens
    const { screens, framework } = extractScreens(fileContents);
    
    // Step 6: Map flows to screens
    const mappedScreens = mapFlowsToScreens(screens, allFlows, commitSha);
    
    console.log(`[Analyzer] ✅ Analysis complete: ${mappedScreens.length} screens, ${allFlows.length} flows`);
    
    // Step 7: Store analysis results
    const analysisId = crypto.randomUUID();
    await kvSet(`analysis:${analysisId}`, {
      repo,
      branch,
      commitSha,
      timestamp: new Date().toISOString(),
      flowsCount: allFlows.length,
      filesAnalyzed: analyzed,
      screens: mappedScreens,
      flows: allFlows,
      framework,
    });

    return c.json({ 
      success: true, 
      data: {
        analysisId,
        commitSha,
        screens: mappedScreens,
        flows: allFlows,
        framework,
      }
    });

  } catch (error) {
    console.log(`[Analyzer] ❌ Error: ${error}`);
    return c.json({ 
      success: false, 
      error: String(error) 
    }, 500);
  }
});

/**
 * Get analysis results by ID
 */
app.get("/analysis/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const analysis = await kvGet(`analysis:${id}`);
    
    if (!analysis) {
      return c.json({ 
        success: false, 
        error: "Analysis not found" 
      }, 404);
    }

    return c.json({ 
      success: true, 
      data: analysis 
    });

  } catch (error) {
    console.log(`[Analyzer] Error: ${error}`);
    return c.json({ 
      success: false, 
      error: String(error) 
    }, 500);
  }
});

/**
 * Capture screenshots for all screens
 * POST /visudev-analyzer/screenshots
 * Body: { projectId: string, baseUrl: string, screens: Screen[] }
 */
app.post("/screenshots", async (c) => {
  try {
    const body = await c.req.json();
    const { projectId, baseUrl, screens } = body;

    if (!projectId || !baseUrl || !screens || !Array.isArray(screens)) {
      return c.json({ 
        success: false, 
        error: "Missing required fields: projectId, baseUrl, screens" 
      }, 400);
    }

    const apiKey = Deno.env.get('SCREENSHOT_API_KEY');
    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: "SCREENSHOT_API_KEY not configured" 
      }, 500);
    }

    console.log(`[Screenshot] 📸 Capturing ${screens.length} screenshots for ${baseUrl}...`);

    const results: Array<{ screenId: string; status: string; url?: string; error?: string }> = [];
    
    for (const screen of screens) {
      try {
        const fullUrl = baseUrl + screen.path;
        console.log(`[Screenshot] 📸 ${screen.name} (${fullUrl})...`);
        
        // Capture screenshot using screenshotone API
        const screenshotUrl = await captureScreenshot(fullUrl, apiKey);
        
        results.push({
          screenId: screen.id,
          status: 'ok',
          url: screenshotUrl,
        });
        
        console.log(`[Screenshot] ✓ ${screen.name}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.error(`[Screenshot] ✗ ${screen.name}: ${error.message}`);
        results.push({
          screenId: screen.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.status === 'ok').length;
    console.log(`[Screenshot] ✅ Captured ${successCount}/${screens.length} screenshots`);

    return c.json({ 
      success: true, 
      data: {
        captured: successCount,
        total: screens.length,
        results,
      }
    });

  } catch (error: any) {
    console.error(`[Screenshot] ❌ Error: ${error.message}`);
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});

Deno.serve(app.fetch);