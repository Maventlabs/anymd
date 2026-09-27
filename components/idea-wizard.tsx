"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  FileUp,
  Github,
  ImagePlus,
  Link2,
  Mic,
  MicOff,
  Plus,
  X,
} from "lucide-react";
import { useDraft } from "@/components/draft-provider";
import { useStageMotion } from "@/components/use-stage-motion";
import { validateIdea } from "@/lib/idea";

type ContextMode = "link" | "github" | null;
type SpeechAlternative = { transcript: string };
type SpeechResult = ArrayLike<SpeechAlternative> & { isFinal: boolean };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type SpeechErrorEvent = { error: string };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

type FileAttachment = {
  name: string;
  type: string;
  url: string;
  size: number;
  kind: "image" | "file";
  contextBlock: string;
};

export default function IdeaWizard() {
  const { draft, setDraft, submitIdea } = useDraft();
  const router = useRouter();
  const { stage, busy, leave } = useStageMotion("idea");
  const [error, setError] = useState<string | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMode, setContextMode] = useState<ContextMode>(null);
  const [contextValue, setContextValue] = useState("");
  const [contextMessage, setContextMessage] = useState("");
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [dictationMessage, setDictationMessage] = useState("");
  const draftRef = useRef(draft);
  const input = useRef<HTMLTextAreaElement>(null);
  const contextTrigger = useRef<HTMLButtonElement>(null);
  const contextPopover = useRef<HTMLDivElement>(null);
  const contextInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const count = Array.from(draft.idea.trim()).length;

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!contextMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !contextPopover.current?.contains(target) &&
        !contextTrigger.current?.contains(target)
      ) {
        setContextMenuOpen(false);
        setContextMode(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setContextMenuOpen(false);
      setContextMode(null);
      contextTrigger.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenuOpen]);

  useEffect(() => {
    if (contextMenuOpen && contextMode) contextInput.current?.focus();
  }, [contextMenuOpen, contextMode]);

  useEffect(
    () => () => {
      const activeRecognition = recognition.current;
      recognition.current = null;
      if (!activeRecognition) return;
      activeRecognition.onstart = null;
      activeRecognition.onresult = null;
      activeRecognition.onerror = null;
      activeRecognition.onend = null;
      activeRecognition.abort();
    },
    [],
  );

  useEffect(() => {
    if (!attachment?.url) return;
    return () => URL.revokeObjectURL(attachment.url);
  }, [attachment]);

  function resizeInput(element: HTMLTextAreaElement) {
    /* Two visible lines max; longer text scrolls inside the field with the
       scrollbar hidden, and the wizard keeps its size. */
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 68)}px`;
  }

  function setIdea(value: string) {
    const next = { ...draftRef.current, idea: value };
    draftRef.current = next;
    setDraft(next);
    if (error) setError(validateIdea(value));
  }

  function appendContext(label: string, value: string) {
    const current = draftRef.current;
    const block = value.trim() ? `${label}:\n${value.trim()}` : label;
    const idea = current.idea.trimEnd();
    const nextIdea = idea ? `${idea}\n\n${block}` : block;

    if (Array.from(nextIdea.trim()).length > 5000) {
      setContextMessage(
        "This context would exceed the 5,000-character idea limit. Shorten it and try again.",
      );
      return false;
    }

    const next = { ...current, idea: nextIdea, step: "idea" as const };
    draftRef.current = next;
    setDraft(next);
    setError(null);
    setContextMessage(`${label.replace(/:$/, "")} added to the idea.`);
    return true;
  }

  async function importTextFile(file?: File) {
    if (!file) return;
    setContextMessage("");
    try {
      const contents = await file.text();
      if (!contents.trim()) {
        setContextMessage("That file has no readable text to add.");
        return;
      }

      if (appendContext(`Reference file (${file.name})`, contents)) {
        /* The readable text joins the idea; the chip below only identifies
           the source file so the composer stays tidy. */
        importFileAttachment(file);
        setContextMenuOpen(false);
        setContextMode(null);
      }
    } catch {
      setContextMessage(
        "The file could not be read. Try a TXT, Markdown, JSON, CSV, or YAML file.",
      );
    }
  }

  function importImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setContextMessage("Choose an image file such as PNG, JPG, or WebP.");
      return;
    }

    /* The image rides along as a chip under the wizard; the idea text stays
       untouched so the composer never grows with long filenames. */
    const contextBlock = `Image reference (attached locally): ${file.name}`;
    setAttachment((previous) => {
      if (previous) URL.revokeObjectURL(previous.url);
      return {
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        size: file.size,
        kind: "image",
        contextBlock,
      };
    });
    setPreviewOpen(false);
    setContextMessage("Image reference added. The image itself stays on this device.");
    setContextMenuOpen(false);
    setContextMode(null);
  }

  function importFileAttachment(file?: File) {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      importImage(file);
      return;
    }

    const contextBlock = `File reference (attached locally): ${file.name}`;
    setAttachment((previous) => {
      if (previous) URL.revokeObjectURL(previous.url);
      return {
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        size: file.size,
        kind: "file",
        contextBlock,
      };
    });
    setPreviewOpen(false);
    setContextMessage("File attached. It stays on this device.");
    setContextMenuOpen(false);
    setContextMode(null);
  }

  function removeAttachment() {
    setPreviewOpen(false);
    setAttachment((previous) => {
      if (previous) URL.revokeObjectURL(previous.url);
      return null;
    });
  }

  function formatAttachmentSize(bytes: number) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${bytes} B`;
  }

  function addLinkContext() {
    const rawValue = contextValue.trim();
    const normalized = contextMode === "github" && !/^https?:\/\//i.test(rawValue)
      ? `https://github.com/${rawValue.replace(/^github\.com\//i, "").replace(/^\/+/, "")}`
      : rawValue;

    try {
      const url = new URL(normalized);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }
      if (contextMode === "github" && url.hostname.toLowerCase() !== "github.com") {
        setContextMessage("Enter a github.com repository URL or owner/repository.");
        return;
      }

      const label = contextMode === "github" ? "GitHub repository" : "Reference link";
      if (appendContext(label, url.toString())) {
        setContextValue("");
        setContextMode(null);
        setContextMenuOpen(false);
      }
    } catch {
      setContextMessage("Enter a valid http or https URL.");
    }
  }

  function insertTranscript(transcript: string) {
    const element = input.current;
    const current = draftRef.current;
    const start = element?.selectionStart ?? current.idea.length;
    const end = element?.selectionEnd ?? current.idea.length;
    const before = current.idea.slice(0, start);
    const after = current.idea.slice(end);
    const text = transcript.trim();
    const prefix = before && !/\s$/.test(before) ? " " : "";
    const suffix = after && !/^\s|^[,.;!?]/.test(after) ? " " : "";
    const inserted = `${prefix}${text}${suffix}`;
    const nextIdea = `${before}${inserted}${after}`;

    if (Array.from(nextIdea.trim()).length > 5000) {
      setDictationMessage("Dictation stopped at the 5,000-character limit.");
      recognition.current?.stop();
      return;
    }

    setIdea(nextIdea);
    requestAnimationFrame(() => {
      if (!element) return;
      const cursor = start + prefix.length + text.length;
      element.focus();
      element.setSelectionRange(cursor, cursor);
      resizeInput(element);
    });
  }

  function toggleDictation() {
    if (recognition.current) {
      recognition.current.stop();
      return;
    }

    const speechWindow = window as SpeechWindow;
    const SpeechRecognitionConstructor =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      setDictationMessage(
        "Dictation is not supported in this browser. You can still type your idea.",
      );
      return;
    }

    const instance = new SpeechRecognitionConstructor();
    recognition.current = instance;
    instance.continuous = true;
    instance.interimResults = false;
    instance.lang = navigator.language || "en-US";
    instance.onstart = () => {
      setIsDictating(true);
      setDictationMessage("Listening… speak clearly, then press the microphone to stop.");
    };
    instance.onresult = (event) => {
      const transcripts: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal && result[0]?.transcript) {
          transcripts.push(result[0].transcript);
        }
      }
      if (transcripts.length) insertTranscript(transcripts.join(" "));
    };
    instance.onerror = (event) => {
      const messages: Record<string, string> = {
        "not-allowed": "Microphone permission was denied. Allow microphone access or type your idea.",
        "service-not-allowed": "Speech recognition is blocked by this browser or device.",
        "audio-capture": "No microphone was found. Connect one or type your idea.",
        "no-speech": "No speech was detected. Try again when you are ready.",
        network: "Speech recognition is temporarily unavailable. You can keep typing.",
      };
      setDictationMessage(
        messages[event.error] ?? "Dictation stopped. You can keep typing your idea.",
      );
      setIsDictating(false);
      if (recognition.current === instance) recognition.current = null;
    };
    instance.onend = () => {
      setIsDictating(false);
      setDictationMessage((current) =>
        current.startsWith("Listening") ? "Dictation stopped." : current,
      );
      if (recognition.current === instance) recognition.current = null;
    };

    setDictationMessage("");
    try {
      instance.start();
    } catch {
      setIsDictating(false);
      setDictationMessage(
        "Could not start dictation. Check microphone permission and try again.",
      );
      recognition.current = null;
    }
  }

  return (
    <div
      ref={stage}
      className="wizard"
      id="idea"
      data-gsap-hero="composer"
      data-interactive
      aria-busy={busy}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (busy) return;
          const message = validateIdea(draft.idea);
          setError(message);
          if (message) input.current?.focus();
          else {
            leave(() => {
              submitIdea();
              router.push("/clarify");
            });
          }
        }}
      >
        <div className="composer-input">
          <div className="composer-context-anchor">
            <button
              ref={contextTrigger}
              className="composer-add"
              type="button"
              aria-label="Add context"
              aria-haspopup="dialog"
              aria-expanded={contextMenuOpen}
              aria-controls="composer-context-popover"
              disabled={busy}
              onClick={() => {
                setContextMessage("");
                setContextMode(null);
                setContextMenuOpen((current) => !current);
              }}
            >
              <Plus aria-hidden="true" />
            </button>
            {contextMenuOpen && (
              <div
                ref={contextPopover}
                className="composer-context-popover"
                id="composer-context-popover"
                role="dialog"
                aria-label="Add context to your idea"
                aria-modal="false"
              >
                <div className="composer-context-heading">
                  <strong>
                    {contextMode === "link"
                      ? "Paste a reference link"
                      : contextMode === "github"
                        ? "Import a GitHub repository"
                        : "Add context"}
                  </strong>
                  <button
                    type="button"
                    className="composer-context-close"
                    aria-label="Close context menu"
                    onClick={() => {
                      setContextMenuOpen(false);
                      setContextMode(null);
                      contextTrigger.current?.focus();
                    }}
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>

                {contextMode ? (
                  <div className="composer-source-form">
                    <label htmlFor="composer-source-url">
                      {contextMode === "github" ? "Repository URL" : "Reference URL"}
                    </label>
                    <input
                      ref={contextInput}
                      id="composer-source-url"
                      inputMode="url"
                      autoComplete="url"
                      placeholder={contextMode === "github" ? "owner/repository" : "https://…"}
                      value={contextValue}
                      onChange={(event) => {
                        setContextValue(event.target.value);
                        setContextMessage("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addLinkContext();
                        }
                      }}
                    />
                    <div className="composer-source-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setContextMode(null);
                          setContextValue("");
                          setContextMessage("");
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="composer-source-submit"
                        disabled={!contextValue.trim()}
                        onClick={addLinkContext}
                      >
                        Add source
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="composer-context-actions">
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      disabled={busy}
                    >
                      <FileUp aria-hidden="true" />
                      <span><strong>Upload file</strong></span>
                    </button>
                    <button
                      type="button"
                      onClick={() => imageInput.current?.click()}
                      disabled={busy}
                    >
                      <ImagePlus aria-hidden="true" />
                      <span><strong>Add image</strong></span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContextMode("link");
                        setContextValue("");
                        setContextMessage("");
                      }}
                    >
                      <Link2 aria-hidden="true" />
                      <span><strong>Paste link</strong></span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContextMode("github");
                        setContextValue("");
                        setContextMessage("");
                      }}
                    >
                      <Github aria-hidden="true" />
                      <span><strong>Import from GitHub</strong></span>
                    </button>
                  </div>
                )}

                {contextMessage && (
                  <p className="composer-context-message" role="status" aria-live="polite">
                    {contextMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          <label htmlFor="product-idea" className="sr-only">
            Describe your product idea
          </label>
          <textarea
            ref={input}
            disabled={busy}
            id="product-idea"
            rows={1}
            value={draft.idea}
            onChange={(event) => setIdea(event.target.value)}
            onInput={(event) => resizeInput(event.currentTarget)}
            placeholder="What product would you like to build?"
            aria-invalid={!!error}
            aria-describedby={`idea-help${error ? " idea-error" : ""}${dictationMessage ? " dictation-status" : ""}`}
          />
          <button
            className={`composer-voice-button${isDictating ? " is-listening" : ""}`}
            type="button"
            aria-label={isDictating ? "Stop dictation" : "Start dictation"}
            aria-pressed={isDictating}
            title={isDictating ? "Stop dictation" : "Dictate idea"}
            disabled={busy}
            onClick={toggleDictation}
          >
            {isDictating ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
          </button>
          <button
            className="send-button"
            type="submit"
            disabled={busy}
            aria-label="Continue to clarification"
          >
            <ArrowUp aria-hidden="true" />
          </button>
          <input
            ref={fileInput}
            className="composer-file-input"
            type="file"
            accept=".txt,.md,.mdx,.markdown,.json,.csv,.yaml,.yml,.xml,text/*,application/json,text/csv"
            aria-label="Choose a text reference file"
            tabIndex={-1}
            onChange={(event) => {
              void importTextFile(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={imageInput}
            className="composer-file-input"
            type="file"
            accept="image/*"
            aria-label="Choose an image reference"
            tabIndex={-1}
            onChange={(event) => {
              importImage(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </div>
        <div className="composer-meta">
          <span id="idea-help" className="sr-only">
            Enter 20 to 5,000 characters, including the problem and first users.
          </span>
          <span className="composer-language">Start with what you know</span>
          <span className="composer-count" aria-live="polite">
            {count.toLocaleString("en-US")} / 5,000
          </span>
        </div>
        {error && (
          <p id="idea-error" role="alert" className="error">
            {error}
          </p>
        )}
        {attachment && (
          <div className="composer-attachment" role="status">
            {attachment.kind === "image" ? (
              <button
                type="button"
                className="composer-attachment-media"
                title="Preview image"
                onClick={() => setPreviewOpen(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={attachment.url} alt="" />
              </button>
            ) : (
              <div
                className="composer-attachment-media is-file"
                title={attachment.type || "Unknown format"}
              >
                <FileUp aria-hidden="true" />
              </div>
            )}
            <span className="composer-attachment-text">
              <strong>{attachment.name}</strong>
              <small>
                {attachment.kind === "image"
                  ? "Tap the thumbnail to preview. Pixels stay local."
                  : `${attachment.type || "Unknown format"} · ${formatAttachmentSize(attachment.size)}`}
              </small>
            </span>
            <button
              type="button"
              className="composer-attachment-remove"
              aria-label={`Remove ${attachment.name}`}
              onClick={removeAttachment}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        )}
        {previewOpen && attachment?.kind === "image" && (
          <div
            className="composer-attachment-preview"
            role="dialog"
            aria-label={`Preview of ${attachment.name}`}
            onClick={() => setPreviewOpen(false)}
          >
            <button
              type="button"
              className="composer-attachment-preview-close"
              aria-label="Close preview"
              onClick={() => setPreviewOpen(false)}
            >
              <X aria-hidden="true" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={attachment.url} alt={attachment.name} />
          </div>
        )}
        {dictationMessage && (
          <p
            className={`composer-dictation-status${isDictating ? " is-listening" : ""}`}
            id="dictation-status"
            role="status"
            aria-live="polite"
          >
            {dictationMessage}
          </p>
        )}
      </form>
    </div>
  );
}
