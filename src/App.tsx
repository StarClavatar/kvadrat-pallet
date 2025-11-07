import { useState, useEffect } from "react";
import "./App.css";
import EntryPage from "./pages/EntryPage/EntryPage";
import UpdatePrompt from "./components/UpdatePrompt/UpdatePrompt";

function App() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => void) | null>(null);

  useEffect(() => {
    const handleSWUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<() => void>;
      setShowUpdatePrompt(true);
      setUpdateSW(() => customEvent.detail);
    };

    document.addEventListener('swUpdate', handleSWUpdate);

    return () => {
      document.removeEventListener('swUpdate', handleSWUpdate);
    };
  }, []);

  const handleUpdate = () => {
    if (updateSW) {
      updateSW();
    }
  };

  const handleClose = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <>
      <EntryPage />
      {showUpdatePrompt && <UpdatePrompt onUpdate={handleUpdate} onClose={handleClose} />}
    </>
  );
}

export default App;
