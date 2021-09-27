import { SubscriptionClient } from "graphql-subscriptions-client";
import { createContext, ReactNode, useContext, useEffect } from "react";
import { DocumentNode, print } from "graphql";

interface SubscriptionContext {
  client: SubscriptionClient;
}

const SubContext = createContext<SubscriptionContext>({} as SubscriptionContext);

interface ProviderProps {
  client: SubscriptionClient;
  children: ReactNode;
}

export function SubscriptionProvider({ children, client }: ProviderProps) {
  return <SubContext.Provider value={{ client }}>{children}</SubContext.Provider>;
}

export function useSubscriptionFn<T>(
  docNode: DocumentNode,
  call: (data: T | null) => void,
  variables?: Record<string, unknown>,
) {
  const { client } = useContext(SubContext);

  const query = print(docNode);
  const subscription = client.request({ query, variables }).subscribe({
    next({ data }: { data: T }) {
      call(data || null);
    },
  });

  useEffect(() => {
    return () => {
      subscription.unsubscribe();
    };
  }, [subscription]);
}

/*
export function useSubscription<T>(docNode: DocumentNode, variables?: Record<string, unknown>) {
  const { client } = useContext(SubContext);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const query = print(docNode);
    const subscription = client.request({ query, variables }).subscribe({
      next({ data }: { data: any }) {
        if (data) {
          setData(data);
          setError(false);
        } else {
          setData(null);
          setError(true);
        }
      },
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [client, docNode, variables]);

  return { data, error };
}
*/
