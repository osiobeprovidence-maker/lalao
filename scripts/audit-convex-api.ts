import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, relative, resolve, sep } from "node:path";
import ts from "typescript";

type BackendFunction = { module: string; name: string; kind: string; visibility: "public" | "internal"; file: string };
type FrontendReference = { module: string; name: string; file: string; line: number; hook?: string };

const root = resolve(import.meta.dirname, "..");
const supported = new Set(["query", "mutation", "action", "internalQuery", "internalMutation", "internalAction"]);

function sourceFiles(directory: string, excludedDirectories = new Set<string>()): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (entry.startsWith(".") || excludedDirectories.has(entry)) continue;
    const path = resolve(directory, entry);
    const info = statSync(path);
    if (info.isDirectory()) result.push(...sourceFiles(path, excludedDirectories));
    else if ([".ts", ".tsx"].includes(extname(entry)) && !entry.endsWith(".d.ts")) result.push(path);
  }
  return result.sort();
}

function unwrap(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (ts.isParenthesizedExpression(current)
    || ts.isAsExpression(current)
    || ts.isTypeAssertionExpression(current)
    || ts.isNonNullExpression(current)
    || ts.isSatisfiesExpression(current)) {
    current = current.expression;
  }
  return current;
}

function apiPath(expression: ts.Expression): string[] | null {
  const current = unwrap(expression);
  if (ts.isIdentifier(current) && current.text === "api") return [];
  if (!ts.isPropertyAccessExpression(current)) return null;
  const parent = apiPath(current.expression);
  return parent ? [...parent, current.name.text] : null;
}

function functionInventory(): BackendFunction[] {
  const functions: BackendFunction[] = [];
  for (const file of sourceFiles(resolve(root, "convex"), new Set(["_generated"]))) {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const declarations = new Map<string, ts.Expression>();
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement) || !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer) declarations.set(declaration.name.text, declaration.initializer);
      }
    }
    const resolveKind = (name: string, visited = new Set<string>()): string | null => {
      if (visited.has(name)) return null;
      visited.add(name);
      const initializer = declarations.get(name);
      if (!initializer) return null;
      const expression = unwrap(initializer);
      if (ts.isCallExpression(expression)) {
        const callee = unwrap(expression.expression);
        return ts.isIdentifier(callee) && supported.has(callee.text) ? callee.text : null;
      }
      return ts.isIdentifier(expression) ? resolveKind(expression.text, visited) : null;
    };
    for (const name of declarations.keys()) {
        const functionKind = resolveKind(name);
        if (!functionKind) continue;
        const moduleName = relative(resolve(root, "convex"), file).split(sep).join("/").replace(/\.ts$/, "");
        const kind = functionKind.replace(/^internal/, "").toLowerCase();
        functions.push({
          module: moduleName,
          name,
          kind,
          visibility: functionKind.startsWith("internal") ? "internal" : "public",
          file: relative(root, file).split(sep).join("/"),
        });
    }
  }
  return functions.sort((a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name));
}

function frontendReferences(): FrontendReference[] {
  const references: FrontendReference[] = [];
  for (const file of sourceFiles(resolve(root, "src"))) {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node: ts.Node): void {
      if (ts.isPropertyAccessExpression(node)) {
        const path = apiPath(node);
        if (path?.length === 2) {
          let hook: string | undefined;
          const parent = node.parent;
          if (ts.isCallExpression(parent) && parent.arguments.some((argument) => argument === node || unwrap(argument) === node)) {
            const callee = unwrap(parent.expression);
            if (ts.isIdentifier(callee) && ["useQuery", "useMutation", "useAction"].includes(callee.text)) hook = callee.text;
          }
          const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
          references.push({ module: path[0], name: path[1], file: relative(root, file).split(sep).join("/"), line: line + 1, ...(hook ? { hook } : {}) });
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return references;
}

const functions = functionInventory();
const references = frontendReferences();
const publicFunctions = new Set(functions.filter((fn) => fn.visibility === "public").map((fn) => `${fn.module}.${fn.name}`));
const missing = references.filter((ref) => !publicFunctions.has(`${ref.module}.${ref.name}`));
const summarize = (items: BackendFunction[], field: "visibility" | "kind") => Object.fromEntries(
  [...new Set(items.map((item) => item[field]))].sort().map((key) => [key, items.filter((item) => item[field] === key).length]),
);
const byModule = new Map<string, { public: number; internal: number; frontendReferences: number; uniqueFrontendCalls: Set<string> }>();
for (const fn of functions) {
  const item = byModule.get(fn.module) ?? { public: 0, internal: 0, frontendReferences: 0, uniqueFrontendCalls: new Set<string>() };
  item[fn.visibility] += 1;
  byModule.set(fn.module, item);
}
for (const ref of references) {
  const item = byModule.get(ref.module) ?? { public: 0, internal: 0, frontendReferences: 0, uniqueFrontendCalls: new Set<string>() };
  item.frontendReferences += 1;
  item.uniqueFrontendCalls.add(ref.name);
  byModule.set(ref.module, item);
}

console.log(JSON.stringify({
  source: "convex/*.ts and src/**/*.{ts,tsx}",
  backendFunctionCount: functions.length,
  backendByVisibility: summarize(functions, "visibility"),
  backendByKind: summarize(functions, "kind"),
  frontendReferenceCount: references.length,
  uniqueFrontendCalls: new Set(references.map((ref) => `${ref.module}.${ref.name}`)).size,
  unresolvedFrontendReferenceCount: missing.length,
  byModule: Object.fromEntries([...byModule.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => [name, {
    public: value.public,
    internal: value.internal,
    frontendReferences: value.frontendReferences,
    uniqueFrontendCalls: value.uniqueFrontendCalls.size,
  }])),
  unresolvedFrontendReferences: missing.map(({ module, name, file, line }) => ({ module, name, file, line })),
}, null, 2));

if (missing.length) process.exitCode = 1;
