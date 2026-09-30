/** Minimal Markdown renderer ported from journal.html (headings, lists, tasks, quotes, code, inline). */

function esc(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(t: string): string {
  return esc(t)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    );
}

export function renderMarkdown(src: string): string {
  const lines = src.split("\n");
  let o = "";
  let open: string | null = null;
  const close = () => {
    if (open) {
      o += `</${open}>`;
      open = null;
    }
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m: RegExpMatchArray | null;
    if (/^```/.test(l)) {
      close();
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      o += "<pre><code>" + esc(code.join("\n")) + "</code></pre>";
      continue;
    }
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) {
      close();
      o += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;
    } else if ((m = l.match(/^\s*[-*]\s+\[( |x)\]\s+(.*)/i))) {
      if (open !== "ul.tk") {
        close();
        o += '<ul class="tk">';
        open = "ul.tk";
      }
      o += `<li class="${m[1] !== " " ? "dn" : ""}"><i></i><span>${inline(m[2])}</span></li>`;
    } else if ((m = l.match(/^\s*[-*]\s+(.*)/))) {
      if (open !== "ul") {
        close();
        o += "<ul>";
        open = "ul";
      }
      o += `<li>${inline(m[1])}</li>`;
    } else if ((m = l.match(/^\s*\d+\.\s+(.*)/))) {
      if (open !== "ol") {
        close();
        o += "<ol>";
        open = "ol";
      }
      o += `<li>${inline(m[1])}</li>`;
    } else if ((m = l.match(/^>\s?(.*)/))) {
      close();
      o += `<blockquote>${inline(m[1])}</blockquote>`;
    } else if (/^---+$/.test(l)) {
      close();
      o += "<hr>";
    } else if (!l.trim()) {
      close();
    } else {
      close();
      o += `<p>${inline(l)}</p>`;
    }
  }
  close();
  return o;
}
