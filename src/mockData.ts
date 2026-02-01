// Mock data for VisuDEV demonstration
import {
  FlowNode,
  FlowEdge,
  UIElement,
  DBTable,
  DBRelation,
  DBPolicy,
  Migration,
  WebhookEvent,
  Project,
} from "./types";

export const mockProject: Project = {
  id: "proj-1",
  name: "E-Commerce Platform",
  repo: {
    id: "repo-1",
    owner: "acme-corp",
    name: "shop-frontend",
    default_branch: "main",
  },
};

export const mockUIElements: UIElement[] = [
  {
    id: "loginBtn",
    selector: "#login",
    screenId: "landing",
    entryStep: "node-login-ui",
    label: "Login Button",
  },
  {
    id: "orderSubmit",
    selector: "#order-submit",
    screenId: "checkout",
    entryStep: "node-order-ui",
    label: "Order Submit Button",
  },
];

export const mockFlowNodes: FlowNode[] = [
  // Login Flow
  {
    id: "node-login-ui",
    kind: "ui",
    title: "Login Button",
    file_path: "src/components/LoginForm.tsx",
    start_line: 45,
    end_line: 52,
    commit_sha: "a3f4b2c",
    description: "User clicks login button, triggers form validation",
    code_snippet: `<Button\n  id="login"\n  onClick={handleLogin}\n  disabled={!isValid}\n>\n  Sign In\n</Button>`,
    metrics: { avg_ms: 12, p95_ms: 18, err_rate: 0.02 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/a3f4b2c/src/components/LoginForm.tsx#L45-L52",
    },
    layer: "frontend",
  },
  {
    id: "node-validate",
    kind: "ui",
    title: "Form Validation",
    file_path: "src/components/LoginForm.tsx",
    start_line: 28,
    end_line: 35,
    commit_sha: "a3f4b2c",
    description: "Client-side validation of email and password",
    code_snippet: `const validateForm = () => {\n  if (!email || !isValidEmail(email)) {\n    setError('Invalid email');\n    return false;\n  }\n  return true;\n};`,
    metrics: { avg_ms: 2, p95_ms: 4, err_rate: 0 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/a3f4b2c/src/components/LoginForm.tsx#L28-L35",
    },
    layer: "frontend",
  },
  {
    id: "node-api-login",
    kind: "api",
    title: "POST /api/login",
    file_path: "supabase/functions/server/routes/auth.ts",
    start_line: 12,
    end_line: 34,
    commit_sha: "a3f4b2c",
    description: "Edge function handling login request",
    code_snippet: `app.post('/make-server-edf036ef/api/login', async (c) => {\n  const { email, password } = await c.req.json();\n  const { data, error } = await supabase.auth.signInWithPassword({\n    email,\n    password\n  });\n  if (error) return c.json({ error: error.message }, 401);\n  return c.json({ session: data.session });\n});`,
    metrics: { avg_ms: 145, p95_ms: 320, err_rate: 0.05 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/a3f4b2c/supabase/functions/server/routes/auth.ts#L12-L34",
      open_in_supabase: "https://supabase.com/dashboard/project/_/functions/server",
    },
    layer: "compute",
  },
  {
    id: "node-auth-signin",
    kind: "auth",
    title: "supabase.auth.signInWithPassword",
    file_path: "supabase/functions/server/routes/auth.ts",
    start_line: 15,
    end_line: 18,
    commit_sha: "a3f4b2c",
    description: "Supabase Auth: validate credentials and create session",
    code_snippet: `const { data, error } = await supabase.auth.signInWithPassword({\n  email,\n  password\n});`,
    metrics: { avg_ms: 98, p95_ms: 210, err_rate: 0.03 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/a3f4b2c/supabase/functions/server/routes/auth.ts#L15-L18",
      open_in_supabase: "https://supabase.com/dashboard/project/_/auth/users",
    },
    layer: "compute",
  },
  {
    id: "node-sql-profile",
    kind: "sql",
    title: "SELECT profiles",
    file_path: "supabase/functions/server/routes/auth.ts",
    start_line: 22,
    end_line: 25,
    commit_sha: "a3f4b2c",
    description: "Query user profile after successful authentication",
    code_snippet: `const { data: profile } = await supabase\n  .from('profiles')\n  .select('*')\n  .eq('user_id', data.user.id)\n  .single();`,
    metrics: { avg_ms: 23, p95_ms: 45, err_rate: 0.01 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/a3f4b2c/supabase/functions/server/routes/auth.ts#L22-L25",
      open_in_supabase: "https://supabase.com/dashboard/project/_/editor",
    },
    layer: "data",
  },
  {
    id: "node-policy-profile",
    kind: "policy",
    title: "RLS: profiles_select",
    description: "Row-level security policy ensuring users can only read their own profile",
    code_snippet: `CREATE POLICY profiles_select ON profiles\nFOR SELECT\nUSING (auth.uid() = user_id);`,
    metrics: { avg_ms: 1, p95_ms: 2, err_rate: 0 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/a3f4b2c/supabase/migrations/20240101_rls.sql#L12-L14",
      open_in_supabase: "https://supabase.com/dashboard/project/_/auth/policies",
    },
    layer: "policies",
  },
  {
    id: "node-erp-contact",
    kind: "erp",
    title: "ERP: ensureContact",
    file_path: "supabase/functions/server/integrations/erp.ts",
    start_line: 8,
    end_line: 18,
    commit_sha: "a3f4b2c",
    description: "Create or update contact in external ERP system",
    code_snippet: `async function ensureContact(userId: string, email: string) {\n  const response = await fetch(ERP_API + '/contacts', {\n    method: 'POST',\n    headers: { 'Authorization': \`Bearer \${ERP_TOKEN}\` },\n    body: JSON.stringify({ userId, email })\n  });\n  return response.json();\n}`,
    metrics: { avg_ms: 234, p95_ms: 520, err_rate: 0.08 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/a3f4b2c/supabase/functions/server/integrations/erp.ts#L8-L18",
    },
    layer: "external",
  },

  // Order Flow
  {
    id: "node-order-ui",
    kind: "ui",
    title: "Order Submit Button",
    file_path: "src/components/CheckoutForm.tsx",
    start_line: 67,
    end_line: 74,
    commit_sha: "b7e9d1a",
    description: "User submits order with cart items",
    code_snippet: `<Button\n  id="order-submit"\n  onClick={submitOrder}\n  disabled={cart.length === 0}\n>\n  Place Order\n</Button>`,
    metrics: { avg_ms: 15, p95_ms: 22, err_rate: 0.01 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/b7e9d1a/src/components/CheckoutForm.tsx#L67-L74",
    },
    layer: "frontend",
  },
  {
    id: "node-edge-order",
    kind: "edge",
    title: "POST /api/orders",
    file_path: "supabase/functions/server/routes/orders.ts",
    start_line: 18,
    end_line: 52,
    commit_sha: "b7e9d1a",
    description: "Edge function to create order, check inventory, insert records",
    code_snippet: `app.post('/make-server-edf036ef/api/orders', async (c) => {\n  const { items } = await c.req.json();\n  const token = c.req.header('Authorization')?.split(' ')[1];\n  const { data: { user } } = await supabase.auth.getUser(token);\n  \n  // Check inventory\n  const { data: inventory } = await supabase\n    .from('inventory')\n    .select('*')\n    .in('product_id', items.map(i => i.product_id));\n  \n  // Insert order\n  const { data: order } = await supabase\n    .from('orders')\n    .insert({ user_id: user.id, status: 'pending' })\n    .select()\n    .single();\n    \n  return c.json({ order });\n});`,
    metrics: { avg_ms: 287, p95_ms: 540, err_rate: 0.04 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/b7e9d1a/supabase/functions/server/routes/orders.ts#L18-L52",
      open_in_supabase: "https://supabase.com/dashboard/project/_/functions/server",
    },
    layer: "compute",
  },
  {
    id: "node-sql-inventory",
    kind: "sql",
    title: "SELECT inventory",
    file_path: "supabase/functions/server/routes/orders.ts",
    start_line: 26,
    end_line: 29,
    commit_sha: "b7e9d1a",
    description: "Check product availability and stock levels",
    code_snippet: `const { data: inventory } = await supabase\n  .from('inventory')\n  .select('*')\n  .in('product_id', items.map(i => i.product_id));`,
    metrics: { avg_ms: 34, p95_ms: 68, err_rate: 0.02 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/b7e9d1a/supabase/functions/server/routes/orders.ts#L26-L29",
      open_in_supabase: "https://supabase.com/dashboard/project/_/editor",
    },
    layer: "data",
  },
  {
    id: "node-sql-orders-insert",
    kind: "sql",
    title: "INSERT orders",
    file_path: "supabase/functions/server/routes/orders.ts",
    start_line: 32,
    end_line: 36,
    commit_sha: "b7e9d1a",
    description: "Create new order record with user association",
    code_snippet: `const { data: order } = await supabase\n  .from('orders')\n  .insert({ user_id: user.id, status: 'pending' })\n  .select()\n  .single();`,
    metrics: { avg_ms: 45, p95_ms: 89, err_rate: 0.03 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/b7e9d1a/supabase/functions/server/routes/orders.ts#L32-L36",
      open_in_supabase: "https://supabase.com/dashboard/project/_/editor",
    },
    layer: "data",
  },
  {
    id: "node-policy-orders",
    kind: "policy",
    title: "RLS: orders_insert",
    description: "Policy ensuring users can only create orders for themselves",
    code_snippet: `CREATE POLICY orders_insert ON orders\nFOR INSERT\nWITH CHECK (auth.uid() = user_id);`,
    metrics: { avg_ms: 1, p95_ms: 3, err_rate: 0 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/b7e9d1a/supabase/migrations/20240102_orders_rls.sql#L8-L10",
      open_in_supabase: "https://supabase.com/dashboard/project/_/auth/policies",
    },
    layer: "policies",
  },
  {
    id: "node-erp-sales",
    kind: "erp",
    title: "ERP: createSalesOrder",
    file_path: "supabase/functions/server/integrations/erp.ts",
    start_line: 32,
    end_line: 45,
    commit_sha: "b7e9d1a",
    description: "Sync order to external ERP system for fulfillment",
    code_snippet: `async function createSalesOrder(orderId: string, items: Array<{ sku: string; qty: number }>) {\n  const response = await fetch(ERP_API + '/sales-orders', {\n    method: 'POST',\n    headers: { 'Authorization': \`Bearer \${ERP_TOKEN}\` },\n    body: JSON.stringify({ orderId, items })\n  });\n  return response.json();\n}`,
    metrics: { avg_ms: 312, p95_ms: 680, err_rate: 0.12 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/b7e9d1a/supabase/functions/server/integrations/erp.ts#L32-L45",
    },
    layer: "external",
  },
  {
    id: "node-storage-invoice",
    kind: "storage",
    title: "Storage: invoice.pdf",
    file_path: "supabase/functions/server/routes/orders.ts",
    start_line: 45,
    end_line: 48,
    commit_sha: "b7e9d1a",
    description: "Generate and upload invoice PDF to Supabase Storage",
    code_snippet: `const { data } = await supabase.storage\n  .from('invoices')\n  .upload(\`\${orderId}/invoice.pdf\`, pdfBuffer);`,
    metrics: { avg_ms: 156, p95_ms: 290, err_rate: 0.06 },
    links: {
      github_permalink:
        "https://github.com/acme-corp/shop-frontend/blob/b7e9d1a/supabase/functions/server/routes/orders.ts#L45-L48",
      open_in_supabase: "https://supabase.com/dashboard/project/_/storage/buckets",
    },
    layer: "data",
  },
];

export const mockFlowEdges: FlowEdge[] = [
  // Login Flow
  {
    id: "e1",
    source: "node-login-ui",
    target: "node-validate",
    kind: "request",
    label: "validate",
  },
  { id: "e2", source: "node-validate", target: "node-api-login", kind: "request", label: "POST" },
  {
    id: "e3",
    source: "node-api-login",
    target: "node-auth-signin",
    kind: "request",
    label: "auth",
  },
  { id: "e4", source: "node-auth-signin", target: "node-sql-profile", kind: "sql", label: "query" },
  {
    id: "e5",
    source: "node-sql-profile",
    target: "node-policy-profile",
    kind: "policy",
    label: "enforce",
  },
  {
    id: "e6",
    source: "node-api-login",
    target: "node-erp-contact",
    kind: "request",
    label: "sync",
  },

  // Order Flow
  { id: "e7", source: "node-order-ui", target: "node-edge-order", kind: "request", label: "POST" },
  {
    id: "e8",
    source: "node-edge-order",
    target: "node-sql-inventory",
    kind: "sql",
    label: "check",
  },
  {
    id: "e9",
    source: "node-edge-order",
    target: "node-sql-orders-insert",
    kind: "sql",
    label: "insert",
  },
  {
    id: "e10",
    source: "node-sql-orders-insert",
    target: "node-policy-orders",
    kind: "policy",
    label: "enforce",
  },
  {
    id: "e11",
    source: "node-edge-order",
    target: "node-erp-sales",
    kind: "request",
    label: "sync",
  },
  {
    id: "e12",
    source: "node-edge-order",
    target: "node-storage-invoice",
    kind: "request",
    label: "upload",
  },
];

export const mockTables: DBTable[] = [
  {
    id: "t1",
    schema_name: "public",
    table_name: "profiles",
    columns: ["id", "user_id", "name", "email"],
  },
  {
    id: "t2",
    schema_name: "public",
    table_name: "orders",
    columns: ["id", "user_id", "status", "created_at"],
  },
  {
    id: "t3",
    schema_name: "public",
    table_name: "order_items",
    columns: ["id", "order_id", "product_id", "quantity"],
  },
  {
    id: "t4",
    schema_name: "public",
    table_name: "products",
    columns: ["id", "name", "price", "category"],
  },
  {
    id: "t5",
    schema_name: "public",
    table_name: "inventory",
    columns: ["id", "product_id", "quantity", "warehouse"],
  },
  {
    id: "t6",
    schema_name: "public",
    table_name: "projects",
    columns: ["id", "name", "created_by"],
  },
  {
    id: "t7",
    schema_name: "public",
    table_name: "members",
    columns: ["project_id", "user_id", "role"],
  },
];

export const mockRelations: DBRelation[] = [
  {
    id: "r1",
    src_table: "profiles",
    src_column: "user_id",
    dst_table: "auth.users",
    dst_column: "id",
  },
  {
    id: "r2",
    src_table: "orders",
    src_column: "user_id",
    dst_table: "auth.users",
    dst_column: "id",
  },
  {
    id: "r3",
    src_table: "order_items",
    src_column: "order_id",
    dst_table: "orders",
    dst_column: "id",
  },
  {
    id: "r4",
    src_table: "order_items",
    src_column: "product_id",
    dst_table: "products",
    dst_column: "id",
  },
  {
    id: "r5",
    src_table: "inventory",
    src_column: "product_id",
    dst_table: "products",
    dst_column: "id",
  },
  {
    id: "r6",
    src_table: "members",
    src_column: "project_id",
    dst_table: "projects",
    dst_column: "id",
  },
  {
    id: "r7",
    src_table: "members",
    src_column: "user_id",
    dst_table: "auth.users",
    dst_column: "id",
  },
];

export const mockPolicies: DBPolicy[] = [
  {
    id: "p1",
    table_name: "profiles",
    policy_name: "profiles_select",
    roles: ["authenticated"],
    using_sql: "auth.uid() = user_id",
  },
  {
    id: "p2",
    table_name: "profiles",
    policy_name: "profiles_update",
    roles: ["authenticated"],
    using_sql: "auth.uid() = user_id",
    check_sql: "auth.uid() = user_id",
  },
  {
    id: "p3",
    table_name: "orders",
    policy_name: "orders_select",
    roles: ["authenticated"],
    using_sql: "auth.uid() = user_id",
  },
  {
    id: "p4",
    table_name: "orders",
    policy_name: "orders_insert",
    roles: ["authenticated"],
    using_sql: "",
    check_sql: "auth.uid() = user_id",
  },
  {
    id: "p5",
    table_name: "order_items",
    policy_name: "order_items_select",
    roles: ["authenticated"],
    using_sql:
      "EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())",
  },
  {
    id: "p6",
    table_name: "products",
    policy_name: "products_select",
    roles: ["authenticated", "anon"],
    using_sql: "true",
  },
  {
    id: "p7",
    table_name: "inventory",
    policy_name: "inventory_select",
    roles: ["authenticated"],
    using_sql: "true",
  },
  {
    id: "p8",
    table_name: "projects",
    policy_name: "proj_read",
    roles: ["authenticated"],
    using_sql: "is_project_member(id)",
  },
  {
    id: "p9",
    table_name: "members",
    policy_name: "members_rw",
    roles: ["authenticated"],
    using_sql:
      "EXISTS (SELECT 1 FROM members m WHERE m.project_id = members.project_id AND m.user_id = auth.uid())",
  },
];

export const mockMigrations: Migration[] = [
  {
    id: "1",
    name: "20240101_initial_schema.sql",
    sha: "a1b2c3d",
    applied_at: "2024-01-01T10:00:00Z",
  },
  { id: "2", name: "20240101_rls.sql", sha: "a3f4b2c", applied_at: "2024-01-01T11:30:00Z" },
  {
    id: "3",
    name: "20240102_orders_tables.sql",
    sha: "b7e9d1a",
    applied_at: "2024-01-02T09:15:00Z",
  },
  { id: "4", name: "20240102_orders_rls.sql", sha: "b7e9d1a", applied_at: "2024-01-02T09:20:00Z" },
  { id: "5", name: "20240103_inventory.sql", sha: "c4d8e2f", applied_at: "2024-01-03T14:45:00Z" },
  {
    id: "6",
    name: "20240105_projects_visudev.sql",
    sha: "e9f1a3b",
    applied_at: "2024-01-05T16:00:00Z",
  },
];

export const mockWebhookEvents: WebhookEvent[] = [
  {
    id: "1",
    provider: "github",
    event: "push",
    delivery_id: "abc-123-def",
    received_at: "2024-11-05T10:30:00Z",
    payload: { ref: "refs/heads/main", commits: 3 },
  },
  {
    id: "2",
    provider: "github",
    event: "pull_request",
    delivery_id: "ghi-456-jkl",
    received_at: "2024-11-05T11:15:00Z",
    payload: { action: "opened", number: 42 },
  },
  {
    id: "3",
    provider: "github",
    event: "push",
    delivery_id: "mno-789-pqr",
    received_at: "2024-11-05T12:00:00Z",
    payload: { ref: "refs/heads/feature/checkout", commits: 1 },
  },
];
