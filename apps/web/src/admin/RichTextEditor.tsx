"use client";

import { useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, ToggleButton } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import TableChartIcon from "@mui/icons-material/TableChart";
import UploadIcon from "@mui/icons-material/Upload";
import { useNotify } from "react-admin";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TextAlign } from "@tiptap/extension-text-align";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import {
  AlignmentButtons, ClearButtons, FormatButtons, LevelSelect, LinkButtons, ListButtons, QuoteButtons, RichTextInput,
  RichTextInputToolbar, useTiptapEditor, type RichTextInputProps,
} from "ra-input-rich-text";
import { uploadImage } from "./dataProvider";

/**
 * Only formats the shop can show (and the API keeps) are in the editor:
 * headings, bold/italic/underline/strike, lists, links, quotes, images, simple tables, text alignment.
 * The API cleans the HTML again when the page is saved.
 */
const EDITOR_OPTIONS = {
  extensions: [
    StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true } }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Image.configure({ inline: false }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
  ],
};

/** "Image" button: paste a URL or upload a file (same upload as for door photos). */
function ImageButton({ size }: { size?: "small" | "medium" | "large" }) {
  const editor = useTiptapEditor();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      setUrl(await uploadImage(file));
    } catch (e) {
      notify(e instanceof Error ? e.message : "Upload failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  function insert() {
    const src = url.trim();
    if (/^https?:\/\//i.test(src) || src.startsWith("/")) {
      editor.chain().focus().setImage({ src, alt: alt.trim() }).run();
      setOpen(false);
      setUrl("");
      setAlt("");
    } else {
      notify("Use an address that starts with https://", { type: "warning" });
    }
  }

  return (
    <>
      <ToggleButton size={size} value="image" aria-label="Insert image" title="Insert image" disabled={!editor?.isEditable} onClick={() => setOpen(true)}>
        <ImageIcon fontSize="inherit" />
      </ToggleButton>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Insert image</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
            <TextField label="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" size="small" fullWidth autoFocus />
            <Button component="label" size="small" startIcon={busy ? <CircularProgress size={16} /> : <UploadIcon />} disabled={busy} sx={{ justifySelf: "start" }}>
              {busy ? "Uploading…" : "Or upload a file"}
              <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            </Button>
            <TextField label="Alt text (describes the image for screen readers)" value={alt} onChange={(e) => setAlt(e.target.value)} size="small" fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={insert} disabled={!url.trim() || busy}>Insert</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** Insert a table, or add/remove rows and columns when the cursor is in one. */
function TableButtons({ size }: { size?: "small" | "medium" | "large" }) {
  const editor = useTiptapEditor();
  const inTable = !!editor?.isActive("table");
  const disabled = !editor?.isEditable;
  return (
    <>
      <ToggleButton size={size} value="table" aria-label="Insert table" title="Insert table (3 × 3)" disabled={disabled || inTable} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <TableChartIcon fontSize="inherit" />
      </ToggleButton>
      {inTable && (
        <>
          <Button size="small" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</Button>
          <Button size="small" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Column</Button>
          <Button size="small" color="warning" onClick={() => editor.chain().focus().deleteRow().run()}>− Row</Button>
          <Button size="small" color="warning" onClick={() => editor.chain().focus().deleteColumn().run()}>− Column</Button>
          <Button size="small" color="error" onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</Button>
        </>
      )}
    </>
  );
}

export function PageRichText(props: Omit<RichTextInputProps, "toolbar" | "editorOptions">) {
  return (
    <RichTextInput
      {...props}
      editorOptions={EDITOR_OPTIONS}
      toolbar={
        <RichTextInputToolbar>
          <LevelSelect />
          <FormatButtons />
          <AlignmentButtons />
          <ListButtons />
          <LinkButtons />
          <ImageButton />
          <TableButtons />
          <QuoteButtons />
          <ClearButtons />
        </RichTextInputToolbar>
      }
      sx={{ "& .ProseMirror": { minHeight: 360 }, "& .ProseMirror table": { borderCollapse: "collapse", width: "100%" }, "& .ProseMirror th, & .ProseMirror td": { border: "1px solid #c9d4ea", padding: "4px 8px", verticalAlign: "top" }, "& .ProseMirror img": { maxWidth: "100%" } }}
    />
  );
}
