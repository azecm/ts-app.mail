import ReactDOM from "react-dom";
import { StrictMode } from "react";
import { Provider } from "react-redux";
import { SubscriptionClient } from "graphql-subscriptions-client";
import { SubscriptionProvider } from "./qraphql/subscription";
import { Main } from "./elements/Main";
import { store } from "./store";
import { DialogProvider } from "./dialogs";
import { GlobalStyle } from "./style";

const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const client = new SubscriptionClient(`${protocol}//${location.host}/graphql`, { reconnect: true, lazy: true });

const div = document.body.appendChild(document.createElement("div"));
div.id = "root";

ReactDOM.render(
  <StrictMode>
    <Provider store={store}>
      <DialogProvider>
        <SubscriptionProvider client={client}>
          <GlobalStyle />
          <Main />
        </SubscriptionProvider>
      </DialogProvider>
    </Provider>
  </StrictMode>,
  div,
);
