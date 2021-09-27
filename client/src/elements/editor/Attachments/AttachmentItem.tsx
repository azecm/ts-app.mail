import styled from "styled-components";
import { MailAttachmentItem } from "../../../common/types";
import { FileSize } from "../../FileSize";
import { useState } from "react";
import { getHash, getUrlHost } from "../../../common/utils";
import { useSelector } from "react-redux";
import { StoreState } from "../../../store";

const SpanText = styled.span`
  display: inline-block;
  text-overflow: ellipsis;
  overflow-x: hidden;
  max-width: 15em;
  white-space: nowrap;
`;

interface AttachmentItemProps extends MailAttachmentItem {
  fileKey: string;
  temp?: boolean;
}

export function AttachmentItem({ size, fileName, id, fileKey, temp }: AttachmentItemProps) {
  const [userKey, setUserKey] = useState(() => {
    const referer = location.href;
    getHash([navigator.userAgent, fileName, referer, size].join("-")).then((hash) => {
      setUserKey(hash);
    });
    return "";
  });
  const mailbox = useSelector((state: StoreState) => state.users.mailbox);
  const params = new URLSearchParams();
  params.append("user", userKey);
  if (temp) params.append("temp", "1");
  params.append("filename", fileName);
  params.append("email", mailbox);

  return (
    <a href={`${getUrlHost()}file/${fileKey}-${id}?${params.toString()}`} download={fileName} title={fileName}>
      <SpanText>{fileName}</SpanText> <FileSize size={size} />
    </a>
  );
}
