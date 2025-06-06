import React, { useState, useEffect } from "react";
import {
  BADGE_CONDITIONS_META,
  BadgeConditionMeta,
} from "../data/badgeConditions";
import { firestoreDb } from "../firebase/indexFirebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const BADGES_META_DOC = doc(firestoreDb, "admin", "badges_meta");

const AdminBadgeEditor: React.FC = () => {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<BadgeConditionMeta>>({});
  const [badges, setBadges] = useState<BadgeConditionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load badge meta from Firestore on mount
  useEffect(() => {
    setLoading(true);
    getDoc(BADGES_META_DOC)
      .then((snap) => {
        if (snap.exists()) {
          setBadges(snap.data().badges || []);
        } else {
          setBadges([...BADGE_CONDITIONS_META]);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError("Failed to load badge metadata: " + e.message);
        setLoading(false);
      });
  }, []);

  const startEdit = (key: string) => {
    const badge = badges.find((b) => b.key === key);
    setEditing(key);
    setDraft({ ...badge });
  };

  const saveEdit = async () => {
    setSaving(true);
    const updated = badges.map((b) =>
      b.key === editing ? { ...b, ...draft } : b,
    );
    setBadges(updated);
    setEditing(null);
    setDraft({});
    try {
      await setDoc(BADGES_META_DOC, { badges: updated }, { merge: true });
    } catch (e) {
      setError(
        "Failed to save badge metadata: " +
          (e instanceof Error ? e.message : String(e)),
      );
    }
    setSaving(false);
  };

  if (loading) return <div>Loading badge metadata...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin Badge Editor</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Key</th>
            <th>Label</th>
            <th>Description</th>
            <th>Category</th>
            <th>Threshold</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {badges.map((badge) => (
            <tr
              key={badge.key}
              style={{
                background: editing === badge.key ? "#ffe0b2" : undefined,
              }}
            >
              <td>{badge.key}</td>
              <td>
                {editing === badge.key ? (
                  <input
                    value={draft.label || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, label: e.target.value }))
                    }
                  />
                ) : (
                  badge.label
                )}
              </td>
              <td>
                {editing === badge.key ? (
                  <input
                    value={draft.description || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, description: e.target.value }))
                    }
                  />
                ) : (
                  badge.description
                )}
              </td>
              <td>
                {editing === badge.key ? (
                  <input
                    value={draft.category || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, category: e.target.value }))
                    }
                  />
                ) : (
                  badge.category
                )}
              </td>
              <td>
                {editing === badge.key ? (
                  <input
                    type="number"
                    value={draft.threshold ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        threshold: Number(e.target.value),
                      }))
                    }
                  />
                ) : (
                  badge.threshold
                )}
              </td>
              <td>
                {editing === badge.key ? (
                  <>
                    <button onClick={saveEdit} disabled={saving}>
                      Save
                    </button>
                    <button onClick={() => setEditing(null)} disabled={saving}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => startEdit(badge.key)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16, color: "#888" }}>
        <em>Note: Changes are saved to Firestore in real time.</em>
      </div>
    </div>
  );
};

export default AdminBadgeEditor;
