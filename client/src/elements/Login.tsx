import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { StoreState } from "../store";
import { connect, useDispatch } from "react-redux";
import { userAuth, UsersState } from "../store/users";
import styled from "styled-components";
import { encrypt } from "../common/crypto";
import { LoginProps } from "../common/types";
import gql from "graphql-tag";
import { gqlRequest } from "../qraphql/request";
import { getUserState, testEmail } from "../common/utils";

const gqlLogin = gql`
  query Login($data: String!) {
    login(data: $data)
  }
`;

const gqlLoginTest = gql`
  query LoginTest {
    test
  }
`;

export const Login = connect((state: StoreState) => ({
  mailbox: state.users.mailbox,
}))(LoginElement);

function LoginElement({ mailbox }: Pick<UsersState, "mailbox">) {
  const [tested, setTested] = useState<boolean>(!getUserState());
  const dispatch = useDispatch();
  const init = useRef(async () => {
    if (mailbox) {
      const res = await gqlRequest<{ test: boolean }>(gqlLoginTest);
      if (res?.test) {
        dispatch(userAuth(true));
      } else {
        setTested(true);
      }
    } else {
      setTested(true);
    }
  });

  useEffect(() => {
    init.current();
  }, []);

  return tested ? <LoginForm mailbox={mailbox} /> : null;
}

const DivHost = styled.div`
  margin: 0;
  background-color: #f2f2f2;
  display: flex;
  flex-direction: column;
  height: 100vh;
  align-items: center;

  p {
    font-size: 2em;
    font-weight: bold;
    color: #999;
    pointer-events: none;
    margin-top: 30vh;
  }
`;

const DivContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 70vh;
`;

const Input = styled.input`
  font-size: 1.3em;
  margin: 0.3em;
  padding: 0.3em;
  border-radius: 0.2em;
  border: 0 none;
  width: 15em;
`;

const DivMessage = styled.div`
  font-size: 1.3em;
`;

const KeyEnter = "Enter";

type FormProps = Pick<UsersState, "mailbox">;

function LoginForm({ mailbox }: FormProps) {
  const [message, setMessage] = useState("");
  const refUser = useRef<HTMLInputElement>(null);
  const refPass = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch();

  async function onLogin() {
    const user = refUser.current?.value.trim();
    const pass = refPass.current?.value.trim();

    if (!user || !pass || !mailbox) return;
    const data = await encrypt(JSON.stringify({ mailbox, user, pass } as LoginProps));
    const res = await gqlRequest<{ login: boolean }>(gqlLogin, { data });
    if (res?.login) {
      dispatch(userAuth(true));
    } else {
      setMessage("...ошибка...");
    }
  }

  function onName(e: KeyboardEvent) {
    if (e.key === KeyEnter) {
      refPass.current?.focus();
    }
  }

  function onPass(e: KeyboardEvent) {
    if (e.key === KeyEnter) {
      onLogin().then();
    }
  }

  useEffect(() => {
    refUser.current?.focus();
  }, [refUser]);

  if (!testEmail(mailbox)) {
    return (
      <DivHost>
        <p>Сайт Почты России</p>
      </DivHost>
    );
  }

  return (
    <DivHost>
      <DivContainer>
        <Input placeholder="Имя" title="Имя" ref={refUser} onKeyDown={onName} />
        <Input placeholder="Пароль" title="Пароль" ref={refPass} onKeyDown={onPass} />
        <DivMessage>{message}</DivMessage>
      </DivContainer>
    </DivHost>
  );
}
