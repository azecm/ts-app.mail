import { connect, useDispatch } from "react-redux";
import styled from "styled-components";
import { MailEventPeriod, MailNoteEvent, MailNotesModel, NotesGroupItem } from "../../common/types";
import { AppDispatch, StoreState } from "../../store";

import { viewAddress } from "../../common/utils";
import { useDialogAlert, useDialogForm } from "../../dialogs";
import { DialogEvent } from "../dialogs/DialogEvent";
import { DialogButtonClick } from "../../dialogs/types";
import gql from "graphql-tag";
import { useMutation } from "../../qraphql/request";
import { editorUpdate } from "../../store/editor";
import { EditorType } from "../../types";

const DivTools = styled.div`
  display: flex;
  justify-content: space-around;
  margin: 1em;
  padding: 0.5em;
  border-top: 1px dashed silver;
  border-bottom: 1px dashed silver;

  button {
    padding: 0.3em 0.8em;
    background-color: #f8f8f8;
    border: 0 none;
    cursor: pointer;
    border-radius: 0.3em;

    &:hover {
      box-shadow: 0 0 0.3em silver;
    }
  }
`;

const DivContent = styled.div`
  padding: 1em;
`;

const gqlNotesEventUpdate = gql`
  mutation NotesEvent($idn: Int!, $event: NoteEventInput!) {
    notesEvent(idn: $idn, event: $event)
  }
`;

interface MailDetailsNoteElemProps {
  signature: string;
  note?: MailNotesModel;
  group?: NotesGroupItem;
}

function DetailsViewNoteElement({ note, group, signature }: MailDetailsNoteElemProps) {
  const dispatch = useDispatch<AppDispatch>();

  function onEditNote() {
    if (!note) return;
    dispatch(
      editorUpdate({
        opened: true,
        editable: true,
        type: EditorType.note,
        // ===
        idn: note.idn,
        content: note.content,
      }),
    );
  }

  if (!note || !group) return null;
  return (
    <div>
      <h4 style={{ textAlign: "center" }}>
        {group.label} / {note.label}
      </h4>
      <DivTools>
        <button onClick={onEditNote}>редактировать</button>
        <NoteEvent note={note} signature={signature} />
      </DivTools>
      <DivContent dangerouslySetInnerHTML={{ __html: note.content }} />
    </div>
  );
}

export const DetailsViewNote = connect((state: StoreState) => {
  const { groups } = state.notes;
  let note: MailNotesModel | undefined;
  for (const { items } of groups.values()) {
    note = items.find(({ idn }) => idn === state.users.idn);
    if (note) break;
  }
  return {
    group: groups.get(note?.idp ?? -1),
    note,
    signature: state.users.signature,
  };
})(DetailsViewNoteElement);

const markerSubject = "[subject]";
const markerContentStart = "[content]";
const markerContentEnd = "[//content]";

function NoteEvent({ note, signature }: { note: MailNotesModel; signature: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const dlgForm = useDialogForm();
  const saveEvent = useMutation<{ idn: number; event?: MailNoteEvent; removeEvent?: boolean }, boolean>(
    gqlNotesEventUpdate,
  );
  const dlgAlert = useDialogAlert();

  function onEmail() {
    if (!note) return;
    const { subject, content } = getSubjectAndContent(note.content);
    dispatch(
      editorUpdate({
        opened: true,
        editable: true,
        type: EditorType.mail,
        // ===
        mailTo: viewAddress({ name: note.label, address: note.email }),
        subject,
        content: `${content}<p><br></p>${signature}`,
      }),
    );
  }

  async function onEventData(event: MailNoteEvent) {
    const { idn } = note;
    if (!(await saveEvent({ idn, event }))) {
      dlgAlert("Ошибка при сохранении события...");
    }
  }

  async function onEventRemove(next: DialogButtonClick) {
    await onEventData({} as MailNoteEvent);
    next.cancel();
  }

  function onEvent() {
    const { date, period, delta } = note.event;
    dlgForm({
      title: "Событие",
      Form: DialogEvent,
      props: { date, period, delta },
      result: onEventData,
      buttons: [
        { text: "Да", type: "confirm" },
        { text: "Отмена", type: "cancel" },
        { text: "удалить событие", title: "удалить событие", onClick: onEventRemove },
      ],
    });
  }

  async function onEventNext() {
    const { date, period, delta } = note.event;
    const d = new Date(date);
    switch (period) {
      case MailEventPeriod.day:
        d.setDate(d.getDate() + delta);
        break;
      case MailEventPeriod.month:
        d.setMonth(d.getMonth() + delta);
        break;
      case MailEventPeriod.year:
        d.setFullYear(d.getFullYear() + delta);
        break;
    }
    note.event.date = d.toJSON().substr(0, 10);
    await onEventData(note.event);
  }

  return (
    <>
      {note.email ? <button onClick={onEmail}>создать письмо</button> : null}
      {note.event.date ? (
        <button title="редактировать событие" onClick={onEvent}>
          {viewEvent(note.event.date)}
        </button>
      ) : (
        <button title="добавить событие" onClick={onEvent}>
          добавить событие
        </button>
      )}
      {note.event.date && note.event.period ? (
        <button title="выполнено" onClick={onEventNext}>
          +{note.event.delta} {MailEventPeriod[note.event.period]}
        </button>
      ) : null}
    </>
  );
}

function viewEvent(d: string) {
  const l = d.split("-");
  return `${l[2]}.${l[1]}.${l[0]}`;
}

function getSubjectAndContent(source: string) {
  let subject = "";
  const content = [] as string[];
  if (source) {
    let flagContent = false;
    const div = document.createElement("div");
    div.innerHTML = source;
    for (const node of [...div.childNodes]) {
      const text = node.textContent?.trim();
      if (text?.startsWith(markerSubject)) {
        subject = text.substr(markerSubject.length).trim();
      }

      if (text?.includes(markerContentEnd)) {
        flagContent = false;
      }
      if (flagContent && node.nodeType === 1) {
        content.push((node as HTMLElement).outerHTML);
      }
      if (text?.includes(markerContentStart)) {
        flagContent = true;
      }
    }
  }
  return { subject, content: content.join("") };
}
