"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Download,
  RefreshCw,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { useDraft } from "@/components/draft-provider";
import { completedQuestions, visibleQuestions } from "@/lib/clarification";
import { validateIdea } from "@/lib/idea";
import { parseGeneratedBundle } from "@/lib/generated-documents";
import type {
  GeneratedBundle,
  GeneratedDocument,
} from "@/lib/generated-documents";

async function fetchDocuments(body: string, signal?: AbortSignal) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    signal,
  });
  const value: unknown = await response.json();
  if (!response.ok) {
    const code =
      value && typeof value === "object" && "error" in value
        ? (value as { error?: { code?: unknown } }).error?.code
        : undefined;
    throw new Error(code === "UNKNOWN_SKILL" ? "UNKNOWN_SKILL" : "FAILED");
  }
  const bundle = parseGeneratedBundle(value);
  if (!bundle) throw new Error("FAILED");
  return bundle;
}

async function fetchRebuiltDocuments(body: string, signal: AbortSignal) {
  const response = await fetch("/api/generate/rebuild", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    signal,
  });
  const value: unknown = await response.json();
  if (!response.ok) throw new Error("FAILED");
  const bundle = parseGeneratedBundle(value);
  if (!bundle) throw new Error("FAILED");
  return bundle;
}

export default function DocumentGenerator() {
  const { draft, clarification } = useDraft();
  const questions = visibleQuestions(clarification.answers);
  const validDraft =
    draft.step === "clarification" &&
    !validateIdea(draft.idea) &&
    clarification.current === "review" &&
    completedQuestions(clarification) === questions.length;
  const [includeBridge, setIncludeBridge] = useState(false);
  const [bundle, setBundle] = useState<GeneratedBundle | null>(null);
  const [activeFilename, setActiveFilename] =
    useState<GeneratedDocument["filename"]>("prd.md");
  const [error, setError] = useState<"FAILED" | "UNKNOWN_SKILL" | null>(null);
  const [loading, setLoading] = useState(validDraft);
  const [retry, setRetry] = useState(0);
  const [rebuilding, setRebuilding] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [previewMode, setPreviewMode] = useState<"sections" | "raw">(
    "sections",
  );
  const rebuildController = useRef<AbortController | null>(null);
  const requestBody = JSON.stringify({
    idea: draft.idea,
    stack: draft.stack,
    answers: clarification.answers,
    selectedSkillIds: draft.selectedSkillIds,
    includeClaudeBridge: includeBridge,
  });

  useEffect(() => {
    if (!validDraft) return;
    const controller = new AbortController();
    fetchDocuments(requestBody, controller.signal)
      .then((result) => {
        setBundle(result);
        setError(null);
        setLoading(false);
        setActiveFilename((current) =>
          result.documents.some(({ filename }) => filename === current)
            ? current
            : "prd.md",
        );
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(
          reason instanceof Error && reason.message === "UNKNOWN_SKILL"
            ? "UNKNOWN_SKILL"
            : "FAILED",
        );
        setLoading(false);
      });
    return () => controller.abort();
  }, [requestBody, retry, validDraft]);

  useEffect(
    () => () => {
      rebuildController.current?.abort();
    },
    [],
  );

  if (!validDraft)
    return (
      <div className="generate-shell shell">
        <header className="nav">
          <Link href="/" className="wordmark" aria-label="AnyMD home">
            <BrandLogo className="wordmark-image" />
          </Link>
        </header>
        <main className="generate-empty">
          <span className="quiet">04 / Documents</span>
          <h1>Complete your brief first.</h1>
          <p>
            Generated documents depend on a completed clarification and skill
            selection in this tab. Refreshing clears that memory-only draft.
          </p>
          <Link href="/" className="pill">
            Start with an idea <ArrowRight aria-hidden="true" />
          </Link>
        </main>
      </div>
    );

  const activeDocument = bundle?.documents.find(
    ({ filename }) => filename === activeFilename,
  );

  async function rebuildSection(sectionId: string, sectionTitle: string) {
    if (
      loading ||
      rebuilding ||
      !bundle ||
      !activeDocument ||
      activeDocument.filename === "CLAUDE.md"
    )
      return;
    const key = `${activeDocument.filename}:${sectionId}`;
    const controller = new AbortController();
    rebuildController.current = controller;
    setRebuilding(key);
    setStatus(`Rebuilding ${sectionTitle}...`);
    try {
      const rebuilt = await fetchRebuiltDocuments(
        JSON.stringify({
          input: JSON.parse(requestBody),
          bundle,
          filename: activeDocument.filename,
          sectionId,
        }),
        controller.signal,
      );
      setBundle(rebuilt);
      setStatus(`Rebuilt ${sectionTitle}.`);
    } catch (reason: unknown) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setStatus(`Could not rebuild ${sectionTitle}. Try again.`);
    } finally {
      if (rebuildController.current === controller) {
        rebuildController.current = null;
        setRebuilding(null);
      }
    }
  }

  async function copyMarkdown(markdown: string, label: string) {
    try {
      await navigator.clipboard.writeText(markdown);
      setStatus(`Copied ${label}.`);
    } catch {
      setStatus(`Could not copy ${label}.`);
    }
  }

  function copyActiveDocument() {
    if (!activeDocument) return;
    return copyMarkdown(activeDocument.markdown, activeDocument.filename);
  }

  function downloadActiveDocument() {
    if (!activeDocument) return;
    const url = URL.createObjectURL(
      new Blob([activeDocument.markdown], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = activeDocument.filename;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${activeDocument.filename}.`);
  }

  return (
    <div className="generate-shell shell">
      <a href="#generated-main" className="skip-link">
        Skip to generated documents
      </a>
      <header className="nav">
        <Link href="/" className="wordmark" aria-label="AnyMD home">
          <BrandLogo className="wordmark-image" />
        </Link>
        <span className="quiet">Structured before sophisticated.</span>
      </header>
      <main id="generated-main" className="generate-main" aria-busy={loading}>
        <div className="generate-heading">
          <div>
            <span className="quiet">04 / Document generator</span>
            <h1>Your product brief, assembled.</h1>
          </div>
          <p>
            Structured from this tab, then refined by the configured AI provider
            without changing the AnyMD output contract.
          </p>
        </div>

        {loading && !bundle ? (
          <p className="generate-notice" role="status">
            Assembling the PRD structure, agent instructions, and diagrams...
          </p>
        ) : null}

        {error ? (
          <section className="generate-error" role="alert">
            <h2>
              {error === "UNKNOWN_SKILL"
                ? "A selected skill changed."
                : "The documents could not be assembled."}
            </h2>
            <p>
              {error === "UNKNOWN_SKILL"
                ? "Return to the catalog and confirm the skills that are still available."
                : "Your draft is still safe in this tab. Retry document generation."}
            </p>
            <div className="generate-error-actions">
              <Link href="/skills" className="pill">
                <ArrowLeft aria-hidden="true" /> Back to skills
              </Link>
              {error === "FAILED" ? (
                <button
                  className="pill"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    setRetry((value) => value + 1);
                  }}
                >
                  <RefreshCw aria-hidden="true" /> Retry
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {bundle && activeDocument ? (
          <>
            <aside className="generate-notice">
              Review structured sections or switch to the exact Markdown before
              copying or downloading the active document.
            </aside>
            <div className="document-toolbar">
              <nav className="document-nav" aria-label="Generated documents">
                {bundle.documents.map(({ filename }) => (
                  <button
                    key={filename}
                    type="button"
                    aria-pressed={activeFilename === filename}
                    onClick={() => {
                      setActiveFilename(filename);
                      setStatus("");
                    }}
                  >
                    {filename}
                  </button>
                ))}
              </nav>
              <div className="document-actions">
                <div className="document-nav" aria-label="Preview mode">
                  <button
                    type="button"
                    aria-pressed={previewMode === "sections"}
                    onClick={() => setPreviewMode("sections")}
                  >
                    Sections
                  </button>
                  <button
                    type="button"
                    aria-pressed={previewMode === "raw"}
                    onClick={() => setPreviewMode("raw")}
                  >
                    Raw Markdown
                  </button>
                </div>
                <button
                  type="button"
                  className="pill"
                  onClick={copyActiveDocument}
                  aria-label={`Copy ${activeDocument.filename}`}
                >
                  <Copy aria-hidden="true" /> Copy
                </button>
                <button
                  type="button"
                  className="pill"
                  onClick={downloadActiveDocument}
                  aria-label={`Download ${activeDocument.filename}`}
                >
                  <Download aria-hidden="true" /> Download
                </button>
              </div>
              <label className="bridge-toggle">
                <input
                  type="checkbox"
                  checked={includeBridge}
                  disabled={!!rebuilding}
                  onChange={(event) => {
                    setLoading(true);
                    setIncludeBridge(event.target.checked);
                  }}
                />
                <span>Include Claude Code bridge</span>
              </label>
            </div>

            <div className="document-layout">
              <aside className="document-summary">
                <span className="quiet">Active document</span>
                <strong>{activeDocument.filename}</strong>
                <p>{activeDocument.sections.length} structured sections</p>
                <Link href="/skills" className="text-link">
                  <ArrowLeft aria-hidden="true" /> Edit skills
                </Link>
              </aside>
              <div className="document-sections">
                {previewMode === "raw" ? (
                  <article
                    className="document-section"
                    aria-labelledby="raw-markdown-title"
                  >
                    <div className="document-section-header">
                      <div>
                        <span className="quiet">Exact file output</span>
                        <h2 id="raw-markdown-title">Raw Markdown</h2>
                      </div>
                    </div>
                    <pre className="document-markdown document-raw">
                      {activeDocument.markdown}
                    </pre>
                  </article>
                ) : activeDocument.sections.map((item) => {
                  const key = `${activeDocument.filename}:${item.id}`;
                  return (
                    <article
                      className="document-section"
                      key={item.id}
                      aria-labelledby={`section-${activeDocument.filename}-${item.id}`}
                    >
                      <div className="document-section-header">
                        <div>
                          <span className="quiet">{item.id}</span>
                          <h2 id={`section-${activeDocument.filename}-${item.id}`}>
                            {item.title}
                          </h2>
                        </div>
                        <div className="document-section-actions">
                          {item.id === "initialization-prompt" ? (
                            <button
                              type="button"
                              className="text-link"
                              onClick={() =>
                                copyMarkdown(item.markdown, "initialization prompt")
                              }
                              aria-label="Copy initialization prompt"
                            >
                              <Copy aria-hidden="true" /> Copy prompt
                            </button>
                          ) : null}
                          {activeDocument.filename !== "CLAUDE.md" ? (
                            <button
                              type="button"
                              className="text-link"
                              disabled={loading || !!rebuilding}
                              onClick={() => rebuildSection(item.id, item.title)}
                              aria-label={`Rebuild ${item.title}`}
                            >
                              <RefreshCw aria-hidden="true" />
                              {rebuilding === key
                                ? "Rebuilding"
                                : "Rebuild section"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <pre className="document-markdown">{item.markdown}</pre>
                    </article>
                  );
                })}
              </div>
            </div>
            <p className="generate-status" role="status" aria-live="polite">
              {status}
            </p>
          </>
        ) : null}
      </main>
      <p className="clarify-privacy">
        Your brief is sent to the AnyMD server and its configured AI provider.
        AnyMD does not persist the draft or generated files.
      </p>
    </div>
  );
}
