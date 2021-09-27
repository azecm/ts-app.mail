import { NotesState } from "../../store/notes";
import styled from "styled-components";
import { CreateGroup, NotesGroup } from "./NotesGroup";
import { CreateItem } from "./NotesItems";

const DivHeader = styled.div`
  margin: 1em;
`;

const DivBody = styled.div`
  margin-left: 2em;
  // ====
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  //-moz-user-select: -moz-none;
  -ms-user-select: none;
  user-select: none;
  outline-style: none;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
`;

export function NotesView({ groups }: Pick<NotesState, "groups">) {
  return (
    <>
      <DivHeader>
        <CreateGroup max={groups.size + 1} />
        <CreateItem groups={groups} />
      </DivHeader>
      <DivBody>
        {[...groups.values()].map((row) => (
          <NotesGroup groupItem={row} groups={groups} key={row.idn} />
        ))}
      </DivBody>
    </>
  );
}
