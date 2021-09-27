import styled from "styled-components";
import { MailEditorAttach } from "./Attachments/";
import { MailEditorHeader } from "./MailEditorHeader";
import { ToolsPreviewInit } from "./ToolsPreview";
import { ToolsFullInit } from "./ToolsFull";
import { EditorType } from "../../types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, StoreState } from "../../store";
import { editorUpdate } from "../../store/editor";
import { ContextProps, EditorContext } from "./context";
import { useRef } from "react";

const DivBack = styled.div`
  position: fixed;
  display: flex;
  background-color: rgba(200, 200, 200, 0.5);
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  align-items: center;
  justify-content: center;
`;

const DivContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 60vw;
  height: 90vh;
  background-color: #f5f5f5;
  border-radius: 0.5em;
  overflow: hidden;
  padding: 1em;

  @keyframes saved {
    from {
      background-color: #f5f5f5;
    }
    50% {
      background-color: #00f500;
    }
    to {
      background-color: #f5f5f5;
    }
  }

  &.saved {
    animation: saved 2s linear;
  }
`;

const DivContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 1em;

  &[contenteditable="true"] {
    background-color: #fafafa;
  }
`;

export function MailEditor() {
  const dispatch = useDispatch<AppDispatch>();
  const editor = useSelector((state: StoreState) => {
    const { opened, saved, type, editable, content } = state.editor;
    return { opened, saved, type, editable, content };
  });

  const onAnimationEnd = () => {
    dispatch(editorUpdate({ saved: false }));
  };

  const elements: ContextProps = useRef({ content: null, subject: null, recipient: null });

  if (!editor.opened) return null;

  return (
    <EditorContext.Provider value={elements}>
      <DivBack>
        <DivContainer
          className={editor.saved ? "saved" : void 0}
          onAnimationEnd={editor.saved ? onAnimationEnd : void 0}
        >
          <div>
            <ToolsPreviewInit active={editor.type === EditorType.preview} />
            <MailEditorHeader />
            <ToolsFullInit active={editor.type === EditorType.mail || editor.type === EditorType.note} />
            <MailEditorAttach />
          </div>
          <DivContent
            contentEditable={editor.editable}
            ref={(elem) => (elements.current.content = elem)}
            dangerouslySetInnerHTML={{ __html: editor.content || "<p><br></p>" }}
          />
        </DivContainer>
      </DivBack>
    </EditorContext.Provider>
  );
}
