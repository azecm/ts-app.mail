import { gqlRequest } from "../qraphql/request";
import { MailBoxes, MailBoxModel } from "../common/types";
import { mailBoxLoaded } from "../store/boxes";
import gql from "graphql-tag";
import { AppDispatch } from "../store";

const gqlBox = gql`
  query Load($box: Int!, $page: Int!) {
    load(box: $box, page: $page) {
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

export async function loadBoxPage(currentBox: MailBoxes, page: number, dispatch: AppDispatch) {
  const result = await gqlRequest<{ load: MailBoxModel[] }>(gqlBox, { box: currentBox, page });
  if (result) {
    dispatch(mailBoxLoaded(currentBox, (page || 0) + 1, result.load));
  }
}
