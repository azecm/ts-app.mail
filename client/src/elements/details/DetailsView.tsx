import { connect } from "react-redux";
import { StoreState } from "../../store";
import { DetailsState, UsersState } from "../../store/users";
import { NotesState } from "../../store/notes";
import styled from "styled-components";
import { DetailsViewMail } from "./DetailsViewMail";
import { DetailsViewNote } from "./DetailsViewNote";

export const DetailsView = connect((state: StoreState) => ({
  details: state.users.details,
  reminders: state.notes.reminders,
}))(DetailsViewElement);
function DetailsViewElement({ details, reminders }: Pick<UsersState, "details"> & Pick<NotesState, "reminders">) {
  const isNotes = details === DetailsState.notes;
  return (
    <>
      <div style={{ display: isNotes ? void 0 : "none" }}>
        <DetailsViewNote />
      </div>
      <MailDetailsSub reminders={reminders} details={details} />
    </>
  );
}

function MailDetailsSub({ details, reminders }: Pick<UsersState, "details"> & Pick<NotesState, "reminders">) {
  switch (details) {
    case DetailsState.email:
      return <DetailsViewMail />;
    case DetailsState.reminders:
      return <Reminders reminders={reminders} />;
    default:
      return null;
  }
}

const SpanDate = styled.span`
  color: #007bff;
`;

function Reminders({ reminders }: Pick<NotesState, "reminders">) {
  if (!reminders.length) return null;

  return (
    <>
      <h1>Напоминания</h1>
      <ul>
        {reminders.map((r, i) => (
          <li key={i}>
            <SpanDate>{r.date}</SpanDate> <small>{r.label}</small>
          </li>
        ))}
      </ul>
    </>
  );
}
