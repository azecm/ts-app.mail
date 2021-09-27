import { DocumentNode, print } from "graphql";
import { useCallback, useEffect, useRef, useState } from "react";
import { headerUserKey, headerUserState } from "../common/constants";
import { getUrlHost, getUserState, setUserState, toBase64 } from "../common/utils";

export const userKey = { current: "" };
export const userEmail = { current: "" };

export function useMutation<Props extends Record<string, unknown>, Result>(docNode: DocumentNode) {
  const mounted = useRef(true);
  const next = useCallback(
    (variables?: Props) => {
      return new Promise<Result | null>((resolve) => {
        gqlRequest<Result>(docNode, variables).then((data) => {
          if (mounted.current) {
            resolve(data);
          }
        });
      });
    },
    [docNode],
  );

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  return next;
}

export function useQuery<T>(docNode: DocumentNode, variables?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    gqlRequest<T>(docNode, variables).then((data) => {
      setData(data);
    });
  }, [docNode, variables]);

  return data;
}

interface GqlRequestResult<T> {
  data: T;
  errors: { message: string }[];
}

export function gqlRequest<T>(docNode: DocumentNode, variables?: Record<string, unknown>): Promise<T | null> {
  return new Promise((resolve) => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const userState = getUserState();
    if (userState) {
      headers.append(headerUserState, userState);
    }
    headers.append(headerUserKey, userKey.current);
    const method = "post";
    const body = JSON.stringify({ query: print(docNode), variables });

    fetch(`${getUrlHost()}graphql`, { headers, method, body })
      .then(async (d) => {
        const { data, errors } = (await d.json()) as GqlRequestResult<T>;
        const state = d.headers.get(headerUserState);
        if (state) {
          setUserState(state);
          console.log("state::UPDATED");
        }
        if (errors) {
          resolve(null);
        } else {
          resolve(data);
        }
      })
      .catch(() => {
        resolve(null);
      });
  });
}

// ========

const browserKey =
  [
    window.devicePixelRatio || 0,
    window.screen.pixelDepth || 0,
    window.screen.width || 0,
    window.screen.height || 0,
    navigator.maxTouchPoints || 0,
  ]
    .sort((a, b) => a - b)
    .join("-") +
  navigator.appCodeName +
  navigator.appName +
  navigator.platform +
  navigator.product +
  navigator.vendor +
  navigator.vendorSub +
  navigator.language +
  navigator.languages.join("-") +
  navigator.plugins.length;

(async () => {
  const h = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(browserKey));
  userKey.current = toBase64(h);
})();
