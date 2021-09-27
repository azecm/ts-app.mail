import gql from "graphql-tag";
import { useSubscriptionFn } from "../../qraphql/subscription";
import { useDispatch, useSelector } from "react-redux";
import { actionNotesGroupUpdate, actionNotesItemUpdate } from "../../store/notes";
import { MailNotesModel, NoteGroup, NoteRemove } from "../../common/types";
import { SubNotesGroupUpdated, SubNotesItemUpdated } from "../../common/constants";
import { StoreState } from "../../store";

const gqlNotesGroupSubscription = gql`
  subscription NotesGroupUpdated($email: String) {
    notesGroupUpdated(email: $email) {
      idn
      label
      position
      remove
    }
  }
`;

const gqlNotesItemSubscription = gql`
  subscription NotesItemUpdated($email: String) {
    notesItemUpdated(email: $email) {
      idp
      idn
      label
      position
      email
      content
      remove
      event {
        date
        delta
        period
      }
    }
  }
`;

export function NotesGroupSubscription() {
  const email = useSelector((state: StoreState) => state.users.mailbox);
  const dispatch = useDispatch();

  type Result = { [SubNotesGroupUpdated]: (NoteGroup & NoteRemove)[] };

  function result(data: Result | null) {
    if (!data) return;
    dispatch(actionNotesGroupUpdate(data[SubNotesGroupUpdated]));
  }

  useSubscriptionFn<Result>(gqlNotesGroupSubscription, result, { email });

  return null;
}

export function NotesItemSubscription() {
  const email = useSelector((state: StoreState) => state.users.mailbox);
  const dispatch = useDispatch();

  type Result = { [SubNotesItemUpdated]: (MailNotesModel & NoteRemove)[] };

  function result(data: Result | null) {
    if (!data) return;
    dispatch(actionNotesItemUpdate(data[SubNotesItemUpdated]));
  }

  useSubscriptionFn<Result>(gqlNotesItemSubscription, result, { email });

  return null;
}
