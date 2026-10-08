import { FileModel } from "../core/model.js";
import { isEntryPoint } from "../detector/entrypoints.js";
import { isManifest } from "../detector/manifests.js";
import { ProjectDiff } from "../scanner/updater.js";

export interface ProjectMapChangeRelevance {
  hasStructuralChanges: boolean;
  affectsEntryPoints: boolean;
  affectsManifestsOrDependencies: boolean;
  affectsModules: boolean;
  affectsDirectories: boolean;
  affectsFiles: boolean;
  reasons: string[];
}

export function detectRelevantProjectChanges(diff: ProjectDiff): ProjectMapChangeRelevance {
  const reasons: string[] = [];

  let affectsEntryPoints = false;
  let affectsManifestsOrDependencies = false;
  let affectsModules = false;
  let affectsDirectories = false;
  let affectsFiles = false;

  if (diff.added.length > 0) {
    affectsFiles = true;
    affectsDirectories = true;
    reasons.push(`Added ${diff.added.length} file(s)`);
    for (const file of diff.added) {
      if (file.isEntrypoint || isEntryPoint(file.relativePath)) {
        affectsEntryPoints = true;
        reasons.push(`New entry-point added: ${file.relativePath}`);
      }
      if (isManifest(file.relativePath)) {
        affectsManifestsOrDependencies = true;
        reasons.push(`New manifest added: ${file.relativePath}`);
      }
      if (file.relativePath.includes("/")) {
        affectsModules = true;
      }
    }
  }

  if (diff.removed.length > 0) {
    affectsFiles = true;
    affectsDirectories = true;
    reasons.push(`Removed ${diff.removed.length} file(s)`);
    for (const file of diff.removed) {
      if (file.isEntrypoint || isEntryPoint(file.relativePath)) {
        affectsEntryPoints = true;
        reasons.push(`Entry-point removed: ${file.relativePath}`);
      }
      if (isManifest(file.relativePath)) {
        affectsManifestsOrDependencies = true;
        reasons.push(`Manifest removed: ${file.relativePath}`);
      }
      if (file.relativePath.includes("/")) {
        affectsModules = true;
      }
    }
  }

  if (diff.modified.length > 0) {
    for (const file of diff.modified) {
      if (isManifest(file.relativePath)) {
        affectsManifestsOrDependencies = true;
        reasons.push(`Manifest modified: ${file.relativePath}`);
      }
      if (file.isEntrypoint || isEntryPoint(file.relativePath)) {
        affectsEntryPoints = true;
        reasons.push(`Entry-point modified: ${file.relativePath}`);
      }
    }
  }

  for (const delta of diff.metadataChanges) {
    if (delta.changes.includes("language") || delta.changes.includes("isEntrypoint") || delta.changes.includes("extension")) {
      affectsFiles = true;
      reasons.push(`Metadata changed for ${delta.relativePath}: ${delta.changes.join(", ")}`);
    }
  }

  const hasStructuralChanges =
    affectsEntryPoints ||
    affectsManifestsOrDependencies ||
    affectsModules ||
    affectsDirectories ||
    diff.added.length > 0 ||
    diff.removed.length > 0;

  return {
    hasStructuralChanges,
    affectsEntryPoints,
    affectsManifestsOrDependencies,
    affectsModules,
    affectsDirectories,
    affectsFiles,
    reasons,
  };
}

export function isMapUpdateRequired(relevance: ProjectMapChangeRelevance): boolean {
  return relevance.hasStructuralChanges || relevance.affectsFiles;
}
