import DOMPurify from "dompurify";

/**
 * Tags allowed in configurable banner content. Deliberately small: enough for
 * headings, paragraphs, emphasis, line breaks, links and simple lists, but no
 * scripts, media, iframes, forms or styling hooks.
 */
const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "br",
  "ul",
  "ol",
  "li",
  "a",
];

/**
 * Attributes allowed on the tags above. Only what links need; note `style`,
 * `class`, `id` and all `on*` handlers are intentionally excluded.
 */
const ALLOWED_ATTR = ["href", "target", "rel", "title"];

/**
 * Sanitize banner HTML that originates from runtime configuration.
 *
 * Even though the content is set by operators via a ConfigMap, this is rendered
 * on the public (pre-login) welcome page, so it is treated as untrusted and run
 * through an allowlist. Scripts, event handlers, inline styles and `javascript:`
 * URLs are stripped; safe structural markup and links are preserved.
 */
// Harden links: anything opening a new tab must not leak the opener window.
let hookRegistered = false;
const registerLinkHook = () => {
  if (hookRegistered) {
    return;
  }
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  hookRegistered = true;
};

export const sanitizeBannerHtml = (html: string): string => {
  if (!html) {
    return "";
  }
  registerLinkHook();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Only permit safe URL schemes on links (blocks javascript:, data:, etc.).
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
  });
};
