import ts from "typescript";
import { escapeHtml as h } from "../content.mjs";

// Read only string/object literals, never evaluate source frontmatter. If slide
// data gains computations, require an explicit native projection instead.
function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map((property) => {
        if (
          !ts.isPropertyAssignment(property) ||
          !property.name ||
          !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
        )
          throw new Error("Nonliteral presentation data");
        return [property.name.text, literal(property.initializer)];
      })
    );
  throw new Error(
    `Unsupported presentation literal: ${ts.SyntaxKind[node.kind]}`
  );
}

export function readDeck(source, file) {
  const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---/)?.[1];
  if (!frontmatter) throw new Error(`Missing presentation literals: ${file}`);
  const ast = ts.createSourceFile(
    file + ".ts",
    frontmatter,
    ts.ScriptTarget.ES2022,
    true
  );
  const constants = {};
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement))
      throw new Error(`Unexpected presentation declaration: ${file}`);
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer)
        throw new Error("Invalid presentation constant");
      constants[declaration.name.text] = literal(declaration.initializer);
    }
  }
  const html = source.slice(source.indexOf("<!doctype html>"));
  let body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1];
  if (!body || !constants.title || !constants.media)
    throw new Error(`Incomplete presentation: ${file}`);
  const script = body.match(
    /<script\s+is:inline\s+type="module">([\s\S]*?)<\/script>/
  )?.[1];
  if (!script) throw new Error(`Missing presentation controls: ${file}`);
  body = body.replace(
    /<script\s+is:inline\s+type="module">[\s\S]*?<\/script>/,
    ""
  );
  const lookup = (key, field) => {
    const value = constants.media[key]?.[field];
    if (typeof value !== "string")
      throw new Error(`Unknown presentation media: ${key}.${field}`);
    return h(value);
  };
  body = body
    .replace(
      /=\{media\.(\w+)\.(\w+)\}/g,
      (_, key, field) => `="${lookup(key, field)}"`
    )
    .replace(/\{media\.(\w+)\.(\w+)\}/g, (_, key, field) => lookup(key, field));
  if (/[{}]/.test(body))
    throw new Error(
      `New dynamic presentation markup needs a native port: ${file}`
    );
  const description = html.match(
    /<meta\s+name="description"\s+content="([^"]+)"/
  )?.[1];
  const stylesheets = [...html.matchAll(/<link rel="stylesheet"[^>]+>/g)]
    .map((match) => match[0])
    .join("\n");
  const css = html.match(/<style is:global>([\s\S]*?)<\/style>/)?.[1];
  if (!css || !description)
    throw new Error(`Incomplete presentation styles or metadata: ${file}`);
  return {
    title: constants.title,
    description,
    body,
    script,
    css,
    stylesheets,
  };
}
