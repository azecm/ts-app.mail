import { AppHeader } from "./AppHeader";
import { AppBody } from "./AppBody";
import { useEffect } from "react";
import { loadNotes } from "../requests/loadNotes";
import { connect, useDispatch } from "react-redux";
import { Datalist } from "./Datalist";
import { StoreState } from "../store";
import { UsersState } from "../store/users";
import { Login } from "./Login";
import { MessageSubscription } from "./message/MessageSubscription";
import { MailEditor } from "./editor";
import { NotesGroupSubscription, NotesItemSubscription } from "./notes/NotesSubscription";

export const Main = connect((state: StoreState) => ({
  authorized: state.users.authorized,
  mailbox: state.users.mailbox,
}))(MainElement);

function MainElement({ mailbox, authorized }: Pick<UsersState, "authorized" | "mailbox">) {
  if (authorized) {
    document.title = `Почта для ${mailbox.replace("@", " на ")}`;
    return <AppStart />;
  } else {
    document.title = `Авторизация ${mailbox.replace("@", " на ")}`;
    return <Login />;
  }
}

function AppStart() {
  const dispatch = useDispatch();
  useEffect(() => {
    loadNotes(dispatch).then();
  }, [dispatch]);
  return (
    <>
      <AppHeader />
      <AppBody />
      <MailEditor />
      <Datalist />
      <MessageSubscription />
      <NotesGroupSubscription />
      <NotesItemSubscription />
    </>
  );
}
