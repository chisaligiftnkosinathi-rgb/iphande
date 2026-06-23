/**
 * IPHANDE CODEBASE STRUCTURE ANALYZER
 * -----------------------------------
 * Purpose:
 *  - Map full project structure
 *  - Identify entry points
 *  - Detect routing system
 *  - List build/deploy configuration
 *  - Extract dependency graph surface
 *
 * No business logic interpretation is performed.
 */

import fs from "fs";
import path from "path";

type TreeNode = {
  name: string;
  type: "file" | "directory";
  children?: TreeNode[];
};

function scanDir(dir: string): TreeNode {
  const stats = fs.statSync(dir);

  if (!stats.isDirectory()) {
    return { name: path.basename(dir), type: "file" };
  }

  const children = fs.readdirSync(dir)
    .filter(child => child !== 'node_modules' && child !== '.git' && child !== '.expo')
    .map((child) => scanDir(path.join(dir, child)));

  return {
    name: path.basename(dir),
    type: "directory",
    children,
  };
}

function printTree(node: TreeNode, indent = "") {
  console.log(indent + (node.type === "directory" ? "📁 " : "📄 ") + node.name);

  if (node.children) {
    node.children.forEach((child) => printTree(child, indent + "  "));
  }
}

function extractKeyFiles(root: string) {
  const targets = [
    "package.json",
    "app.json",
    "eas.json",
    "App.tsx",
    "index.ts",
  ];

  console.log("\n🔍 KEY FILE SNAPSHOT:\n");

  targets.forEach((file) => {
    const filePath = path.join(root, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      console.log(`--- ${file} ---`);
      console.log(content.slice(0, 1500)); // safe preview limit
      console.log("\n");
    }
  });
}

function analyzeRoutes(appDir: string) {
  console.log("\n🧭 ROUTING STRUCTURE (Expo Router style):\n");

  if (!fs.existsSync(appDir)) {
    console.log("No /app directory found");
    return;
  }

  const walk = (dir: string, prefix = "") => {
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const full = path.join(dir, item);
      const stats = fs.statSync(full);

      if (stats.isDirectory()) {
        console.log(`${prefix}📁 ${item}/`);
        walk(full, prefix + "  ");
      } else {
        console.log(`${prefix}📄 ${item}`);
      }
    });
  };

  walk(appDir);
}

function analyzePackage(root: string) {
  const pkgPath = path.join(root, "package.json");

  if (!fs.existsSync(pkgPath)) {
    console.log("No package.json found");
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  console.log("\n📦 DEPENDENCIES:\n");

  console.log("Dependencies:");
  Object.keys(pkg.dependencies || {}).forEach((dep) =>
    console.log(" - " + dep)
  );

  console.log("\nDevDependencies:");
  Object.keys(pkg.devDependencies || {}).forEach((dep) =>
    console.log(" - " + dep)
  );
}

function runAnalysis(projectRoot: string) {
  console.log("\n===============================");
  console.log("IPHANDE PROJECT STRUCTURE AUDIT");
  console.log("===============================\n");

  console.log("📁 FULL DIRECTORY TREE:\n");
  const tree = scanDir(projectRoot);
  printTree(tree);

  analyzePackage(projectRoot);
  analyzeRoutes(path.join(projectRoot, "app"));
  extractKeyFiles(projectRoot);

  console.log("\n✅ ANALYSIS COMPLETE");
}

// RUN
const PROJECT_ROOT = process.argv[2] || ".";
runAnalysis(PROJECT_ROOT);
