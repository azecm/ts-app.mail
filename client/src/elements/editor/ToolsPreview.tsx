import styled from "styled-components";
import { ReactComponent as IconClose } from "./icons/close.svg";
import { ReactComponent as IconReply } from "./icons/reply.svg";
import { ReactComponent as IconForward } from "./icons/forward.svg";
import { ReactComponent as IconEnvelope } from "../icons/envelope.svg";
import { connect, useDispatch, useSelector } from "react-redux";
import { AppDispatch, StoreState } from "../../store";
import { UsersState } from "../../store/users";
import { MailAttachments, MailBoxes, MessageOperationProps, messageOperationUnread } from "../../common/types";
import { gqlRequest, useMutation } from "../../qraphql/request";
import { gqlMessageOperation } from "../../common/constants";
import { editorUpdate } from "../../store/editor";
import { EditorType } from "../../types";
import gql from "graphql-tag";

export function ToolsPreviewInit({ active }: { active: boolean }) {
  if (active) {
    return <ToolsPreview />;
  }
  return null;
}

const DivTools = styled.div`
  padding: 0.3em 0;
  display: flex;

  button {
    position: relative;
    background-color: transparent;
    cursor: pointer;
    padding: 0.2em;
    border: 0 none;
    width: 1.4em;
    height: 1.4em;
    border-radius: 0.2em;
    margin-right: 0.3em;
    font-size: 1.1em;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: #ddd;
    }
  }

  svg {
    max-height: 1em;
    pointer-events: none;
  }
`;

const SpanSpace = styled.span`
  display: inline-block;
  width: 1em;
`;

const gqlMessageForward = gql`
  query Load($idb: BigInt) {
    messageForward(idb: $idb) {
      key
      list {
        fileName
        id
        size
      }
    }
  }
`;

const ToolsPreview = connect((state: StoreState) => ({
  signature: state.users.signature,
  box: state.users.box,
  mailbox: state.users.mailbox,
}))(ToolsPreviewElem);

function ToolsPreviewElem({ signature, box, mailbox }: Pick<UsersState, "signature" | "box" | "mailbox">) {
  const dispatch = useDispatch<AppDispatch>();
  const editor = useSelector((state: StoreState) => {
    const { subject, content, mailFrom, attachments, mailTo, idb } = state.editor;
    return { subject, content, mailFrom, attachments, mailTo, idb };
  });

  const onClose = () => {
    dispatch(editorUpdate({ opened: false }));
  };

  const onReply = async () => {
    dispatch(
      editorUpdate({
        opened: true,
        editable: true,
        type: EditorType.mail,
        // ===
        subject: `RE: ${updateSubj(editor.subject)}`,
        content: `<p><br></p>${signature}<hr>${editor.content}`,
        mailTo: editor.mailFrom.toLocaleLowerCase().includes(mailbox.toLocaleLowerCase())
          ? editor.mailTo
          : editor.mailFrom,
      }),
    );
  };

  const onForward = async () => {
    let attachments = {} as MailAttachments;
    if (editor.attachments?.key && editor.attachments?.list.length) {
      const res = await gqlRequest<{ messageForward: MailAttachments }>(gqlMessageForward, { idb: editor.idb });
      if (res?.messageForward) {
        attachments = res.messageForward;
      }
    }
    dispatch(
      editorUpdate({
        opened: true,
        editable: true,
        type: EditorType.mail,
        // ===
        subject: `FW: ${updateSubj(editor.subject)}`,
        content: `<p>Отправитель: ${updateMail(editor.mailFrom)}<br>Переадресовано: ${updateMail(
          editor.mailTo,
        )}</p><p><br></p><hr>${editor.content}`,
        mailTo: "",
        attachments,
      }),
    );
  };

  const messageOperation = useMutation<MessageOperationProps, boolean>(gqlMessageOperation);

  const flagUnread = box === MailBoxes.inbox;

  async function onUnread() {
    await messageOperation({ idb: editor.idb, operation: messageOperationUnread });
    onClose();
  }

  return (
    <DivTools>
      <button title="закрыть" onClick={onClose}>
        <IconClose />
      </button>
      <SpanSpace />
      <button title="ответить" onClick={onReply}>
        <IconReply />
      </button>
      <button title="переслать" onClick={onForward}>
        <IconForward />
      </button>
      <SpanSpace />
      {flagUnread ? (
        <button title="отменить прочтение" onClick={onUnread}>
          <IconEnvelope />
        </button>
      ) : null}
    </DivTools>
  );
}

function updateSubj(subject: string) {
  return subject.replace(/(re:|fw:|re\[\d+]:)/gi, "").trim();
}

function updateMail(s: string) {
  return s.replace("<", "&lt;").replace(">", "&gt;");
}
