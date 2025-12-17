// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { templateService } from "../services/templates.js";
import useAppStore from "../utils/store.js";

const DEFAULT_TEMPLATE = {
  name: "",
  description: "",
  sharing_mode: "private",
  tags: "",
  category_slug: "",
  payload: '{\n  "type": "pole_plan",\n  "fields": {}\n}',
};

const fieldInputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "0.95rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export default function TemplateManager() {
  const isEnabled = useAppStore((s) => s.isFeatureEnabled("templateSharing"));
  const currentUser = useAppStore((s) => s.currentUser);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createForm, setCreateForm] = useState(DEFAULT_TEMPLATE);
  const [creating, setCreating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateDetail, setTemplateDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [versionNotes, setVersionNotes] = useState("");
  const [versionPayload, setVersionPayload] = useState('{\n  "fields": {}\n}');
  const [publishingVersion, setPublishingVersion] = useState(false);

  const userOrg = currentUser?.organization_id;

  const canRender = useMemo(() => isEnabled && !!userOrg, [isEnabled, userOrg]);

  useEffect(() => {
    if (!canRender) return;

    let cancelled = false;
    const loadTemplates = async () => {
      setTemplatesLoading(true);
      setError(null);
      try {
        const data = await templateService.listTemplates();
        if (!cancelled) {
          setTemplates(data.templates || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load templates");
        }
      } finally {
        if (!cancelled) {
          setTemplatesLoading(false);
        }
      }
    };

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [canRender]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setTemplateDetail(null);
      return;
    }

    let cancelled = false;
    const fetchDetail = async () => {
      setDetailLoading(true);
      setError(null);
      try {
        const data = await templateService.getTemplate(selectedTemplateId);
        if (!cancelled) {
          setTemplateDetail(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load template detail");
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedTemplateId]);

  if (!canRender) {
    return null;
  }

  const handleCreate = async (evt) => {
    evt.preventDefault();
    setCreating(true);
    setError(null);

    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(createForm.payload || "{}");
      } catch (parseErr) {
        throw new Error(
          `Payload must be valid JSON${parseErr?.message ? `: ${parseErr.message}` : ""}`,
        );
      }

      const payload = {
        name: createForm.name.trim(),
        description: createForm.description?.trim() || null,
        sharing_mode: createForm.sharing_mode || "private",
        tags: (createForm.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        category_slug: createForm.category_slug?.trim() || undefined,
        payload: parsedPayload,
      };

      if (!payload.name) {
        throw new Error("Template name is required");
      }

      const data = await templateService.createTemplate(payload);
      setTemplates((existing) => [data.template, ...(existing || [])]);
      setCreateForm(DEFAULT_TEMPLATE);
      setSelectedTemplateId(data.template.id);
      setVersionPayload(JSON.stringify(data.version.payload, null, 2));
    } catch (err) {
      setError(err.message || "Failed to create template");
    } finally {
      setCreating(false);
    }
  };

  const handlePublishVersion = async (evt) => {
    evt.preventDefault();
    if (!selectedTemplateId) return;

    setPublishingVersion(true);
    setError(null);

    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(versionPayload || "{}");
      } catch (parseErr) {
        throw new Error(
          `Version payload must be valid JSON${parseErr?.message ? `: ${parseErr.message}` : ""}`,
        );
      }

      const data = await templateService.createVersion(selectedTemplateId, {
        payload: parsedPayload,
        notes: versionNotes?.trim() || undefined,
      });

      setVersionNotes("");
      setVersionPayload(JSON.stringify(parsedPayload, null, 2));
      setTemplateDetail((detail) => {
        if (!detail) return detail;
        return {
          ...detail,
          versions: [data.version, ...(detail.versions || [])],
          template: {
            ...(detail.template || {}),
            latest_version: data.version.version,
          },
        };
      });
      setTemplates((existing) => {
        if (!existing) return existing;
        return existing.map((tpl) =>
          tpl.id === selectedTemplateId
            ? {
                ...tpl,
                latest_version: data.version.version,
                updated_at: new Date().toISOString(),
              }
            : tpl,
        );
      });
    } catch (err) {
      setError(err.message || "Failed to publish new version");
    } finally {
      setPublishingVersion(false);
    }
  };

  return (
    <section
      style={{
        background: "#fff",
        color: "#111",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
      }}
    >
      <header style={{ marginBottom: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "1.6rem" }}>
          Template Library (Phase 3 Preview)
        </h2>
        <p style={{ margin: "6px 0 0", color: "#444" }}>
          Share repeatable pole-plan configurations across your organization.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          style={{
            background: "#fdecea",
            color: "#611a15",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "24px",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        <article
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Create Template</h3>
          <form onSubmit={handleCreate}>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginBottom: "12px",
                fontSize: "0.9rem",
                color: "#1f2937",
              }}
            >
              <span>Name</span>
              <input
                type="text"
                value={createForm.name}
                onChange={(evt) =>
                  setCreateForm((form) => ({ ...form, name: evt.target.value }))
                }
                style={fieldInputStyle}
                required
              />
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginBottom: "12px",
                fontSize: "0.9rem",
                color: "#1f2937",
              }}
            >
              <span>Description</span>
              <textarea
                value={createForm.description}
                onChange={(evt) =>
                  setCreateForm((form) => ({
                    ...form,
                    description: evt.target.value,
                  }))
                }
                rows={2}
                style={{ ...fieldInputStyle, resize: "vertical" }}
              />
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginBottom: "12px",
                fontSize: "0.9rem",
                color: "#1f2937",
              }}
            >
              <span>Sharing</span>
              <select
                value={createForm.sharing_mode}
                onChange={(evt) =>
                  setCreateForm((form) => ({
                    ...form,
                    sharing_mode: evt.target.value,
                  }))
                }
                style={fieldInputStyle}
              >
                <option value="private">Private</option>
                <option value="organization">Organization</option>
                <option value="public">Public</option>
                <option value="link">Link-access</option>
              </select>
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginBottom: "12px",
                fontSize: "0.9rem",
                color: "#1f2937",
              }}
            >
              <span>Category Slug</span>
              <input
                type="text"
                value={createForm.category_slug}
                onChange={(evt) =>
                  setCreateForm((form) => ({
                    ...form,
                    category_slug: evt.target.value,
                  }))
                }
                placeholder="foundation-reuse"
                style={fieldInputStyle}
              />
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginBottom: "12px",
                fontSize: "0.9rem",
                color: "#1f2937",
              }}
            >
              <span>Tags (comma separated)</span>
              <input
                type="text"
                value={createForm.tags}
                onChange={(evt) =>
                  setCreateForm((form) => ({ ...form, tags: evt.target.value }))
                }
                placeholder="clearance,firstEnergy"
                style={fieldInputStyle}
              />
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginBottom: "12px",
                fontSize: "0.9rem",
                color: "#1f2937",
              }}
            >
              <span>Payload JSON</span>
              <textarea
                value={createForm.payload}
                onChange={(evt) =>
                  setCreateForm((form) => ({
                    ...form,
                    payload: evt.target.value,
                  }))
                }
                rows={8}
                style={{
                  ...fieldInputStyle,
                  fontFamily: "monospace",
                  resize: "vertical",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={creating}
              style={{
                marginTop: "8px",
                background: "#4F46E5",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "10px 16px",
                cursor: creating ? "wait" : "pointer",
              }}
            >
              {creating ? "Saving..." : "Create Template"}
            </button>
          </form>
        </article>

        <article
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "10px",
            padding: "16px",
            minHeight: "420px",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ margin: 0 }}>Templates</h3>
            {templatesLoading ? <span>Loading…</span> : null}
          </header>
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {templates?.length ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {templates.map((tpl) => (
                  <li
                    key={tpl.id}
                    style={{
                      border: "1px solid rgba(0,0,0,0.05)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      marginBottom: "10px",
                      background:
                        tpl.id === selectedTemplateId
                          ? "rgba(79,70,229,0.08)"
                          : "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <strong>{tpl.name}</strong>
                      <button
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#4F46E5",
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#555" }}>
                      v{tpl.latest_version || 0} • {tpl.sharing_mode}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#555" }}>
                No templates yet. Create your first organizational starting
                point.
              </p>
            )}
          </div>
        </article>

        {selectedTemplateId ? (
          <article
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <header style={{ marginBottom: "12px" }}>
              <h3 style={{ margin: 0 }}>Template Detail</h3>
              {detailLoading ? <span>Loading…</span> : null}
            </header>

            {templateDetail?.template ? (
              <div>
                <div style={{ marginBottom: "12px" }}>
                  <strong>{templateDetail.template.name}</strong>
                  <div style={{ color: "#555", fontSize: "0.9rem" }}>
                    Latest version: v
                    {templateDetail.template.latest_version || 1}
                  </div>
                </div>

                <section style={{ marginBottom: "16px" }}>
                  <h4 style={{ margin: "12px 0 8px" }}>Publish New Version</h4>
                  <form onSubmit={handlePublishVersion}>
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginBottom: "12px",
                        fontSize: "0.9rem",
                        color: "#1f2937",
                      }}
                    >
                      <span>Version Notes</span>
                      <input
                        type="text"
                        value={versionNotes}
                        onChange={(evt) => setVersionNotes(evt.target.value)}
                        placeholder="Describe what changed"
                        style={fieldInputStyle}
                      />
                    </label>

                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginBottom: "12px",
                        fontSize: "0.9rem",
                        color: "#1f2937",
                      }}
                    >
                      <span>Payload JSON</span>
                      <textarea
                        rows={8}
                        style={{
                          ...fieldInputStyle,
                          fontFamily: "monospace",
                          resize: "vertical",
                        }}
                        value={versionPayload}
                        onChange={(evt) => setVersionPayload(evt.target.value)}
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={publishingVersion}
                      style={{
                        background: "#059669",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "10px 16px",
                        cursor: publishingVersion ? "wait" : "pointer",
                      }}
                    >
                      {publishingVersion ? "Publishing…" : "Publish Version"}
                    </button>
                  </form>
                </section>

                <section>
                  <h4 style={{ margin: "12px 0 8px" }}>Version History</h4>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {templateDetail.versions?.length ? (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {templateDetail.versions.map((version) => (
                          <li
                            key={version.id}
                            style={{
                              border: "1px solid rgba(0,0,0,0.05)",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              marginBottom: "8px",
                              background: "#f9fafb",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>
                                v{version.version} •{" "}
                                {new Date(version.created_at).toLocaleString()}
                              </span>
                              {version.notes ? (
                                <em style={{ color: "#555" }}>
                                  {version.notes}
                                </em>
                              ) : null}
                            </div>
                            <pre
                              style={{
                                background: "#111827",
                                color: "#E5E7EB",
                                borderRadius: "6px",
                                padding: "8px",
                                marginTop: "8px",
                                fontSize: "0.75rem",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {JSON.stringify(version.payload, null, 2)}
                            </pre>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: "#555" }}>No versions recorded yet.</p>
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <p style={{ color: "#555" }}>
                Select a template to see details and publish new versions.
              </p>
            )}
          </article>
        ) : null}
      </div>
    </section>
  );
}
