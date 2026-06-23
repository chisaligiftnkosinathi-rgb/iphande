const fs = require("fs");
const path = require("path");

function scanDir(dir) {
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

function printTree(node, indent = "") {
  console.log(indent + (node.type === "directory" ? "📁 " : "📄 ") + node.name);

  if (node.children) {
    node.children.forEach((child) => printTree(child, indent + "  "));
  }
}

function extractKeyFiles(root) {
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

function analyzeRoutes(appDir) {
  console.log("\n🧭 ROUTING STRUCTURE (Expo Router style):\n");

  if (!fs.existsSync(appDir)) {
    console.log("No /app directory found");
    return;
  }

  const walk = (dir, prefix = "") => {
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

function analyzePackage(root) {
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

function runAnalysis(projectRoot) {
  let output = "\n===============================\n";
  output += "IPHANDE PROJECT STRUCTURE AUDIT\n";
  output += "===============================\n\n";

  output += "📁 FULL DIRECTORY TREE:\n\n";
  
  function captureTree(node, indent = "") {
    output += indent + (node.type === "directory" ? "📁 " : "📄 ") + node.name + "\n";
    if (node.children) {
      node.children.forEach((child) => captureTree(child, indent + "  "));
    }
  }
  const tree = scanDir(projectRoot);
  captureTree(tree);

  // Package
  const pkgPath = path.join(projectRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    output += "\n📦 DEPENDENCIES:\n\nDependencies:\n";
    Object.keys(pkg.dependencies || {}).forEach((dep) => output += " - " + dep + "\n");
    output += "\nDevDependencies:\n";
    Object.keys(pkg.devDependencies || {}).forEach((dep) => output += " - " + dep + "\n");
  } else {
    output += "\nNo package.json found\n";
  }

  // Routes
  const appDir = path.join(projectRoot, "app");
  output += "\n🧭 ROUTING STRUCTURE (Expo Router style):\n\n";
  if (fs.existsSync(appDir)) {
    const walkRoutes = (dir, prefix = "") => {
      const items = fs.readdirSync(dir);
      items.forEach((item) => {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          output += `${prefix}📁 ${item}/\n`;
          walkRoutes(full, prefix + "  ");
        } else {
          output += `${prefix}📄 ${item}\n`;
        }
      });
    };
    walkRoutes(appDir);
  } else {
    output += "No /app directory found\n";
  }

  // Keys
  const targets = ["package.json", "app.json", "eas.json", "App.tsx", "index.ts"];
  output += "\n🔍 KEY FILE SNAPSHOT:\n\n";
  targets.forEach((file) => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      output += `--- ${file} ---\n`;
      output += fs.readFileSync(filePath, "utf-8").slice(0, 1500) + "\n\n";
    }
  });

  output += "\n✅ ANALYSIS COMPLETE\n";
  fs.writeFileSync("iphande_audit_out.txt", output, "utf-8");
}

const PROJECT_ROOT = process.argv[2] || ".";
runAnalysis(PROJECT_ROOT);
