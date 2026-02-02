import type { FileContent, Screen } from "../dto/index.ts";

export class ScreenExtractionService {
  public extractNextJsAppRouterScreens(files: FileContent[]): Screen[] {
    const screens: Screen[] = [];

    files.forEach((file) => {
      const match = file.path.match(/app\/(.*?)\/page\.(tsx?|jsx?)$/);
      if (match) {
        let routePath = `/${match[1] === "" ? "" : match[1]}`;
        routePath = routePath.replace(/\[([^\]]+)\]/g, ":$1");
        const segment =
          routePath === "/" ? "Home" : (routePath.split("/").filter(Boolean).pop() ?? "Unknown");

        screens.push({
          id: `screen:${file.path}`,
          name: segment.charAt(0).toUpperCase() + segment.slice(1),
          path: routePath,
          filePath: file.path,
          type: "page",
          flows: [],
          navigatesTo: this.extractNavigationLinks(file.content),
          framework: "nextjs-app-router",
          componentCode: file.content,
        });
      }
    });

    return screens;
  }

  public extractNextJsPagesRouterScreens(files: FileContent[]): Screen[] {
    const screens: Screen[] = [];

    files.forEach((file) => {
      const match = file.path.match(/^pages\/(.*?)\.(tsx?|jsx?)$/);
      if (match) {
        let routePath = `/${match[1]}`;

        if (routePath.endsWith("/index")) {
          routePath = routePath.replace("/index", "") || "/";
        }
        if (routePath === "/index") {
          routePath = "/";
        }

        routePath = routePath.replace(/\[([^\]]+)\]/g, ":$1");

        const segment =
          routePath === "/" ? "Home" : (routePath.split("/").filter(Boolean).pop() ?? "Unknown");

        screens.push({
          id: `screen:${file.path}`,
          name: segment.charAt(0).toUpperCase() + segment.slice(1),
          path: routePath,
          filePath: file.path,
          type: "page",
          flows: [],
          navigatesTo: this.extractNavigationLinks(file.content),
          framework: "nextjs-pages-router",
          componentCode: file.content,
        });
      }
    });

    return screens;
  }

  public extractReactRouterScreens(files: FileContent[]): Screen[] {
    const screens: Screen[] = [];

    files.forEach((file) => {
      const routeRegex = /<Route\s+path=["']([^"']+)["']\s+element=\{<(\w+)/g;
      let match: RegExpExecArray | null;

      while ((match = routeRegex.exec(file.content)) !== null) {
        const routePath = match[1];
        const componentName = match[2];

        screens.push({
          id: `screen:${componentName}:${routePath}`,
          name: componentName,
          path: routePath,
          filePath: file.path,
          type: "page",
          flows: [],
          navigatesTo: this.extractNavigationLinks(file.content),
          framework: "react-router",
        });
      }

      const routerConfigRegex = /\{\s*path:\s*["']([^"']+)["'],\s*element:\s*<(\w+)/g;
      while ((match = routerConfigRegex.exec(file.content)) !== null) {
        const routePath = match[1];
        const componentName = match[2];

        if (!screens.some((screen) => screen.path === routePath && screen.name === componentName)) {
          screens.push({
            id: `screen:${componentName}:${routePath}`,
            name: componentName,
            path: routePath,
            filePath: file.path,
            type: "page",
            flows: [],
            navigatesTo: this.extractNavigationLinks(file.content),
            framework: "react-router",
          });
        }
      }
    });

    return screens;
  }

  public extractNuxtScreens(files: FileContent[]): Screen[] {
    const screens: Screen[] = [];

    files.forEach((file) => {
      const match = file.path.match(/^pages\/(.*?)\.vue$/);
      if (match) {
        let routePath = `/${match[1]}`;

        if (routePath.endsWith("/index")) {
          routePath = routePath.replace("/index", "") || "/";
        }
        if (routePath === "/index") {
          routePath = "/";
        }

        routePath = routePath.replace(/\[([^\]]+)\]/g, ":$1");

        const segment =
          routePath === "/" ? "Home" : (routePath.split("/").filter(Boolean).pop() ?? "Unknown");

        screens.push({
          id: `screen:${file.path}`,
          name: segment.charAt(0).toUpperCase() + segment.slice(1),
          path: routePath,
          filePath: file.path,
          type: "page",
          flows: [],
          navigatesTo: this.extractNavigationLinks(file.content),
          framework: "nuxt",
          componentCode: file.content,
        });
      }
    });

    return screens;
  }

  public extractScreensHeuristic(files: FileContent[]): Screen[] {
    const screens: Screen[] = [];

    files.forEach((file) => {
      if (file.path.includes("/components/")) {
        return;
      }

      const pathMatch = file.path.match(
        /(?:^|\/(?:src|app)\/)(?:screens?|pages?|views?|routes?)\/([^\/]+)\.(tsx?|jsx?)$/i,
      );
      if (pathMatch) {
        const screenName = pathMatch[1];
        const routePath = `/${screenName.toLowerCase().replace(/screen|page|view$/i, "")}`;

        screens.push({
          id: `screen:${file.path}`,
          name: screenName.charAt(0).toUpperCase() + screenName.slice(1),
          path: routePath,
          filePath: file.path,
          type: "screen",
          flows: [],
          navigatesTo: this.extractNavigationLinks(file.content),
          framework: "heuristic",
          componentCode: file.content,
        });
        return;
      }

      const componentMatch = file.path.match(/\/components?\/([^\/]+)\.(tsx?|jsx?)$/);
      if (componentMatch && !file.path.includes("/components/pages/")) {
        const componentName = componentMatch[1];

        if (
          /^[A-Z]/.test(componentName) &&
          (componentName.endsWith("Screen") ||
            componentName.endsWith("Page") ||
            componentName.endsWith("View") ||
            componentName.length > 8)
        ) {
          screens.push({
            id: `screen:${file.path}`,
            name: componentName,
            path: `/${componentName.toLowerCase().replace(/screen|page|view$/i, "")}`,
            filePath: file.path,
            type: "screen",
            flows: [],
            navigatesTo: this.extractNavigationLinks(file.content),
            framework: "heuristic",
            componentCode: file.content,
          });
        }
      }
    });

    return screens;
  }

  private extractNavigationLinks(content: string): string[] {
    const links: string[] = [];
    const patterns = [
      /router\.push\s*\(\s*["']([^"']+)["']/g,
      /href=["']([^"']+)["']/g,
      /navigate\s*\(\s*["']([^"']+)["']/g,
      /navigateTo\s*\(\s*["']([^"']+)["']/g,
      /<Link[^>]+to=["']([^"']+)["']/g,
      /<NavLink[^>]+to=["']([^"']+)["']/g,
    ];

    patterns.forEach((pattern) => {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const link = match[1];
        if (link.startsWith("/") && !link.startsWith("//") && !links.includes(link)) {
          links.push(link);
        }
      }
    });

    return links;
  }
}
