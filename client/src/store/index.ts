import { combineReducers, createStore } from "redux";
import { Dispatch } from "react";
import { BoxesActions, boxesReducer, BoxesState } from "./boxes";
import { UsersActions, usersReducer, UsersState } from "./users";
import { NotesActions, notesReducer, NotesState } from "./notes";
import { EditorActions, editorReducer, EditorState } from "./editor";

export const store = createStore(
  combineReducers({ boxes: boxesReducer, users: usersReducer, notes: notesReducer, editor: editorReducer }),
);
export type Store = typeof store;
export type StoreState = {
  boxes: BoxesState;
  users: UsersState;
  notes: NotesState;
  editor: EditorState;
};

export type AppDispatch = Dispatch<UsersActions | BoxesActions | NotesActions | EditorActions>;
export type AppDispatchProp = { dispatch: AppDispatch };
