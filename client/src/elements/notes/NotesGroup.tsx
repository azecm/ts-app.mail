import { NotesState } from "../../store/notes";
import { NoteGroup, NoteRemove, NotesGroupItem } from "../../common/types";
import styled from "styled-components";
import { NotesItems } from "./NotesItems";
import { useDialogConfirm, useDialogForm } from "../../dialogs";
import { useLongClick } from "../../hooks/useLongClick";
import { useRef } from "react";
import { DialogGroup, DialogGroupReturns } from "../dialogs/DialogGroup";
import gql from "graphql-tag";
import { useMutation } from "../../qraphql/request";
import { ButtonStyled } from "./styles";

const gqlGroupUpdate = gql`
  mutation NotesGroup($idn: Int!, $label: String, $position: Int, $remove: Boolean) {
    notesGroup(idn: $idn, label: $label, position: $position, remove: $remove)
  }
`;

const SpanGroup = styled.span`
  cursor: pointer;
  padding-right: 0.5em;

  &:hover {
    background-color: #e1e1e1;
  }
`;

type Props = Pick<NotesState, "groups"> & {
  groupItem: NotesGroupItem;
};

export function NotesGroup({ groups, groupItem }: Props) {
  const dlgForm = useDialogForm();
  const dlgConfirm = useDialogConfirm();
  const updateGroup = useMutation<Pick<NoteGroup, "idn"> & Partial<NoteGroup & NoteRemove>, boolean>(gqlGroupUpdate);

  async function onResult({ label, position }: DialogGroupReturns) {
    if (label === null) return;
    if (label) {
      await updateGroup({ idn: groupItem.idn, position, label });
    } else {
      if (await dlgConfirm(`Удалить группу "${groupItem.label}"?`)) {
        await updateGroup({ idn: groupItem.idn, remove: true });
      }
    }
  }

  function openDialog() {
    dlgForm({
      title: "Свойства группы",
      Form: DialogGroup,
      props: { label: groupItem.label, position: groupItem.position, max: groups.size },
      result: onResult,
    });
  }

  const ref = useLongClick(openDialog, useRef<HTMLElement>(null));

  return (
    <details>
      <summary>
        <SpanGroup ref={ref}>{groupItem.label}</SpanGroup>
      </summary>
      <NotesItems items={groups.get(groupItem.idn)?.items} />
    </details>
  );
}

export function CreateGroup({ max }: { max: number }) {
  const dlgForm = useDialogForm();
  const createGroup = useMutation<NoteGroup, boolean>(gqlGroupUpdate);

  function onResult({ label, position }: DialogGroupReturns) {
    createGroup({ idn: 0, position, label }).then();
  }

  function handleClick() {
    dlgForm({
      title: "Новая группа",
      Form: DialogGroup,
      props: { label: "", position: max, max },
      result: onResult,
    });
  }

  return <ButtonStyled onClick={handleClick}>создать группу</ButtonStyled>;
}
