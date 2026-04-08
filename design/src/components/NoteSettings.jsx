import { memo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  List,
  Copy,
  Trash2,
  Save,
  CheckCircle,
  Plus,
  ChevronLeft,
} from "lucide-react";

export const NoteSettings = memo(({ isVisible }) => {
  // --- Multi-Note State ---
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("zenith-notes-v2");
    if (saved) return JSON.parse(saved);

    const legacy = localStorage.getItem("zenith-notes");
    if (legacy && legacy.trim() !== "") {
      const initialNotes = [
        {
          id: Date.now(),
          title: "Legacy Note",
          content: legacy,
          updatedAt: Date.now(),
          isManualTitle: false,
        },
      ];
      localStorage.setItem("zenith-notes-v2", JSON.stringify(initialNotes));
      localStorage.removeItem("zenith-notes");
      return initialNotes;
    }

    return [];
  });

  const [currentView, setCurrentView] = useState(() => localStorage.getItem("zenith-notes-view") || "list");
  const [activeNoteId, setActiveNoteId] = useState(() => {
    const saved = localStorage.getItem("zenith-notes-active-id");
    return saved ? parseInt(saved) : null;
  });

  // Sync session state
  useEffect(() => {
    localStorage.setItem("zenith-notes-view", currentView);
    if (activeNoteId) localStorage.setItem("zenith-notes-active-id", activeNoteId.toString());
    else localStorage.removeItem("zenith-notes-active-id");
  }, [currentView, activeNoteId]);

  const [copied, setCopied] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("zenith-notes-v2", JSON.stringify(notes));
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  // --- Actions ---
  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: "New Note",
      content: "",
      updatedAt: Date.now(),
      isManualTitle: false,
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setCurrentView("editor");
  };

  const deleteNote = (id, e) => {
    if (e) e.stopPropagation();
    if (confirm("Delete this note?")) {
      setNotes(notes.filter((n) => n.id !== id));
      if (activeNoteId === id) {
        setCurrentView("list");
        setActiveNoteId(null);
      }
    }
  };

  const openNote = (id) => {
    setActiveNoteId(id);
    setCurrentView("editor");
  };

  const handleEditorInput = () => {
    if (!editorRef.current || !activeNoteId) return;

    const newContent = editorRef.current.innerHTML;
    const plainText = editorRef.current.innerText || "";

    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === activeNoteId) {
          // Only auto-generate title if not manually set by user
          let newTitle = n.title;
          if (!n.isManualTitle) {
            const firstLine = plainText.trim().split("\n")[0].substring(0, 30);
            newTitle = firstLine || "Untitled Note";
          }
          return {
            ...n,
            content: newContent,
            title: newTitle,
            updatedAt: Date.now(),
          };
        }
        return n;
      }),
    );
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNoteId
          ? {
              ...n,
              title: newTitle,
              isManualTitle: true,
              updatedAt: Date.now(),
            }
          : n,
      ),
    );
  };

  const execCommand = (command) => {
    document.execCommand(command, false, null);
    handleEditorInput();
  };

  const copyToClipboard = () => {
    const text = editorRef.current?.innerText || "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <motion.div
      className="bg-glass text-(--text-primary) w-72 p-5 rounded-3xl relative z-50 border border-(--glass-border) mt-2 clickable overflow-hidden"
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <AnimatePresence mode="wait">
        {currentView === "list" ? (
          <motion.div
            key="list"
            initial={{ x: -0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="flex flex-col gap-4 h-[400px]"
          >
            <div className="flex items-center justify-between border-b border-(--glass-border) pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-(--btn-bg) rounded-2xl border border-(--glass-border)">
                  <FileText size={18} className="text-(--accent-color)" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[15px] font-black tracking-tight uppercase">
                    Notes
                  </h2>
                  <span className="text-[8px] font-bold text-(--accent-color) uppercase tracking-widest opacity-80">
                    {notes.length} {notes.length === 1 ? "Note" : "Notes"}
                  </span>
                </div>
              </div>
              <button
                onClick={createNewNote}
                className="p-2 bg-(--btn-bg) hover:bg-(--btn-bg-hover) border border-(--glass-border) rounded-xl transition-all text-(--accent-color)"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2">
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20 italic gap-2 py-10">
                  <FileText size={40} strokeWidth={1} />
                  <span className="text-xs">No notes discovered yet...</span>
                </div>
              ) : (
                notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => openNote(note.id)}
                    className="p-4 bg-(--btn-bg) hover:bg-(--btn-bg-hover) border border-(--glass-border) rounded-2xl transition-all flex flex-col gap-1 text-left group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[11px] font-bold truncate grow leading-tight">
                        {note.title || "Untitled Note"}
                      </span>
                      <button
                        onClick={(e) => deleteNote(note.id, e)}
                        className="opacity-0 group-hover:opacity-40 hover:opacity-100! p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <span className="text-[8px] font-bold text-(--text-secondary) uppercase tracking-widest">
                      {formatDate(note.updatedAt)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="flex flex-col gap-4 h-[400px]"
          >
            <div className="flex items-center justify-between border-b border-(--glass-border) pb-4">
              <div className="flex items-center gap-2 grow mr-2">
                <button
                  onClick={() => setCurrentView("list")}
                  className="p-2 hover:bg-(--btn-bg) rounded-xl transition-colors text-(--text-secondary) hover:text-(--text-primary)"
                >
                  <ChevronLeft size={16} />
                </button>
                <input
                  type="text"
                  value={activeNote?.title || ""}
                  onChange={handleTitleChange}
                  className="bg-transparent border-none focus:outline-none text-[13px] font-black tracking-tight text-(--text-primary) placeholder:text-(--text-secondary) w-full"
                  placeholder="Note Title..."
                />
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-(--btn-bg) rounded-xl transition-colors text-(--text-secondary) hover:text-(--text-primary)"
                >
                  {copied ? (
                    <CheckCircle size={14} className="text-(--accent-color)" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
                <button
                  onClick={() => deleteNote(activeNoteId)}
                  className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-(--text-secondary) hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex gap-1 p-1 bg-(--btn-bg) rounded-2xl border border-(--glass-border)">
              <button
                onClick={() => execCommand("bold")}
                className="flex-1 p-1.5 hover:bg-(--btn-bg-hover) rounded-xl transition-all flex justify-center items-center"
              >
                <Bold size={13} />
              </button>
              <button
                onClick={() => execCommand("italic")}
                className="flex-1 p-1.5 hover:bg-(--btn-bg-hover) rounded-xl transition-all flex justify-center items-center"
              >
                <Italic size={13} />
              </button>
              <button
                onClick={() => execCommand("underline")}
                className="flex-1 p-1.5 hover:bg-(--btn-bg-hover) rounded-xl transition-all flex justify-center items-center"
              >
                <UnderlineIcon size={13} />
              </button>
              <button
                onClick={() => execCommand("strikeThrough")}
                className="flex-1 p-1.5 hover:bg-(--btn-bg-hover) rounded-xl transition-all flex justify-center items-center"
              >
                <StrikethroughIcon size={13} />
              </button>
              <button
                onClick={() => execCommand("insertUnorderedList")}
                className="flex-1 p-1.5 hover:bg-(--btn-bg-hover) rounded-xl transition-all flex justify-center items-center"
              >
                <List size={13} />
              </button>
            </div>

            <div className="flex-1 min-h-0 relative">
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                dangerouslySetInnerHTML={{ __html: activeNote?.content || "" }}
                className="h-full p-4 bg-(--btn-bg) rounded-2xl border border-(--glass-border) focus:outline-none focus:border-(--accent-color) transition-all overflow-y-auto no-scrollbar text-[13px] leading-relaxed text-(--text-primary) selection:bg-(--accent-color) selection:text-white"
                placeholder="Transcribe Zenith thoughts..."
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] text-(--text-secondary) font-bold uppercase tracking-widest">
                Custom Intel Active
              </span>
              <div className="flex items-center gap-1 opacity-20">
                <span className="text-[8px] font-black tracking-tighter">
                  ZENITH CORE
                </span>
                <Save size={10} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
