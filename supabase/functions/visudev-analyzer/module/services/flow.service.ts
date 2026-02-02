import type { CodeFlow, Screen } from "../dto/index.ts";

export class FlowService {
  public analyzeFile(filePath: string, content: string): CodeFlow[] {
    const flows: CodeFlow[] = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      const eventHandlerRegex =
        /\b(onClick|onSubmit|onChange|onKeyPress|onFocus|onBlur|onPress|onTouchStart)\s*=\s*\{([^}]+)\}/g;
      let match: RegExpExecArray | null;

      while ((match = eventHandlerRegex.exec(line)) !== null) {
        const eventType = match[1];
        flows.push({
          id: `${filePath}:${lineNum}:event:${eventType}`,
          type: "ui-event",
          name: `${eventType}`,
          file: filePath,
          line: lineNum,
          code: trimmed,
          calls: [],
          color: "#03ffa3",
        });
      }

      const funcRegex =
        /(const|function)\s+(handle\w+|on\w+)\s*=?\s*(?:async\s*)?\(/;
      if (funcRegex.test(line)) {
        const funcMatch = line.match(/(handle\w+|on\w+)/);
        if (funcMatch) {
          flows.push({
            id: `${filePath}:${lineNum}:function:${funcMatch[1]}`,
            type: "function-call",
            name: funcMatch[1],
            file: filePath,
            line: lineNum,
            code: trimmed,
            calls: [],
            color: "#8b5cf6",
          });
        }
      }

      if (line.includes("fetch(") || line.includes("axios.")) {
        const apiMatch = line.match(
          /(?:fetch|axios\.\w+)\s*\(\s*["'`]([^"'`]+)["'`]/,
        );
        if (apiMatch) {
          const url = apiMatch[1];
          let method = "GET";

          if (line.includes("method:")) {
            const methodMatch = line.match(/method:\s*["'](\w+)["']/);
            if (methodMatch) {
              method = methodMatch[1].toUpperCase();
            }
          } else if (line.includes("axios.post")) method = "POST";
          else if (line.includes("axios.put")) method = "PUT";
          else if (line.includes("axios.delete")) method = "DELETE";
          else if (line.includes("axios.patch")) method = "PATCH";

          flows.push({
            id: `${filePath}:${lineNum}:api`,
            type: "api-call",
            name: `${method} ${url}`,
            file: filePath,
            line: lineNum,
            code: trimmed,
            calls: [],
            color: "#3b82f6",
          });
        }
      }

      if (line.includes("supabase.from(")) {
        const dbMatch = line.match(/supabase\.from\s*\(\s*["'`]([^"'`]+)["'`]/);
        if (dbMatch) {
          const tableName = dbMatch[1];
          let operation = "select";

          if (line.includes(".insert(")) operation = "insert";
          else if (line.includes(".update(")) operation = "update";
          else if (line.includes(".delete(")) operation = "delete";
          else if (line.includes(".select(")) operation = "select";

          flows.push({
            id: `${filePath}:${lineNum}:db`,
            type: "db-query",
            name: `${operation.toUpperCase()} ${tableName}`,
            file: filePath,
            line: lineNum,
            code: trimmed,
            calls: [],
            color: "#ef4444",
          });
        }
      }

      if (line.match(/\.(query|execute)\s*\(\s*["'`]/)) {
        const sqlMatch = line.match(
          /\.(query|execute)\s*\(\s*["'`]([^"'`]+)["'`]/,
        );
        if (sqlMatch) {
          const sql = sqlMatch[2].substring(0, 60);
          flows.push({
            id: `${filePath}:${lineNum}:sql`,
            type: "db-query",
            name: sql,
            file: filePath,
            line: lineNum,
            code: trimmed,
            calls: [],
            color: "#ef4444",
          });
        }
      }
    });

    return flows;
  }

  public mapFlowsToScreens(
    screens: Screen[],
    flows: CodeFlow[],
    commitSha: string,
  ): Screen[] {
    return screens.map((screen) => {
      const screenFlows = flows
        .filter((flow) => flow.file === screen.filePath)
        .map((flow) => flow.id);

      return {
        ...screen,
        flows: screenFlows,
        lastAnalyzedCommit: commitSha,
        screenshotStatus: "none",
      };
    });
  }
}
