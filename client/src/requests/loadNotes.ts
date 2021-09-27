import gql from "graphql-tag";
import { MailNotesModel } from "../common/types";
import { AppDispatch } from "../store";
import { gqlRequest } from "../qraphql/request";
import { actionNotesInit } from "../store/notes";
import { initMailUser } from "../store/users";

const gqlNotes = gql`
  query Notes {
    notes {
      idn
      idp
      label
      position
      email
      content
      event {
        date
        delta
        period
      }
    }
  }
`;

const gqlUser = gql`
  query User {
    user {
      prefix
      signature
    }
  }
`;

export async function loadNotes(dispatch: AppDispatch) {
  const resultNotes = await gqlRequest<{ notes: MailNotesModel[] }>(gqlNotes);
  const resultUser = await gqlRequest<{ user: { prefix: string; signature: string } }>(gqlUser);
  if (resultNotes && resultUser) {
    dispatch(actionNotesInit(resultNotes.notes));
    dispatch(initMailUser(resultUser.user));
  }
}
