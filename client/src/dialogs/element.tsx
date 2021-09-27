import styled from "styled-components";
import { FunctionComponent, MouseEvent, useContext, useMemo } from "react";
import type { DialogParam } from "./types";
import constants from "./constants";
import { DialogContext } from "./context";

const DivBack = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(20, 20, 20, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DivContainer = styled.div`
  background-color: #f2f2f2;
  border-radius: 0.3em;
  border: 1px solid #edf2f4;
  min-width: 15em;
  padding-left: 0.8em;
  padding-right: 0.8em;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;

  &.with-max {
    max-width: 25em;
  }
`;

const DivHeader = styled.div`
  text-align: center;
  font-weight: bold;
  margin-top: 0.5em;
  font-size: 1.1em;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif, Apple Color Emoji,
    Segoe UI Emoji, Segoe UI Symbol;
  pointer-events: none;
  user-select: none;
  color: #555;
`;

const DivBody = styled.div`
  margin-top: 1em;
  margin-bottom: 1em;
  display: flex;
  justify-content: center;
  align-items: center;

  input,
  select,
  textarea {
    box-sizing: border-box;
  }
`;

const DivFooter = styled.div`
  margin-bottom: 0.5em;
  display: flex;
  justify-content: center;
  align-items: center;

  button {
    border-radius: 0.5em;
    cursor: pointer;
    margin: 0 0.5em;
    padding: 0.3em 1em;

    color: inherit;
    min-width: 5em;
    outline: 0 none;
    transition-duration: 0.2s;
    transition-timing-function: ease-in-out;
    transition-property: color, box-shadow, text-shadow, background-color, border-color;

    &:not([aria-label]) {
      background-color: #f1f1f1;
      border: 1px solid #acacac;
      &:hover {
        box-shadow: white 0 0 0.5em;
        background-color: #cdcdcd;
        color: #535353;
      }
    }

    &[aria-label="cancel"] {
      border: 0 none;
      color: #fff;
      background-color: #78909c;

      &:hover {
        background-color: #546e7a;
        box-shadow: 0 0 0.2em black;
      }
    }

    &[aria-label="confirm"] {
      border: 0 none;
      color: white;
      background-color: #4285f4;

      &:hover {
        background-color: #0d47a1;
        box-shadow: 0 0 0.2em black;
      }
    }
  }
`;

const btnConfirm = "confirm";
const btnCancel = "cancel";
const btnCancelText = "Нет";
const btnConfirmText = "Да";

function DialogElement(props: DialogParam<any>) {
  const { addItem } = useContext(DialogContext);

  const buttons = props.buttons || [];
  let Form = props.Form || ((() => null) as FunctionComponent<any>);

  const { styleBackLeft } = props;
  const handleClose = (isConfirm?: boolean) => {
    addItem((items) => items.filter(({ id }) => id !== props.id));
    if (props.close) props.close();
    if (!isConfirm && props.onCancel) props.onCancel();
  };

  const onConfirm = () => {
    const res = props?.check?.current();
    if (typeof res == "boolean" && !res) return;
    handleClose(true);
    if (props.onConfirm) props.onConfirm();
  };

  const onCancel = () => {
    handleClose();
  };

  const handleBack = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !props.disableBackClose) {
      handleClose();
    }
  };

  let flagContainerMax = false;

  switch (props.type) {
    case constants.typeAlert:
      flagContainerMax = true;
      if (props.message) {
        Form =
          typeof props.message == "string"
            ? () => <div dangerouslySetInnerHTML={{ __html: props.message as string }} />
            : props.message;
      }

      if (!buttons.length) {
        buttons.push({ text: btnConfirmText, type: btnConfirm });
      }
      break;
    case constants.typeConfirm:
      if (props.message) {
        Form =
          typeof props.message == "string"
            ? () => <div dangerouslySetInnerHTML={{ __html: props.message as string }} />
            : props.message;
      }

      if (!buttons.length) {
        buttons.push(
          { text: btnConfirmText, type: btnConfirm },
          {
            text: btnCancelText,
            type: btnCancel,
          },
        );
      }
      break;
    case constants.typeForm:
      if (!buttons.length) {
        buttons.push(
          { text: btnConfirmText, type: btnConfirm },
          {
            text: btnCancelText,
            type: btnCancel,
          },
        );
      }
      break;
  }

  const { result, check } = props;
  const formProps = useMemo(() => ({ ...props.props, result, check }), [props.props, check, result]);

  const Buttons = buttons.map((row, ind) => {
    let onClick: () => void;
    switch (row.type) {
      case btnCancel:
        onClick = onCancel;
        break;
      case btnConfirm:
        onClick = onConfirm;
        break;
      default:
        onClick = () => {
          if (row.onClick) row.onClick({ confirm: onConfirm, cancel: onCancel });
        };
        break;
    }
    return (
      <button key={ind} onClick={onClick} title={row.title} aria-label={row.type}>
        {row.text}
      </button>
    );
  });

  return (
    <DivBack onClick={handleBack} style={{ left: styleBackLeft ? `${styleBackLeft}px` : void 0 }}>
      <DivContainer className={flagContainerMax ? "with-max" : void 0}>
        {props.title ? <DivHeader>{props.title}</DivHeader> : null}
        <DivBody>
          <Form {...formProps} />
        </DivBody>
        <DivFooter>{Buttons}</DivFooter>
      </DivContainer>
    </DivBack>
  );
}

export default DialogElement;
