import { memo } from "react";
import { connect } from "react-redux";
import { NotesView } from "./NotesView";
import { StoreState } from "../../store";

const Notes = memo(
  connect((state: StoreState) => ({
    groups: state.notes.groups,
  }))(NotesView),
);

export default Notes;
