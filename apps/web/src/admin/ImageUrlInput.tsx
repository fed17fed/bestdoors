"use client";

import { useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { useInput, useNotify, type InputProps } from "react-admin";
import { uploadImage } from "./dataProvider";

/** URL field with a preview and an "Upload" button (Vercel Blob, or the local folder in development). */
export function ImageUrlInput(props: InputProps & { label?: string }) {
  const { field, fieldState, isRequired } = useInput(props);
  const notify = useNotify();
  const [busy, setBusy] = useState(false);
  const url = typeof field.value === "string" ? field.value : "";

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      field.onChange(await uploadImage(file));
    } catch (e) {
      notify(e instanceof Error ? e.message : "Upload failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", width: "100%", my: 1 }}>
      <Box sx={{ width: 96, height: 96, flexShrink: 0, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        ) : (
          <Typography variant="caption" color="text.secondary">No image</Typography>
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <TextField
          {...field}
          value={url}
          label={props.label ?? "Image URL"}
          required={isRequired}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? "Upload a file or paste a URL (https://…). Click Save to apply. The shop shows changes within about 1 minute."}
          size="small"
          fullWidth
        />
        <Button component="label" size="small" startIcon={busy ? <CircularProgress size={16} /> : <UploadIcon />} disabled={busy} sx={{ mt: 1 }}>
          {busy ? "Uploading…" : "Upload image"}
          <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </Button>
        {url && (
          <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} disabled={busy} onClick={() => field.onChange("")} sx={{ mt: 1, ml: 1 }}>
            Remove image
          </Button>
        )}
      </Box>
    </Box>
  );
}
