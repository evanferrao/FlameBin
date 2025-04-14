import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import "./Editor.css";
import { db } from "../firebase";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState("// start typing here");
  const [customId, setCustomId] = useState("");
  const [originalId, setOriginalId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  useEffect(() => {
    const fetchPaste = async () => {
      if (id) {
        const docRef = doc(db, "pastes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCode(docSnap.data().content);
          setCustomId(id);
          setOriginalId(id);
          // Save the password for later verification but don't show it
          if (docSnap.data().password) {
            setSavedPassword(docSnap.data().password);
          }
        } else {
          setMessage("Paste not found.");
        }
      }
    };
    fetchPaste();
  }, [id]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const savePaste = async () => {
    if (!customId.trim()) {
      setMessage("Please enter a custom ID.");
      return;
    }

    setLoading(true);
    setMessage("");
    
    // Use provided password or generate a random one
    const pastePassword = password.trim() || generateRandomPassword();
    
    const newRef = doc(db, "pastes", customId);
    const newData = {
      content: code,
      updatedAt: serverTimestamp(),
      password: pastePassword
    };

    try {
      await setDoc(newRef, newData);
      
      setMessage(`Saved as /${customId} with password: ${pastePassword}`);
      
      if (!id) {
        navigate(`/${customId}`);
        setOriginalId(customId);
        setSavedPassword(pastePassword);
      }
    } catch (err) {
      console.error(err);
      setMessage("Error saving paste.");
    } finally {
      setLoading(false);
    }
  };
  
  const renamePaste = async () => {
    if (!customId.trim() || !originalId || customId === originalId) {
      setMessage(customId === originalId 
        ? "Please use a different name to rename" 
        : "Please enter a valid name");
      return;
    }

    if (passwordInput !== savedPassword) {
      setMessage("Incorrect password. Please try again.");
      return;
    }

    setLoading(true);
    setMessage("");

    const newRef = doc(db, "pastes", customId);
    const newData = {
      content: code,
      updatedAt: serverTimestamp(),
      password: savedPassword
    };

    try {
      await setDoc(newRef, newData);
      await deleteDoc(doc(db, "pastes", originalId));
      setMessage(`Paste renamed to /${customId}`);
      navigate(`/${customId}`, { replace: true });
      setOriginalId(customId);
    } catch (err) {
      console.error(err);
      setMessage("Error renaming paste.");
    } finally {
      setLoading(false);
    }
  };

  const updateWithPassword = async () => {
    if (passwordInput !== savedPassword) {
      setMessage("Incorrect password. Please try again.");
      return;
    }

    setLoading(true);
    setMessage("");

    const docRef = doc(db, "pastes", originalId);
    const updateData = {
      content: code,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(docRef, updateData, { merge: true });
      setMessage("Paste updated successfully.");
    } catch (err) {
      console.error(err);
      setMessage("Error updating paste.");
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

      <div className="input-row">
        <input
          type="text"
          placeholder="Custom link name (e.g., my-snippet)"
          value={customId}
          onChange={(e) => setCustomId(e.target.value)}
          className="custom-id-input" 
        />
        
        {!originalId && (
          <div className="password-wrapper"> 
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (optional)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input" 
            />
            <button 
              onClick={() => setShowPassword(!showPassword)}
              className="show-hide-button" 
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        )}

        {originalId && (
          <div className="password-wrapper"> 
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter paste password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="password-input"
            />
            <button 
              onClick={() => setShowPassword(!showPassword)}
              className="show-hide-button" 
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        )}
      </div>

      <div className="button-row"> 
        {!originalId ? (
          <button 
            onClick={savePaste} 
            disabled={loading || !customId.trim()}
            className="action-button" 
          >
            {loading ? "Saving..." : "Save New Paste"}
          </button>
        ) : (
          <>
            <button 
              onClick={updateWithPassword} 
              disabled={loading || !passwordInput}
              className="action-button" 
            >
              {loading ? "Updating..." : "Update Paste"}
            </button>
            
            <button 
              onClick={renamePaste} 
              disabled={loading || customId === originalId || !passwordInput}
              className="action-button" 
            >
              {loading ? "Renaming..." : "Rename Paste"}
            </button>
          </>
        )}
      </div>

      {message && <p className="message-text">{message}</p>} 
    </div>
  );
};

export default Editor;