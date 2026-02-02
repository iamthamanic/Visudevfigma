import { BaseService } from "./base.service.ts";
import type { DbSchema, Screen } from "../dto/index.ts";

interface AnthropicResponse {
  content?: Array<{ text?: string }>;
}

interface AiScreenPayload {
  id?: string;
  name?: string;
  path?: string;
  type?: string;
  framework?: string;
  tableName?: string;
  description?: string;
}

export class AiSchemaService extends BaseService {
  public async analyzeSchema(schema: DbSchema, deployedUrl: string): Promise<Screen[]> {
    if (!this.config.anthropic.apiKey) {
      this.logger.warn("ANTHROPIC_API_KEY not set, skipping AI analysis");
      return [];
    }

    const prompt = this.buildPrompt(schema, deployedUrl);

    try {
      const response = await fetch(this.config.anthropic.apiBaseUrl, {
        method: "POST",
        headers: {
          "x-api-key": this.config.anthropic.apiKey,
          "anthropic-version": this.config.anthropic.version,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.anthropic.model,
          max_tokens: this.config.anthropic.maxTokens,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn("Anthropic API error", {
          status: response.status,
          error: errorText,
        });
        return [];
      }

      const payload = (await response.json()) as AnthropicResponse;
      const aiText = payload.content?.[0]?.text;
      if (!aiText) {
        this.logger.warn("Anthropic response missing content");
        return [];
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(aiText);
      } catch (error) {
        this.logger.warn("Failed to parse AI response", {
          error: error instanceof Error ? error.message : "unknown",
        });
        return [];
      }

      if (!Array.isArray(parsed)) {
        this.logger.warn("AI response is not an array");
        return [];
      }

      const screens = parsed
        .map((entry) => this.mapAiScreen(entry))
        .filter((screen): screen is Screen => Boolean(screen));

      this.logger.info("AI schema analysis complete", {
        screens: screens.length,
      });
      return screens;
    } catch (error) {
      this.logger.error("AI schema analysis failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return [];
    }
  }

  private buildPrompt(schema: DbSchema, deployedUrl: string): string {
    const tablesSummary = schema.tables
      .map((table) => `- ${table.name} (${table.columns.length} columns, ${table.rowCount} rows)`)
      .join("\n");

    return `You are analyzing a database schema for a web application deployed at ${deployedUrl}.

Database Tables:
${tablesSummary}

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
  }

  private mapAiScreen(entry: unknown): Screen | null {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const record = entry as AiScreenPayload;
    if (
      typeof record.id !== "string" ||
      typeof record.name !== "string" ||
      typeof record.path !== "string"
    ) {
      return null;
    }

    const framework = typeof record.framework === "string" ? record.framework : "database-driven";
    const tableName = typeof record.tableName === "string" ? record.tableName : "unknown";
    const description = typeof record.description === "string" ? record.description : undefined;

    return {
      id: record.id,
      name: record.name,
      path: record.path,
      filePath: `database:${tableName}`,
      type: record.type === "screen" || record.type === "view" ? record.type : "page",
      flows: [],
      navigatesTo: [],
      framework,
      tableName,
      description,
    };
  }
}
