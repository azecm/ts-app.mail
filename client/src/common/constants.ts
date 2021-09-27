import gql from "graphql-tag";

export const SubNotesGroupUpdated = "notesGroupUpdated" as const;
export const SubNotesItemUpdated = "notesItemUpdated" as const;
export const SubMessageUpdated = "messageUpdated" as const;

export const headerUserState = "user-state";
export const headerUserKey = "user-key";

export const gqlMessageOperation = gql`
  mutation Message($idb: BigInt!, $operation: MessageOperation!, $box: Int) {
    message(idb: $idb, operation: $operation, box: $box)
  }
`;
