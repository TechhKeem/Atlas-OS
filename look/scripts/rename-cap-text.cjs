// Replace the visible word "Cap" (the brand / the name for a recording) with
// "Look" in string literals and JSX text only. Code, imports, URLs, headers and
// class names are left alone. Usage: node rename-cap.cjs <repo> <file...>
const fs = require("fs");
const path = require("path");
const repo = process.argv[2];
const ts = require(path.join(repo, "node_modules/typescript"));
const files = process.argv.slice(3);

const SKIP_ATTRS = new Set(["href", "src", "className", "id", "key", "type", "name", "rel", "target", "role", "htmlFor", "value", "as", "data-testid"]);
const PHRASES = [
  [/\bCap blue\b/g, "Look green"],
  [/\bthe Cap desktop app\b/g, "the desktop app"],
  [/\bThe Cap desktop app\b/g, "The desktop app"],
];
const WORD = /(?<![A-Za-z0-9_\-./@#:])Cap('s|s)?(?![A-Za-z0-9_\-(])/g;

function looksTechnical(s) {
  return /^(X-|https?:|\/|@|\.|[a-z0-9_\-]+$)/.test(s) || /\.(tsx?|js|svg|png|json)\b/.test(s) || s.includes("Cap Software") || /^[A-Z0-9_]+$/.test(s);
}
function fix(text) {
  let out = text;
  for (const [re, rep] of PHRASES) out = out.replace(re, rep);
  return out.replace(WORD, (_m, suf) => "Look" + (suf || ""));
}

let changedFiles = 0, changes = 0;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = [];
  const visit = (node) => {
    const k = node.kind;
    const p = node.parent;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isImportTypeNode?.(node)) return;
    if (k === ts.SyntaxKind.StringLiteral || k === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
        k === ts.SyntaxKind.TemplateHead || k === ts.SyntaxKind.TemplateMiddle || k === ts.SyntaxKind.TemplateTail || k === ts.SyntaxKind.JsxText) {
      if (p && (ts.isPropertyAssignment(p) && p.name === node)) return;
      if (p && ts.isJsxAttribute(p) && SKIP_ATTRS.has(p.name.getText())) return;
      if (p && ts.isCallExpression(p) && /(\.get|headers\.|require|import|getElementById|querySelector)$/.test(p.expression.getText())) return;
      if (p && (ts.isElementAccessExpression(p) || ts.isLiteralTypeNode(p) || ts.isCaseClause?.(p))) return;
      if (p && ts.isBinaryExpression(p) && /^(===|!==|==|!=)$/.test(p.operatorToken.getText())) return;
      const start = node.getStart(sf), end = node.getEnd();
      const raw = src.slice(start, end);
      const inner = raw.replace(/^["'`}]|["'`]$|\$\{$/g, "");
      if (k !== ts.SyntaxKind.JsxText && looksTechnical(inner.trim())) return;
      const fixed = fix(raw);
      if (fixed !== raw) edits.push([start, end, fixed]);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!edits.length) continue;
  let out = src;
  for (const [s, e, t] of edits.sort((a, b) => b[0] - a[0])) out = out.slice(0, s) + t + out.slice(e);
  fs.writeFileSync(file, out);
  changedFiles++; changes += edits.length;
}
console.log(`changed ${changes} strings in ${changedFiles} files`);
