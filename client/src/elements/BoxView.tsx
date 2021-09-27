import { MailBoxes, MailBoxType } from "../common/types";
import { useCallback, useEffect } from "react";
import { connect } from "react-redux";
import { AppDispatchProp, StoreState } from "../store";
import { MailBoxItem } from "../store/boxes";
import { UsersState } from "../store/users";
import { MessageView } from "./message/MessageView";
import { loadBoxPage } from "../requests/loadBoxPage";

type BoxViewProps = Pick<UsersState, "box"> & MailBoxItem & AppDispatchProp;

export const BoxView = connect((state: StoreState) => {
  const { box } = state.users;
  return { box, ...state.boxes[MailBoxes[box] as MailBoxType] };
})(BoxViewElement);

function BoxViewElement({ box: currentBox, page, initialized, dispatch, items }: BoxViewProps) {
  const load = useCallback(async () => {
    await loadBoxPage(currentBox, page, dispatch);
  }, [currentBox, dispatch, page]);
  useEffect(() => {
    if (initialized) return;
    load().then();
  }, [initialized, load]);

  if (!items.size) return null;
  return (
    <div>
      {[...items.values()].map((row) => (
        <MessageView dispatch={dispatch} {...row} key={row.idb.toString()} />
      ))}
    </div>
  );
}
