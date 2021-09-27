import {
  MailAddress,
  MailBoxes,
  MailBoxModel,
  messageOperationMove,
  MessageOperationProps,
  messageOperationRead,
} from "../../common/types";
import { AppDispatchProp } from "../../store";
import styled from "styled-components";
import { ReactComponent as IconNote } from "../icons/note.svg";
import { ReactComponent as IconRead } from "../icons/read.svg";
import { ReactComponent as IconTrash } from "../icons/trash.svg";
import { ReactComponent as IconEnvelope } from "../icons/envelope.svg";
import { ReactComponent as IconInbox } from "../icons/envelope-open.svg";
import { MouseEvent, useEffect, useState } from "react";
import { format, isValid } from "date-fns";
import { mailItemChoice } from "../../store/users";
import { useDialogAlert } from "../../dialogs";
import { viewAddress } from "../../common/utils";
import gql from "graphql-tag";
import { useMutation } from "../../qraphql/request";
import { gqlMessageOperation } from "../../common/constants";
import { editorUpdate } from "../../store/editor";
import { EditorType } from "../../types";

enum IconType {
  envelope,
  inbox,
  note,
  read,
  trash,
}

const SpanDateContent = styled.span`
  border-bottom: 1px dashed #555;
`;

const Container = styled.div`
  display: flex;
  margin: 0.5em 0;
  padding: 0.5em 0.1em;
  cursor: pointer;
  min-height: 3em;

  &:hover {
    background-color: #eee;
    box-shadow: 0 0 3em #fff;
  }

  &.unread {
    font-weight: bold;

    ${SpanDateContent} {
      display: inline-block;
      color: darkblue;
    }
  }
`;

const DivCol1 = styled.div`
  width: 2em;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DivCol2 = styled.div`
  position: relative;
  padding-left: 0.3em;
`;

const DivNoteContainer = styled.div`
  display: none;
  position: absolute;
  margin-left: -1.7em;
  margin-top: -0.5em;
  color: #888;

  ${Container}:hover & {
    display: block;
  }

  svg {
    pointer-events: none;
  }

  &:hover {
    color: blue;
  }
`;

const SvgNoteIcon = styled(IconNote)`
  width: 1em;
  display: block;
`;

const IconInboxColored = styled(IconInbox)`
  color: blue;
`;

const IconTrashColored = styled(IconTrash)`
  color: red;
`;

const DivDate = styled.div`
  font-size: 0.7em;
`;

const EmailName = styled.span`
  margin-right: 0.3em;
  color: #555;
`;

const EmailAddress = styled.span`
  font-style: italic;
  margin-left: 0.3em;
`;

const DivIcon = styled.div`
  opacity: 0.4;

  ${Container}:hover & {
    opacity: 1;
  }

  svg {
    pointer-events: none;
    height: 1.3em;
    display: block;
  }
`;

const gqlMessageSave = gql`
  mutation MessageSave($idb: BigInt!) {
    messageSave(idb: $idb)
  }
`;

type Props = MailBoxModel & AppDispatchProp & { box: MailBoxes };

export function MessageView({ dispatch, box, ...item }: Props) {
  const dlgAlert = useDialogAlert();

  const messageSave = useMutation<{ idb: bigint }, boolean>(gqlMessageSave);
  const messageOperation = useMutation<MessageOperationProps, boolean>(gqlMessageOperation);

  function mouseEnter() {
    dispatch(mailItemChoice(item.idb, box));
  }

  async function toNotes(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (await messageSave({ idb: item.idb })) {
      dlgAlert("Сохранено в заметки (в первой группе)");
    } else {
      dlgAlert("Ошибка при сохранении в заметки");
    }
  }

  async function messagePreview() {
    const { idb, subject, content, attachments, sender, recipient } = item;
    dispatch(
      editorUpdate({
        opened: true,
        type: EditorType.preview,
        // ===
        idb,
        subject,
        content,
        attachments,
        mailFrom: viewAddress(sender),
        mailTo: viewAddress(recipient),
      }),
    );

    if (item.unread && box === MailBoxes.inbox) {
      if (!(await messageOperation({ idb: item.idb, operation: messageOperationRead }))) {
        dlgAlert(`Ошибка при смене статуса на "прочтенный"`);
      }
    }
  }

  const d = new Date(+item.date);

  // format(addMinutes(d, d.getTimezoneOffset()), "dd.MM.yyyy HH:mm:ss")
  const date = isValid(d) ? format(d, "dd.MM.yyyy HH:mm:ss") : "";

  return (
    <Container
      role="button"
      tabIndex={0}
      onKeyDown={() => void 0}
      onMouseEnter={mouseEnter}
      onClick={messagePreview}
      className={box === MailBoxes.inbox && item.unread ? "unread" : void 0}
    >
      <DivCol1>
        <EmailIcon box={box} unread={item.unread} idb={item.idb} />
      </DivCol1>
      <DivCol2>
        <DivNoteContainer
          role="button"
          tabIndex={0}
          onKeyDown={() => void 0}
          title="сохранить в записках"
          onClick={toNotes}
        >
          <SvgNoteIcon />
        </DivNoteContainer>
        <DivDate>
          <SpanDateContent>{date}</SpanDateContent>
        </DivDate>
        <EmailView {...item} box={box} />
        <div>{item.subject}</div>
        <div>{item.attachments?.list?.length ? `[+${item.attachments.list.length}]` : null}</div>
      </DivCol2>
    </Container>
  );
}

// ===========

function Icon({ state }: { state: IconType }) {
  switch (state) {
    case IconType.inbox:
      return <IconInboxColored />;
    case IconType.note:
      return <IconNote />;
    case IconType.read:
      return <IconRead />;
    case IconType.trash:
      return <IconTrashColored />;
    case IconType.envelope:
      return <IconEnvelope />;
    default:
      return null;
  }
}

// ========

interface EmailIconProps {
  unread: boolean;
  box: MailBoxes;
  idb: bigint;
}

function EmailIcon({ unread, box, idb }: EmailIconProps) {
  const [state, setState] = useState(iconDefault(unread, box));
  const [title, setTitle] = useState<string | undefined>();
  const messageOperation = useMutation<MessageOperationProps, boolean>(gqlMessageOperation);
  const dlgAlert = useDialogAlert();

  async function handleMove(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const target = getTargetBox(box, unread);
    const res = await messageOperation({ idb, operation: messageOperationMove, box: target });
    if (!res) {
      dlgAlert("Ошибка при перемещении");
    }
  }

  function onMouseEnter() {
    setTitle(getMouseEnterTitle(box, unread));
    setState(getMouseEnterIcon(box));
  }

  function onMouseLeave() {
    setTitle(void 0);
    setState(iconDefault(unread, box));
  }

  useEffect(() => {
    setState(iconDefault(unread, box));
  }, [box, unread]);

  return (
    <DivIcon
      role="button"
      tabIndex={0}
      onKeyDown={() => void 0}
      title={title}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleMove}
    >
      <Icon state={state} />
    </DivIcon>
  );
}

function iconDefault(unread: boolean, box: MailBoxes) {
  if (box === MailBoxes.inbox) {
    return unread ? IconType.envelope : IconType.inbox;
  } else {
    return IconType.read;
  }
}

function getTargetBox(box: MailBoxes, unread: boolean) {
  switch (box) {
    case MailBoxes.inbox:
      return unread ? MailBoxes.trash : MailBoxes.ready;
    case MailBoxes.trash:
      return MailBoxes.inbox;
    default:
      return MailBoxes.trash;
  }
}

function getMouseEnterTitle(box: MailBoxes, unread: boolean) {
  switch (box) {
    case MailBoxes.inbox:
      return unread ? "в корзину" : "в прочтенные";
    case MailBoxes.trash:
      return "во входящие";
    default:
      return "в корзину";
  }
}

function getMouseEnterIcon(box: MailBoxes) {
  switch (box) {
    case MailBoxes.trash:
      return IconType.inbox;
    default:
      return IconType.trash;
  }
}

function EmailView({ box, ...item }: MailBoxModel & { box: MailBoxes }) {
  switch (box) {
    case MailBoxes.sent:
      return (
        <div>
          <Email {...item.recipient} />
        </div>
      );
    default:
      return (
        <div>
          <Email {...item.sender} />
        </div>
      );
  }
}

function Email(row: MailAddress) {
  if (row.address && row.name) {
    return (
      <>
        <EmailName>{row.name}</EmailName>
        <EmailAddress>{row.address}</EmailAddress>
      </>
    );
  } else if (row.address) {
    return <EmailAddress>{row.address}</EmailAddress>;
  } else return null;
}
