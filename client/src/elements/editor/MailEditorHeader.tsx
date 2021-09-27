import styled from "styled-components";
import { useSelector } from "react-redux";
import { StoreState } from "../../store";
import { EditorType } from "../../types";
import { useContext } from "react";
import { EditorContext } from "./context";

export function MailEditorHeader() {
  const editor = useSelector((state: StoreState) => {
    const { type } = state.editor;
    return { type };
  });
  switch (editor.type) {
    case EditorType.mail:
      return <HeaderInput />;
    case EditorType.preview:
      return <HeaderPreview />;
    default:
      return null;
  }
}

function HeaderPreview() {
  const editor = useSelector((state: StoreState) => {
    const { mailTo, mailFrom, subject } = state.editor;
    return { mailTo, mailFrom, subject };
  });
  return (
    <div>
      <div>
        <b>Кому:</b> {editor.mailTo}
      </div>
      <div>
        <b>От кого:</b> {editor.mailFrom}
      </div>
      <div>
        <b>Тема:</b> {editor.subject}
      </div>
    </div>
  );
}

const InputText = styled.input`
  width: 100%;
  box-sizing: border-box;
`;

function HeaderInput() {
  const elements = useContext(EditorContext);
  const editor = useSelector((state: StoreState) => {
    const { mailTo, subject } = state.editor;
    return { mailTo, subject };
  });
  return (
    <div>
      <div>
        <InputText
          title="получатель"
          placeholder="получатель"
          list="emailDatalist"
          type="string"
          name="mailTo"
          defaultValue={editor.mailTo}
          ref={(elem) => (elements.current.recipient = elem)}
        />
      </div>
      <div>
        <InputText
          title="тема"
          placeholder="тема"
          type="string"
          name="subject"
          defaultValue={editor.subject}
          ref={(elem) => (elements.current.subject = elem)}
        />
      </div>
    </div>
  );
}
