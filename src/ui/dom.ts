type Attrs = Record<string, string | number | boolean | null | undefined>;

interface Options {
  class?: string;
  text?: string;
  html?: string;
  title?: string;
  attrs?: Attrs;
  dataset?: Record<string, string>;
  style?: Partial<CSSStyleDeclaration>;
  on?: Partial<Record<keyof HTMLElementEventMap, EventListener>>;
}

export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: Options = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (options.class) node.className = options.class;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.html !== undefined) node.innerHTML = options.html;
  if (options.title !== undefined) node.title = options.title;
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      if (value === false || value == null) continue;
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }
  if (options.dataset) {
    for (const [key, value] of Object.entries(options.dataset)) node.dataset[key] = value;
  }
  if (options.style) Object.assign(node.style, options.style);
  if (options.on) {
    for (const [event, handler] of Object.entries(options.on)) {
      if (handler) node.addEventListener(event, handler);
    }
  }
  for (const child of children) node.append(child);
  return node;
};

export const empty = (node: Element): void => {
  while (node.firstChild) node.firstChild.remove();
};
