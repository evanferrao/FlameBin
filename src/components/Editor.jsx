import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import "./Editor.css";

import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState("// start typing here");
  const [customId, setCustomId] = useState("");
  const [originalId, setOriginalId] = useState(null); // tracks current doc
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPaste = async () => {
      if (id) {
        const docRef = doc(db, "pastes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCode(docSnap.data().content);
          setCustomId(id);
          setOriginalId(id);
        } else {
          setMessage("❌ Paste not found.");
        }
      }
    };
    fetchPaste();
  }, [id]);

  const savePaste = async () => {
    if (!customId.trim()) {
      setMessage("❗ Please enter a custom ID.");
      return;
    }

    setLoading(true);
    setMessage("");

    const newRef = doc(db, "pastes", customId);
    const newData = {
      content: code,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(newRef, newData);

      // If renaming: delete old one
      if (originalId && originalId !== customId) {
        await deleteDoc(doc(db, "pastes", originalId));
        setMessage(`✅ Paste renamed to /${customId}`);
        navigate(`/${customId}`, { replace: true });
        setOriginalId(customId);
      } else {
        setMessage(`✅ Saved as /${customId}`);
        if (!id) navigate(`/${customId}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error saving paste.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editor-container">
      <CodeMirror
        value={code}
        height="400px"
        theme={oneDark}
        extensions={[javascript()]}
        onChange={(value) => setCode(value)}
      />

      <input
        type="text"
        placeholder="Custom link name (e.g., my-snippet)"
        value={customId}
        onChange={(e) => setCustomId(e.target.value)}
        style={{ marginTop: "10px", padding: "8px", width: "100%" }}
      />

      <button onClick={savePaste} disabled={loading} style={{ marginTop: "10px" }}>
        {loading ? "Saving..." : "💾 Save / Rename"}
      </button>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
};

export default Editor;
