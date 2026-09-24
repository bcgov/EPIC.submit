/**
 * @vitest-environment jsdom
 *
 * DOMPurify depends on a spec-compliant DOM. The suite default (happy-dom) has a
 * known bug where DOMPurify only inspects parent elements and leaves disallowed
 * children such as <script> and <iframe> in place (capricorn86/happy-dom#1810),
 * so sanitize() cannot be trusted there. jsdom provides the DOM DOMPurify
 * expects, so this file overrides the environment to exercise the real sanitizer.
 */
import { describe, it, expect } from "vitest";
import { sanitizeBannerHtml } from "./sanitizeBannerHtml";

describe("sanitizeBannerHtml", () => {
  it("returns an empty string for empty input", () => {
    expect(sanitizeBannerHtml("")).toBe("");
  });

  it("preserves allowed structural markup (headings, paragraphs, bullets)", () => {
    const input =
      "<h3>Upgrades are coming</h3><p>Some <strong>bold</strong> text.</p><ul><li>One</li><li>Two</li></ul>";
    const output = sanitizeBannerHtml(input);
    expect(output).toContain("<h3>Upgrades are coming</h3>");
    expect(output).toContain("<strong>bold</strong>");
    expect(output).toContain("<li>One</li>");
    expect(output).toContain("<li>Two</li>");
  });

  it("preserves safe links including mailto", () => {
    const input =
      '<p>Contact <a href="mailto:EAO.EPICsystem@gov.bc.ca">us</a> or the <a href="https://example.gov.bc.ca">guide</a>.</p>';
    const output = sanitizeBannerHtml(input);
    expect(output).toContain('href="mailto:EAO.EPICsystem@gov.bc.ca"');
    expect(output).toContain('href="https://example.gov.bc.ca"');
  });

  it("strips <script> tags", () => {
    const output = sanitizeBannerHtml(
      "<p>Hello</p><script>alert('xss')</script>",
    );
    expect(output).not.toContain("<script");
    expect(output).not.toContain("alert(");
    expect(output).toContain("<p>Hello</p>");
  });

  it("strips inline event handlers", () => {
    const output = sanitizeBannerHtml('<p onclick="steal()">Hi</p>');
    expect(output).not.toContain("onclick");
    expect(output).not.toContain("steal()");
    expect(output).toContain("Hi");
  });

  it("strips javascript: URLs from links", () => {
    const output = sanitizeBannerHtml('<a href="javascript:alert(1)">x</a>');
    expect(output).not.toContain("javascript:");
  });

  it("removes inline style attributes", () => {
    const output = sanitizeBannerHtml(
      '<p style="position:fixed;top:0">boom</p>',
    );
    expect(output).not.toContain("style=");
    expect(output).toContain("boom");
  });

  it("drops disallowed tags like img and iframe", () => {
    const output = sanitizeBannerHtml(
      '<img src="x" onerror="alert(1)"><iframe src="evil"></iframe><p>ok</p>',
    );
    expect(output).not.toContain("<img");
    expect(output).not.toContain("<iframe");
    expect(output).not.toContain("onerror");
    expect(output).toContain("<p>ok</p>");
  });

  it("forces rel=noopener on links that open a new tab", () => {
    const output = sanitizeBannerHtml(
      '<a href="https://example.gov.bc.ca" target="_blank">x</a>',
    );
    expect(output).toContain('rel="noopener noreferrer"');
  });
});
