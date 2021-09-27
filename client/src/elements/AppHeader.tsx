import styled from "styled-components";
import { ReactComponent as IconExit } from "./icons/mail-exit.svg";
import { MailBoxes } from "../common/types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, StoreState } from "../store";
import { setActiveBox } from "../store/users";
import { EditorType } from "../types";
import { editorUpdate } from "../store/editor";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  background-color: #345c80;
`;

const Button = styled.button`
  display: inline-flex;
  margin: 0.5em;
  padding: 0;
  align-items: center;
  cursor: pointer;
  border-radius: 0.2em;
  border: 0;
  outline: 0 none;
  background-color: #d3cbe3b0;
  color: ghostwhite;
  transition-duration: 0.5s;
  transition-property: background-color, color;

  svg.icon {
    width: 1em;
    margin: 0.32em 0.6em;
    pointer-events: none;
  }

  &.active {
    color: #5050e0;
    background-color: #f9f9f9;
    box-shadow: 0 0 0.3em silver;

    &:hover {
      background-color: #fdfdfd;
      text-decoration: underline;
    }
  }

  a {
    display: block;
    color: inherit;
    text-decoration: none;
    outline: 0 none;
    padding: 0.2em 0.5em;

    &:hover {
      color: inherit;
    }
  }

  &:hover {
    background-color: #e2e2e2;
    color: #333;
  }
`;

const Text = styled.div`
  padding: 0.2em 0.5em;
`;

export function AppHeader() {
  const mailbox = useSelector((state: StoreState) => state.users.mailbox);
  const signature = useSelector((state: StoreState) => state.users.signature);

  const dispatch = useDispatch<AppDispatch>();
  function handleEditor() {
    dispatch(editorUpdate({ opened: true, editable: true, type: EditorType.mail, content: `<p><br></p>${signature}` }));
  }

  function handleReload() {
    window.location.reload();
  }

  return (
    <Container>
      <Button onClick={handleEditor}>
        <Text>написать</Text>
      </Button>
      <ViewBoxes />
      <Button onClick={handleReload}>
        <Text>{mailbox}</Text>
      </Button>
      <Button>
        <IconExit className="icon" />
      </Button>
    </Container>
  );
}

function ViewBoxes() {
  const currentBox = useSelector((state: StoreState) => state.users.box);
  const dispatch = useDispatch();

  const handleSwitch = (box: MailBoxes) => {
    dispatch(setActiveBox(box));
  };

  const buttons = [
    { label: "входящие", box: MailBoxes.inbox, click: () => handleSwitch(MailBoxes.inbox) },
    { label: "прочтенные", box: MailBoxes.ready, click: () => handleSwitch(MailBoxes.ready) },
    { label: "отправленные", box: MailBoxes.sent, click: () => handleSwitch(MailBoxes.sent) },
    { label: "корзина", box: MailBoxes.trash, click: () => handleSwitch(MailBoxes.trash) },
    { label: "заметки", box: MailBoxes.notes, click: () => handleSwitch(MailBoxes.notes) },
  ];

  return (
    <>
      {buttons.map(({ label, box, click }) => (
        <Button key={label} className={box === currentBox ? "active" : void 0} onClick={click}>
          <Text>{label}</Text>
        </Button>
      ))}
    </>
  );
}
