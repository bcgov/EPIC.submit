import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FrequencyBadge } from "./FrequencyBadge";
import {
  getFrequencyColors,
  FREQUENCY_AS_NEEDED,
  FREQUENCY_ONE_TIME,
} from "./frequencyColors";

describe("getFrequencyColors", () => {
  it("uses a red treatment for As Needed", () => {
    const red = getFrequencyColors(FREQUENCY_AS_NEEDED);
    const neutral = getFrequencyColors("Something Else");
    expect(red.background).not.toBe(neutral.background);
  });

  it("uses a purple treatment for One Time distinct from As Needed", () => {
    const purple = getFrequencyColors(FREQUENCY_ONE_TIME);
    const red = getFrequencyColors(FREQUENCY_AS_NEEDED);
    expect(purple.border).toBe("#6A54A3");
    expect(purple.background).toBe("#DAD4E8");
    expect(purple.background).not.toBe(red.background);
  });

  it("uses a gold treatment for recurring values", () => {
    const annually = getFrequencyColors("Annually");
    const monthly = getFrequencyColors("Monthly");
    expect(annually.background).toBe(monthly.background);
    expect(annually.background).not.toBe(getFrequencyColors(FREQUENCY_ONE_TIME).background);
  });

  it("falls back to a neutral treatment for unknown values", () => {
    const other = getFrequencyColors("Other");
    expect(other.background).toBe(getFrequencyColors("Whatever").background);
  });
});

describe("FrequencyBadge", () => {
  it("renders the raw frequency text unchanged", () => {
    render(<FrequencyBadge frequency="Semi-Annually" />);
    expect(screen.getByText("Semi-Annually")).toBeInTheDocument();
  });

  it("renders nothing when frequency is missing", () => {
    const { container } = render(<FrequencyBadge frequency={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
