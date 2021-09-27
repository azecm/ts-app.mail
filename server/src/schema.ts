import { IResolvers } from "mercurius";
import gql from "graphql-tag";
import { buildASTSchema, GraphQLScalarType, Kind } from "graphql";
import { dbBoxLoad, DbLoadProps, dbMessage, dbToNotes } from "./db-boxes";
import {
  MailNotesModel,
  MessageForwardProps,
  MessageOperationProps,
  MessageSendProps,
  NoteGroup,
  NoteRemove,
} from "../../client/src/common/types";
import { SubMessageUpdated, SubNotesGroupUpdated, SubNotesItemUpdated } from "../../client/src/common/constants";
import { dbNotes, dbNotesUpdate } from "./db-notes";
import { dbLogin, dbUser, dbUserEmail } from "./db-users";
import { getUserDataFromContext } from "./user-params";
import { appPubSub, SUB_MESSAGE_UPDATE, SUB_NOTES_GROUP_UPDATE, SUB_NOTES_ITEM_UPDATE } from "./constants";
import { getSender, messageSend } from "./message/create";
import { messageForward } from "./message/forward";
import { getHeaders } from "./utils";
import { sendEmail } from "./process/send-email";

const bigIntScalar = require("graphql-bigint");

// https://graphql.org/learn/authorization/

const dateTimeScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value) {
    return value.getTime();
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null; // Invalid hard-coded value (not an integer)
  },
});

export const resolvers: IResolvers = {
  DateTime: dateTimeScalar,
  BigInt: bigIntScalar,

  Query: {
    test: async (_, __, context) => {
      return !!getUserDataFromContext(context)?.idu;
    },
    login: async (_, { data }: { data: string }, context) => {
      const { request } = context.reply;
      const { ip, browser, userKey } = getHeaders(request);

      const result =
        userKey && browser && ip
          ? await dbLogin(request, data, {
              ip,
              browser,
              key: userKey,
            })
          : null;

      return !!result;
    },
    load: async (_, { box, page }: DbLoadProps, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return;
      return await dbBoxLoad({ box, page, idu });
    },
    notes: async (_, __, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return;
      return await dbNotes({ idu });
    },
    user: async (_, __, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return;
      if (!appPubSub.current) {
        appPubSub.current = context.pubsub;
      }
      return await dbUser({ idu });
    },
    messageForward: async (_, props: MessageForwardProps, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return null;
      return await messageForward({ ...props, idu });
    },
  },
  Mutation: {
    notesGroup: async (_, props: NoteGroup & NoteRemove, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return false;
      await context.pubsub.publish({
        topic: SUB_NOTES_GROUP_UPDATE(await dbUserEmail(idu)),
        payload: {
          [SubNotesGroupUpdated]: await dbNotesUpdate({ ...props, idu }),
        },
      });
      return true;
    },
    notesItem: async (_, props: MailNotesModel & NoteRemove, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return false;
      await context.pubsub.publish({
        topic: SUB_NOTES_ITEM_UPDATE(await dbUserEmail(idu)),
        payload: {
          [SubNotesItemUpdated]: await dbNotesUpdate({ ...props, idu }),
        },
      });
      return true;
    },
    notesEvent: async (_, props: Pick<MailNotesModel, "idn" | "event">, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return false;
      await context.pubsub.publish({
        topic: SUB_NOTES_ITEM_UPDATE(await dbUserEmail(idu)),
        payload: {
          [SubNotesItemUpdated]: await dbNotesUpdate({ ...props, idu }),
        },
      });
      return true;
    },
    notesContent: async (_, props: Pick<MailNotesModel, "idn" | "content">, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return false;
      await context.pubsub.publish({
        topic: SUB_NOTES_ITEM_UPDATE(await dbUserEmail(idu)),
        payload: {
          [SubNotesItemUpdated]: await dbNotesUpdate({ ...props, idu }),
        },
      });
      return true;
    },

    messageSave: async (_, props: { idb: bigint }, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return false;
      const res = await dbToNotes({ ...props, idu });
      if (!res) return false;
      await context.pubsub.publish({
        topic: SUB_NOTES_ITEM_UPDATE(await dbUserEmail(idu)),
        payload: {
          [SubNotesItemUpdated]: [res],
        },
      });
      return true;
    },

    message: async (_, props: MessageOperationProps, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return false;
      const res = await dbMessage({ ...props, idu });

      if (res) {
        await context.pubsub.publish({
          topic: SUB_MESSAGE_UPDATE(await dbUserEmail(idu)),
          payload: {
            [SubMessageUpdated]: res,
          },
        });
      }

      return !!res;
    },

    messageSend: async (_, props: MessageSendProps, context) => {
      const idu = getUserDataFromContext(context)?.idu;
      if (!idu) return false;

      const sender = await getSender(idu);
      if (!sender) return false;

      if (await sendEmail({ ...props, sender })) {
        const res = await messageSend({ ...props, sender, idu });

        if (res) {
          await context.pubsub.publish({
            topic: SUB_MESSAGE_UPDATE(await dbUserEmail(idu)),
            payload: {
              [SubMessageUpdated]: res,
            },
          });
          return true;
        }
      }

      return false;
    },
  },

  Subscription: {
    [SubNotesGroupUpdated]: {
      subscribe: async (root, { email }: { email: string }, { pubsub }) => {
        return await pubsub.subscribe(SUB_NOTES_GROUP_UPDATE(email));
      },
    },
    [SubNotesItemUpdated]: {
      subscribe: async (root, { email }: { email: string }, { pubsub }) => {
        return await pubsub.subscribe(SUB_NOTES_ITEM_UPDATE(email));
      },
    },
    [SubMessageUpdated]: {
      subscribe: async (root, { email }: { email: string }, { pubsub }) => {
        return await pubsub.subscribe(SUB_MESSAGE_UPDATE(email));
      },
    },
  },
};

export const schema = buildASTSchema(gql`
  scalar DateTime
  scalar BigInt

  type Query {
    load(box: Int, page: Int): [Message]
    notes: [Notes]
    user: UserInit
    login(data: String): Boolean
    test: Boolean
    messageForward(idb: BigInt): Attachments
  }

  type Mutation {
    notesGroup(idn: Int, remove: Boolean, label: String, position: Int): Boolean
    notesItem(idn: Int, remove: Boolean, label: String, position: Int, email: String, idp: Int): Boolean
    notesEvent(idn: Int, event: NoteEventInput): Boolean
    notesContent(idn: Int, content: String): Boolean
    messageSave(idb: BigInt): Boolean
    message(idb: BigInt, operation: MessageOperation, box: Int): Boolean
    messageSend(subject: String, content: String, recipient: MailAddressInput, attachments: AttachmentsInput): Boolean
  }

  type Subscription {
    notesGroupUpdated(email: String): [Notes]
    notesItemUpdated(email: String): [Notes]
    messageUpdated(email: String): Message
  }

  # =============

  enum MessageOperation {
    unread
    read
    move
  }

  type UserInit {
    prefix: String
    signature: String
  }

  input MailAddressInput {
    name: String
    address: String
  }

  type MailAddress {
    name: String
    address: String
  }

  input AttachmentItemInput {
    id: Int
    fileName: String
    size: Int
  }

  type AttachmentItem {
    id: Int
    fileName: String
    size: Int
  }

  input AttachmentsInput {
    key: String
    list: [AttachmentItemInput]
  }

  type Attachments {
    key: String
    list: [AttachmentItem]
  }

  type Message {
    idb: BigInt
    box: Int
    date: DateTime
    sender: MailAddress
    recipient: MailAddress
    unread: Boolean
    subject: String
    content: String
    attachments: Attachments
  }

  # =============

  input NoteEventInput {
    date: String
    delta: Int
    period: Int
  }

  type NoteEvent {
    date: String
    delta: Int
    period: Int
  }

  type Notes {
    idn: Int
    idp: Int
    position: Int

    label: String
    email: String

    content: String
    event: NoteEvent

    remove: Boolean
  }
`);
