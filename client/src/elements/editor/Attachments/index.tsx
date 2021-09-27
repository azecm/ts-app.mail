import { AttachmentPreview } from "./AttachmentPreview";
import { StoreState } from "../../../store";
import { useSelector } from "react-redux";
import { EditorType } from "../../../types";
import { AttachmentActive } from "./AttachmentActive";

export function MailEditorAttach() {
  const editorType = useSelector((state: StoreState) => state.editor.type);
  const attachments = useSelector((state: StoreState) => state.editor.attachments);
  switch (editorType) {
    case EditorType.preview:
      return <AttachmentPreview attachments={attachments} />;
    default:
      return <AttachmentActive />;
  }
}
