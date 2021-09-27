import styled from "styled-components";
import { MailAttachments } from "../../../common/types";
import { AttachmentItem } from "./AttachmentItem";

const DivHost = styled.div`
  display: flex;
  align-items: center;
  padding: 0.1em;
  font-size: 0.8em;
  flex-wrap: wrap;
  border-bottom: 1px dashed #555;

  a {
    text-decoration: none;
    margin: 0.3em;
    display: inline-flex;
    border-bottom: 1px solid transparent;

    &:hover {
      border-bottom-color: inherit;
    }
  }
`;

export function AttachmentPreview({ attachments }: { attachments: MailAttachments }) {
  if (!attachments || !attachments.key) return null;

  const { key: fileKey, list } = attachments;
  return (
    <DivHost>
      {list.map((r) => (
        <AttachmentItem key={`${fileKey}-${r.id}`} fileKey={fileKey} {...r} />
      ))}
    </DivHost>
  );
}
