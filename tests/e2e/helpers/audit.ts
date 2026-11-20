import type { Page } from "@playwright/test";

// Checks that run inside the page and return a list of problems, empty when the page is fine.
// They cover what an automated check can judge reliably; a person with a screen reader still needs to
// try the site from time to time.

export async function auditPage(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    const visible = (el: Element) => {
      const s = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && b.width > 0 && b.height > 0;
    };

    // Exactly one main heading, and heading levels that do not skip (an h2 followed by an h4).
    const h1 = [...document.querySelectorAll("h1")].filter(visible).length;
    if (h1 !== 1) problems.push(`${h1} visible h1 headings, expected 1`);
    const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
    for (let i = 1; i < levels.length; i++) {
      if (levels[i]! - levels[i - 1]! > 1) problems.push(`heading jumps from h${levels[i - 1]} to h${levels[i]}`);
    }

    // Every image says what it shows, or says it is decoration with alt="".
    for (const img of document.images) if (!img.hasAttribute("alt")) problems.push(`image without alt: ${img.src.slice(-60)}`);

    // Every link and button has a name a screen reader can say.
    for (const el of document.querySelectorAll("a,button,summary,[role=button]")) {
      if (!visible(el)) continue;
      const named = el.getAttribute("aria-label") || el.textContent?.trim() || el.getAttribute("title");
      if (!named) problems.push(`control without a name: ${el.outerHTML.slice(0, 80)}`);
    }

    // Every form field has a label.
    for (const el of document.querySelectorAll<HTMLInputElement>("input,select,textarea")) {
      if (el.type === "hidden" || !visible(el)) continue;
      if (!(el.labels?.length || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby"))) {
        problems.push(`field without a label: ${el.outerHTML.slice(0, 80)}`);
      }
    }

    // Ids must be unique, or labels and links that point at them break.
    const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
    for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) problems.push(`duplicate id #${id}`);

    // Text contrast, WCAG AA: 4.5 to 1, or 3 to 1 for large text. Only text on a solid background is
    // judged; over a photograph no single background colour exists. The browser converts each colour by
    // painting one pixel, which handles every CSS colour format.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const rgba = (c: string): number[] => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return [r!, g!, b!, a! / 255];
    };
    const over = (top: number[], bottom: number[]) => [0, 1, 2].map((i) => top[i]! * top[3]! + bottom[i]! * (1 - top[3]!)).concat(1);
    const lum = (c: number[]) => {
      const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(c[0]!) + 0.7152 * f(c[1]!) + 0.0722 * f(c[2]!);
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (!el || seen.has(el) || !walker.currentNode.textContent?.trim() || !visible(el)) continue;
      seen.add(el);
      if (el.closest("[aria-hidden=true],.sr-only,svg,canvas")) continue;
      const style = getComputedStyle(el);
      if (parseFloat(style.opacity) < 0.99) continue;
      const layers: number[][] = [];
      let overImage = false;
      for (let n: Element | null = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.backgroundImage !== "none") {
          overImage = true;
          break;
        }
        const c = rgba(s.backgroundColor);
        if (c[3]! > 0) layers.push(c);
        if (c[3]! > 0.99) break;
        const siblings = n.parentElement ? [...n.parentElement.children] : [];
        if (siblings.some((sib) => sib !== n && sib.tagName === "IMG" && getComputedStyle(sib).position === "absolute")) {
          overImage = true;
          break;
        }
      }
      if (overImage || layers.length === 0 || layers.at(-1)![3]! <= 0.99) continue;
      let bg = layers.at(-1)!;
      for (let i = layers.length - 2; i >= 0; i--) bg = over(layers[i]!, bg);
      const fg = over(rgba(style.color), bg);
      const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
      const ratio = (hi! + 0.05) / (lo! + 0.05);
      const px = parseFloat(style.fontSize);
      const need = px >= 24 || (px >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5;
      if (ratio < need) {
        problems.push(`contrast ${ratio.toFixed(2)} below ${need}: "${walker.currentNode.textContent.trim().slice(0, 40)}"`);
      }
    }

    // Nothing pushes the page sideways.
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    if (overflow > 0) problems.push(`page scrolls sideways by ${overflow}px`);
    return problems;
  });
}
