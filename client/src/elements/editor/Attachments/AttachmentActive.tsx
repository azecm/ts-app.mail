import styled from "styled-components";
import { connect } from "react-redux";
import { AppDispatchProp, StoreState } from "../../../store";
import { MailAttachments } from "../../../common/types";
import { MouseEvent } from "react";
import { ReactComponent as IconRemove } from "../icons/remove.svg";
import { AttachmentItem } from "./AttachmentItem";
import { editorAttachmentRemove } from "../../../store/editor";

const DivHost = styled.div`
  display: flex;
  align-items: center;
  padding: 0.1em;
  font-size: 0.8em;
  flex-wrap: wrap;
`;

const DivItem = styled.div`
  display: flex;
  align-items: center;
  margin: 0.1em;
  padding: 0.1em 0.3em;
  box-shadow: 0 0 0.3em silver;
  border-radius: 0.3em;

  &:hover {
    box-shadow: 0 0 0.4em #777;
  }

  a {
    display: flex;
    color: #535353;
    text-decoration: none;

    &:hover {
      color: #007bff;
    }
  }
`;

const SpanIcon = styled.span`
  display: flex;
  cursor: pointer;
  color: #555;
  margin-left: 0.3em;

  &:hover {
    color: #007bff;
  }

  svg {
    pointer-events: none;
    height: 1em;
  }
`;

export const AttachmentActive = connect((state: StoreState) => ({ attachments: state.editor.attachments }))(
  AttachmentActiveElement,
);

export function AttachmentActiveElement({ attachments, dispatch }: { attachments: MailAttachments } & AppDispatchProp) {
  function handleClick(e: MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement;
    const idStr = target?.dataset?.id;
    if (idStr) {
      dispatch(editorAttachmentRemove(+idStr));
    }
  }

  const { key: fileKey, list } = attachments;
  return (
    <DivHost onClick={handleClick}>
      {(list || []).map((r) => (
        <DivItem key={`${fileKey}-${r.id}`}>
          <AttachmentItem {...r} fileKey={fileKey} temp={true} />
          <SpanIcon data-id={r.id}>
            <IconRemove />
          </SpanIcon>
        </DivItem>
      ))}
    </DivHost>
  );
}
