import styled from "styled-components";
import { MailNotesModel, NoteRemove } from "../../common/types";
import { useLongClick } from "../../hooks/useLongClick";
import { useRef } from "react";
import { useDialogConfirm, useDialogForm } from "../../dialogs";
import { DialogItem, DialogItemReturns } from "../dialogs/DialogItem";
import isNil from "lodash/isNil";
import { connect, useDispatch } from "react-redux";
import { AppDispatch, StoreState } from "../../store";
import { NotesState } from "../../store/notes";
import gql from "graphql-tag";
import { useMutation } from "../../qraphql/request";
import { ButtonStyled } from "./styles";
import { mailNoteChoice } from "../../store/users";

const UlItems = styled.ul`
  margin: 0.3em 0;
`;

export function NotesItems({ items }: { items?: MailNotesModel[] }) {
  if (!items) return null;

  return (
    <UlItems>
      {items.map((row) => (
        <NotesItem data={row} max={items.length} key={row.idn} />
      ))}
    </UlItems>
  );
}

// ==================

const SpanItem = styled.span<{ selected: boolean }>`
  cursor: pointer;
  padding-right: 0.4em;

  text-decoration: ${({ selected }) => (selected ? "underline" : "none")};
  color: ${({ selected }) => (selected ? "mediumblue" : "inherit")};

  &:hover {
    background-color: #e1e1e1;
  }
`;

const ItemEmail = styled.i`
  display: inline-block;
  margin-left: 0.5em;
`;

const gqlItemUpdate = gql`
  mutation NotesItem($idn: Int!, $label: String, $position: Int, $email: String, $idp: Int, $remove: Boolean) {
    notesItem(idn: $idn, label: $label, position: $position, email: $email, idp: $idp, remove: $remove)
  }
`;

const NotesItem = connect((state: StoreState, props: { data: MailNotesModel }) => {
  const { groups } = state.notes;
  const selected = state.users.idn === props.data.idn;
  return { groups, selected };
})(NotesItemElement);

type NotesItemProps = { data: MailNotesModel; max: number } & Pick<NotesState, "groups">;

type ItemProps = Pick<MailNotesModel, "idn" | "label" | "position" | "email" | "idp">;

function NotesItemElement({ data, max, groups, selected }: NotesItemProps & { selected: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const dlgForm = useDialogForm();
  const dlgConfirm = useDialogConfirm();
  const updateItem = useMutation<Pick<ItemProps, "idn"> & Partial<ItemProps & NoteRemove>, boolean>(gqlItemUpdate);

  async function onResult({ label, email, idp, position }: DialogItemReturns) {
    if (isNil(label)) return;
    if (label || email) {
      await updateItem({ idn: data.idn, position, label, email, idp });
    } else {
      if (await dlgConfirm(`Удалить элемент "${data.label} ${data.email}"?`)) {
        await updateItem({ idn: data.idn, remove: true });
      }
    }
  }

  function handleClick() {
    dispatch(mailNoteChoice(data.idn));
  }

  function openDialog() {
    dlgForm({
      title: "Свойства элемента",
      Form: DialogItem,
      props: {
        label: data.label,
        email: data.email,
        idp: data.idp,
        position: data.position,
        max,
        groups,
      },
      result: onResult,
    });
  }

  const ref = useLongClick(openDialog, useRef<HTMLElement>(null));

  return (
    <li>
      <SpanItem onClick={handleClick} selected={selected} ref={ref}>
        <span>{data.label}</span>
        <ItemEmail>{data.email}</ItemEmail>
      </SpanItem>
    </li>
  );
}

export function CreateItem({ groups }: Pick<NotesState, "groups">) {
  const dlgForm = useDialogForm();
  const createItem = useMutation<ItemProps, boolean>(gqlItemUpdate);

  function onResult({ label, email, idp, position }: DialogItemReturns) {
    createItem({ idn: 0, position, label, email, idp }).then();
  }

  function handleClick() {
    const list = [...groups.values()];
    const idp = list.length && list[0] ? list[0].idn : 0;
    if (!idp) return;
    dlgForm({
      title: "Новый элемент",
      Form: DialogItem,
      props: {
        label: "",
        email: "",
        idp,
        position: 1,
        max: 0,
        groups,
      },
      result: onResult,
    });
  }

  return <ButtonStyled onClick={handleClick}>создать заметку</ButtonStyled>;
}
