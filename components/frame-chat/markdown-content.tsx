import { Fragment } from "react";
import { CodeBlock } from "./code-block";

function inline(value: string) {
  return value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code className="rounded-md bg-zumthor px-1 py-0.5 font-mono text-xs" key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const cells = (line: string) => line.trim().slice(1, -1).split("|").map((cell) => cell.trim());

/** Small, safe Markdown renderer for model output-no raw HTML is injected into the board. */
export function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index++;
      while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
      nodes.push(<CodeBlock key={`code-${index}`} code={code.join("\n")} language={language} />);
      index++;
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Tag = (`h${heading[1].length}` as "h1" | "h2" | "h3");
      nodes.push(<Tag key={`heading-${index}`} className="mt-3 font-semibold text-black first:mt-0">{inline(heading[2])}</Tag>);
      index++;
      continue;
    }
    if (isTableRow(line) && index + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[index + 1])) {
      const header = cells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && isTableRow(lines[index])) rows.push(cells(lines[index++]));
      nodes.push(<div className="my-3 overflow-x-auto" key={`table-${index}`}><table className="w-full border-collapse text-left text-xs"><thead className="bg-zumthor"><tr>{header.map((cell, cellIndex) => <th className="border border-stroke px-2 py-1.5 font-medium" key={cellIndex}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td className="border border-stroke px-2 py-1.5 align-top" key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) items.push(lines[index++].replace(/^\s*[-*]\s+/, ""));
      nodes.push(<ul className="my-2 list-disc space-y-1 pl-5" key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ul>);
      continue;
    }
    if (line.trim()) nodes.push(<p className="my-2 first:mt-0 last:mb-0" key={`paragraph-${index}`}>{inline(line)}</p>);
    index++;
  }
  return <>{nodes}</>;
}