import { FastifyRequest } from "fastify";
import { MercuriusContext } from "mercurius";

interface FastifyRequestContext {
  idu: number;
  userState: string;
  close: () => void;
}

interface FastifyRequestExt extends FastifyRequest {
  __my_context: FastifyRequestContext;
}

export function setUserData(request: FastifyRequest, props: Partial<FastifyRequestContext>) {
  const context = (request as FastifyRequestExt)?.__my_context ?? {};
  (request as FastifyRequestExt).__my_context = { ...context, ...props };
}

export function getUserDataFromContext(context: MercuriusContext): Partial<FastifyRequestContext> | null {
  return getUserData(context.reply.request);
}

export function getUserData(request: FastifyRequest): Partial<FastifyRequestContext> | null {
  return (request as FastifyRequestExt).__my_context;
}
