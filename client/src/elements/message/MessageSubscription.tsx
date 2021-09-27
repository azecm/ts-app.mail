import { useDispatch, useSelector } from "react-redux";
import { useSubscriptionFn } from "../../qraphql/subscription";
import { SubMessageUpdated } from "../../common/constants";
import { MailBoxModel } from "../../common/types";
import gql from "graphql-tag";
import { messageUpdated } from "../../store/boxes";
import { StoreState } from "../../store";

const gqlMessageSubscription = gql`
  subscription MessageUpdated($email: String) {
    messageUpdated(email: $email) {
      attachments {
        key
        list {
          fileName
          id
          size
        }
      }
      idb
      box
      date
      content
      subject
      unread
      sender {
        address
        name
      }
      recipient {
        address
        name
      }
    }
  }
`;

export function MessageSubscription() {
  const email = useSelector((state: StoreState) => state.users.mailbox);
  const dispatch = useDispatch();

  type Result = { [SubMessageUpdated]: MailBoxModel };

  function result(data: Result | null) {
    if (!data) return;
    dispatch(messageUpdated(data[SubMessageUpdated]));
  }

  useSubscriptionFn<Result>(gqlMessageSubscription, result, { email });

  return null;
}
