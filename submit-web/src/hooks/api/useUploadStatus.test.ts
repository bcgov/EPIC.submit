import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUploadStatus } from "./useUploadStatus";

vi.mock("@/utils/config", () => ({
  AppConfig: { apiUrl: "http://api.test/api" },
}));

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  emit(payload: unknown) {
    this.onmessage?.({
      data: typeof payload === "string" ? payload : JSON.stringify(payload),
    });
  }
}

describe("useUploadStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
    vi.stubGlobal("EventSource", MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns null state and opens no connection without an upload id", () => {
    const { result } = renderHook(() => useUploadStatus(null));

    expect(result.current).toEqual({
      status: null,
      metadata: null,
      error: null,
    });
    expect(MockEventSource.instances).toHaveLength(0);
  });

  it("opens an EventSource at the status url", () => {
    renderHook(() => useUploadStatus(5));

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe(
      "http://api.test/api/geo/uploads/5/status",
    );
  });

  it("updates status for intermediate events without closing", () => {
    const { result } = renderHook(() => useUploadStatus(5));
    const es = MockEventSource.instances[0];

    act(() => es.emit({ status: "processing", upload_id: 5 }));

    expect(result.current.status).toBe("processing");
    expect(result.current.metadata).toBeNull();
    expect(result.current.error).toBeNull();
    expect(es.close).not.toHaveBeenCalled();
  });

  it("sets metadata, calls onReady and closes when ready", () => {
    const onReady = vi.fn();
    const { result } = renderHook(() => useUploadStatus(5, { onReady }));
    const es = MockEventSource.instances[0];

    act(() =>
      es.emit({
        status: "ready",
        upload_id: 5,
        feature_count: 3,
        geometry_type: "Polygon",
        crs_original: "EPSG:3005",
        bbox: [1, 2, 3, 4],
      }),
    );

    const meta = {
      feature_count: 3,
      geometry_type: "Polygon",
      crs_original: "EPSG:3005",
      bbox: [1, 2, 3, 4],
    };
    expect(result.current.status).toBe("ready");
    expect(result.current.metadata).toEqual(meta);
    expect(onReady).toHaveBeenCalledWith(5, meta);
    expect(es.close).toHaveBeenCalled();
  });

  it("handles ready without an onReady callback", () => {
    const { result } = renderHook(() => useUploadStatus(5));
    const es = MockEventSource.instances[0];

    act(() =>
      es.emit({
        status: "ready",
        upload_id: 5,
        feature_count: 1,
        geometry_type: "Point",
        crs_original: "EPSG:4326",
        bbox: [0, 0, 0, 0],
      }),
    );

    expect(result.current.status).toBe("ready");
  });

  it("sets the error message and calls onFailed when failed", () => {
    const onFailed = vi.fn();
    const { result } = renderHook(() => useUploadStatus(5, { onFailed }));
    const es = MockEventSource.instances[0];

    act(() => es.emit({ status: "failed", upload_id: 5, error: "bad file" }));

    expect(result.current.status).toBe("failed");
    expect(result.current.error).toBe("bad file");
    expect(onFailed).toHaveBeenCalledWith("bad file");
    expect(es.close).toHaveBeenCalled();
  });

  it("uses a default message for validation_failed without error text", () => {
    const onFailed = vi.fn();
    const { result } = renderHook(() => useUploadStatus(5, { onFailed }));
    const es = MockEventSource.instances[0];

    act(() => es.emit({ status: "validation_failed", upload_id: 5 }));

    expect(result.current.error).toBe("Processing failed");
    expect(onFailed).toHaveBeenCalledWith("Processing failed");
    expect(es.close).toHaveBeenCalled();
  });

  it("handles failure without an onFailed callback", () => {
    const { result } = renderHook(() => useUploadStatus(5));
    const es = MockEventSource.instances[0];

    act(() => es.emit({ status: "failed", upload_id: 5 }));

    expect(result.current.error).toBe("Processing failed");
  });

  it("logs and ignores malformed event data", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useUploadStatus(5));
    const es = MockEventSource.instances[0];

    act(() => es.emit("not-json{"));

    expect(errorSpy).toHaveBeenCalled();
    expect(result.current.status).toBeNull();
  });

  it("reports a lost connection on error", () => {
    const onFailed = vi.fn();
    const { result } = renderHook(() => useUploadStatus(5, { onFailed }));
    const es = MockEventSource.instances[0];

    act(() => es.onerror?.());

    expect(result.current.status).toBe("failed");
    expect(result.current.error).toBe("Lost connection");
    expect(onFailed).toHaveBeenCalledWith("Lost connection");
    expect(es.close).toHaveBeenCalled();
  });

  it("handles connection error without an onFailed callback", () => {
    const { result } = renderHook(() => useUploadStatus(5));
    const es = MockEventSource.instances[0];

    act(() => es.onerror?.());

    expect(result.current.error).toBe("Lost connection");
  });

  it("closes the connection on unmount", () => {
    const { unmount } = renderHook(() => useUploadStatus(5));
    const es = MockEventSource.instances[0];

    unmount();

    expect(es.close).toHaveBeenCalled();
  });

  it("closes the previous connection and reopens when the upload id changes", () => {
    const { rerender } = renderHook(({ id }) => useUploadStatus(id), {
      initialProps: { id: 5 as number | null },
    });
    const first = MockEventSource.instances[0];

    rerender({ id: 6 });

    expect(first.close).toHaveBeenCalled();
    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1].url).toContain("/uploads/6/status");
  });

  it("resets state when the upload id becomes null", () => {
    const { result, rerender } = renderHook(({ id }) => useUploadStatus(id), {
      initialProps: { id: 5 as number | null },
    });

    act(() => MockEventSource.instances[0].emit({ status: "processing", upload_id: 5 }));
    expect(result.current.status).toBe("processing");

    rerender({ id: null });

    expect(result.current.status).toBeNull();
    expect(result.current.metadata).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("closes an existing connection when callbacks change identity", () => {
    const { rerender } = renderHook(
      ({ cb }) => useUploadStatus(5, { onReady: cb }),
      { initialProps: { cb: vi.fn() } },
    );
    const first = MockEventSource.instances[0];

    rerender({ cb: vi.fn() });

    expect(first.close).toHaveBeenCalled();
    expect(MockEventSource.instances).toHaveLength(2);
  });
});
