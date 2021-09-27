import { ChangeEvent, useCallback, useContext, useEffect, useState } from "react";
import { ReactComponent as IconClose } from "./icons/close.svg";
import { ReactComponent as IconSend } from "./icons/send.svg";
import { ReactComponent as IconSave } from "./icons/save.svg";
import { ReactComponent as IconEraser } from "./icons/eraser.svg";
import { ReactComponent as IconHeading } from "./icons/heading.svg";
import { ReactComponent as IconParagraph } from "./icons/paragraph.svg";
import { ReactComponent as IconBold } from "./icons/font-bold.svg";
import { ReactComponent as IconItalic } from "./icons/font-italic.svg";
import { ReactComponent as IconUnderline } from "./icons/font-underline.svg";
import { ReactComponent as IconListUL } from "./icons/list-ul.svg";
import { ReactComponent as IconListOL } from "./icons/list-ol.svg";
import { ReactComponent as IconLink } from "./icons/link.svg";
import { ReactComponent as IconLinkRemove } from "./icons/link-remove.svg";
import { ReactComponent as IconAttach } from "./icons/attach.svg";
import styled from "styled-components";
import { useDialogAlert, useDialogForm } from "../../dialogs";
import { domDropElem, genKey, tagParent } from "../../common/utils";
import { DialogLink } from "../dialogs/DialogLink";
import { useMutation } from "../../qraphql/request";
import gql from "graphql-tag";
import { connect, useDispatch, useSelector } from "react-redux";
import { AppDispatch, StoreState } from "../../store";
import { postFormData } from "../../qraphql/uploadFiles";
import { MailAddress, MailAttachmentItem, MailAttachments, MessageSendProps } from "../../common/types";
import { EditorType } from "../../types";
import { editorAttachmentAdd, editorUpdate } from "../../store/editor";
import { EditorContext } from "./context";

const gqlNotesContentUpdate = gql`
  mutation NotesContent($idn: Int!, $content: String!) {
    notesContent(idn: $idn, content: $content)
  }
`;

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

const DivProgress = styled.div`
  color: #007bff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const SpanProgressText = styled.span`
  font-size: 0.5em;
`;

const InputFile = styled.input`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;

// =========

export function ToolsFullInit({ active }: { active: boolean }) {
  if (active) {
    return <ToolsFull />;
  }
  return null;
}

const gqlMessageSend = gql`
  mutation MessageSend(
    $subject: String
    $content: String
    $recipient: MailAddressInput
    $attachments: AttachmentsInput
  ) {
    messageSend(subject: $subject, content: $content, recipient: $recipient, attachments: $attachments)
  }
`;

const ToolsFull = connect((state: StoreState) => ({ idn: state.users.idn, attachments: state.editor.attachments }))(
  ToolsFullElement,
);

function ToolsFullElement({ idn, attachments }: { idn: number; attachments: MailAttachments }) {
  const editor = useSelector((state: StoreState) => {
    const { type } = state.editor;
    return { type };
  });
  const dispatch = useDispatch<AppDispatch>();
  const elements = useContext(EditorContext);

  const dlgForm = useDialogForm();
  const isNote = editor.type === EditorType.note;
  const saveContent = useMutation<{ idn: number; content: string }, boolean>(gqlNotesContentUpdate);
  const messageSend = useMutation<MessageSendProps, boolean>(gqlMessageSend);
  const dlgAlert = useDialogAlert();

  const onClose = () => {
    dispatch(editorUpdate({ opened: false }));
  };
  const onSave = async () => {
    const elem = elements.current.content;
    if (!elem) return;
    const content = elem.innerHTML;
    if (await saveContent({ idn, content })) {
      editorUpdate({ saved: true });
    } else {
      dlgAlert("Ошибка при сохранении записи...");
    }
  };

  function getForm() {
    const recipient = elements.current.recipient?.value.trim() ?? "";
    const res = {
      content: elements.current?.content?.innerHTML ?? "",
      subject: elements.current.subject?.value.trim() ?? "",
      recipient: { name: "", address: "" } as MailAddress,
    };
    const m = recipient.match(/([^<]+)<([^>]+)>/);
    if (m) {
      res.recipient.name = m[1].trim();
      res.recipient.address = m[2].trim();
      if (/[a-z0-9.-]@[a-z0-9.-]+\.[a-z]+/i.test(res.recipient.address)) {
      } else {
        res.recipient.address = "";
      }
    } else {
      res.recipient.address = recipient;
    }

    return res;
  }

  const onSend = async () => {
    const { recipient, subject, content } = getForm();
    if (!recipient.address) {
      dlgAlert(`Некорректный адрес получателя`);
      return;
    }
    const res = await messageSend({ recipient, subject, content, attachments });
    if (res) {
      dispatch(editorUpdate({ opened: false }));
    } else {
      dlgAlert("Ошибка при отправке...");
    }
  };

  const onEraser = () => {
    execCommand("removeFormat");
  };

  const onHeading = useCallback(() => {
    execCommand("formatBlock", "h1");
  }, []);

  const onParagraph = useCallback(() => {
    execCommand("formatBlock", "p");
  }, []);

  const onBold = useCallback(() => {
    execCommand("bold");
  }, []);

  const onItalic = useCallback(() => {
    execCommand("italic");
  }, []);

  const onUnderline = useCallback(() => {
    execCommand("underline");
  }, []);

  const onUL = useCallback(() => {
    execCommand("insertUnorderedList");
  }, []);

  const onOL = useCallback(() => {
    execCommand("insertOrderedList");
  }, []);

  const onLinkRemove = useCallback(() => {
    execCommand("unlink");
  }, []);

  const onLinkResult = ({ url, link }: { url: string; link: null | HTMLLinkElement }) => {
    if (link) {
      if (url) {
        link.setAttribute("href", url);
      } else {
        domDropElem(link);
      }
    } else {
      setTimeout(() => {
        execCommand("createLink", url);
        setTimeout(() => {
          elements.current.content?.querySelectorAll("[_moz_dirty]").forEach((el) => {
            el.removeAttribute("_moz_dirty");
          });
        }, 1);
      }, 50);
    }
  };

  const onLink = () => {
    let url = "http://";
    let link = null as null | HTMLLinkElement;
    const selection = window.getSelection();
    if (selection && selection.rangeCount && selection.anchorNode) {
      link = tagParent(selection.anchorNode, "a") as null | HTMLLinkElement;
      if (link) {
        url = link.getAttribute("href") || url;
      }
    }

    dlgForm({
      title: link ? "Свойства ссылки" : "Создать ссылку",
      Form: DialogLink,
      props: { url, link },
      result: onLinkResult,
    });
  };

  return (
    <DivTools>
      <button title="закрыть" onClick={onClose}>
        <IconClose />
      </button>
      {isNote ? (
        <button title="сохранить" onClick={onSave}>
          <IconSave />
        </button>
      ) : (
        <button title="отправить" onClick={onSend}>
          <IconSend />
        </button>
      )}
      <SpanSpace />
      <button title="удалить форматирование" onClick={onEraser}>
        <IconEraser />
      </button>
      <button title="заголовок" onClick={onHeading}>
        <IconHeading />
      </button>
      <button title="параграф" onClick={onParagraph}>
        <IconParagraph />
      </button>
      <button title="жирный" onClick={onBold}>
        <IconBold />
      </button>
      <button title="курсив" onClick={onItalic}>
        <IconItalic />
      </button>
      <button title="подчеркнутый" onClick={onUnderline}>
        <IconUnderline />
      </button>
      <button title="маркированный список" onClick={onUL}>
        <IconListUL />
      </button>
      <button title="нумерованный список" onClick={onOL}>
        <IconListOL />
      </button>
      <button title="ссылка" onClick={onLink}>
        <IconLink />
      </button>
      <button title="удалить ссылку" onClick={onLinkRemove}>
        <IconLinkRemove />
      </button>
      {!isNote ? <ButtonAttach /> : null}
    </DivTools>
  );
}

function ButtonAttach() {
  const attachments = useSelector((state: StoreState) => state.editor.attachments);
  const dispatch = useDispatch<AppDispatch>();

  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const dlgAlert = useDialogAlert();

  const onAttach = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (!files) return;
    const last = Math.max.apply(null, attachments.list.map((r) => +r.id).concat([0]));
    const form = new FormData();
    form.append("key", attachments.key);
    form.append("last", last + "");
    for (const f of files) {
      form.append("files", f);
    }

    setStarted(true);
    const result = await postFormData<MailAttachmentItem[]>(form, setProgress);
    setStarted(false);

    if (result) {
      dispatch(editorAttachmentAdd(result));
    } else {
      dlgAlert("Ошибка при загрузке...");
    }
  };

  useEffect(() => {
    if (!attachments.key) {
      attachments.key = genKey();
      attachments.list = [];
    }
  }, [attachments]);

  return (
    <button title="прикрепить файлы">
      {started ? (
        <DivProgress>
          <SpanProgressText>{progress}%</SpanProgressText>
        </DivProgress>
      ) : (
        <IconAttach />
      )}
      <InputFile type="file" multiple onChange={onAttach} disabled={started} />
    </button>
  );
}

function execCommand(command: string, param?: string) {
  if (param) document.execCommand(command, false, param);
  else document.execCommand(command, false);
}
