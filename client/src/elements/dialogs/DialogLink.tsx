import { DivNotesBody } from "./style";
import { useCallback, useEffect, useRef } from "react";
import isNil from "lodash/isNil";
import { DialogFormContext } from "../../dialogs/types";

export interface DialogLinkProps {
  url: string;
  link: null | HTMLLinkElement;
}

export function DialogLink(param: DialogLinkProps & DialogFormContext<DialogLinkProps>) {
  const urlRef = useRef<HTMLInputElement>(null);

  param.check.current = useCallback(() => {
    const url = urlRef.current?.value.trim();
    if (isNil(url) || url === param.url) {
      return;
    }
    param.result({ url, link: param.link });
  }, [param, urlRef]);

  useEffect(() => {
    urlRef.current?.focus();
  });

  return (
    <DivNotesBody>
      <input
        name="url"
        title="адрес ссылки"
        placeholder="адрес ссылки"
        type="string"
        defaultValue={param.url}
        ref={urlRef}
      />
    </DivNotesBody>
  );
}
