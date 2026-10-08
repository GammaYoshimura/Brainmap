import { DependencyModel } from "../core/model.js";

export interface DependencyGroup {
  kind: "production" | "development" | "peer" | "optional";
  title: string;
  dependencies: DependencyModel[];
}

export function groupDependenciesByKind(dependencies: DependencyModel[]): DependencyGroup[] {
  const kindOrder: ("production" | "development" | "peer" | "optional")[] = [
    "production",
    "development",
    "peer",
    "optional",
  ];

  const kindTitles: Record<string, string> = {
    production: "Production",
    development: "Development",
    peer: "Peer",
    optional: "Optional",
  };

  const groups: DependencyGroup[] = [];

  for (const kind of kindOrder) {
    const depsOfKind = dependencies
      .filter((d) => (d.kind || "production") === kind)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (depsOfKind.length > 0) {
      groups.push({
        kind,
        title: kindTitles[kind],
        dependencies: depsOfKind,
      });
    }
  }

  return groups;
}

export function formatDependencyMap(dependencies: DependencyModel[]): string {
  if (dependencies.length === 0) {
    return "### Declared Dependencies\n\nNo declared dependencies.\n";
  }

  const groups = groupDependenciesByKind(dependencies);
  const lines: string[] = ["### Declared Dependencies", ""];

  for (const group of groups) {
    lines.push(`#### ${group.title} (${group.dependencies.length})`, "");

    for (const dep of group.dependencies) {
      const verDisplay = dep.version ? ` (\`${dep.version}\`)` : "";
      const sourceDisplay = dep.manifestPath ? ` — _${dep.manifestPath}_` : "";
      lines.push(`- **\`${dep.name}\`**${verDisplay}${sourceDisplay}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}
