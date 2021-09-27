import { DivNotesBody } from "./style";
import { NotesGroupItem } from "../../common/types";
import { useRef } from "react";
import { DialogFormContext } from "../../dialogs/types";
import { useFormInput } from "../../hooks/useFormInput";

export interface DialogItemReturns {
  label: string;
  email: string;
  position: number;
  idp: number;
}

export interface DialogItemProps {
  label: string;
  email: string;
  position: number;
  idp: number;
  max: number;
  groups: Map<number, NotesGroupItem>;
}

export function DialogItem(data: DialogItemProps & DialogFormContext<DialogItemReturns>) {
  const form = useRef({
    label: data.label,
    email: data.email,
    position: data.position,
    idp: data.idp,
  });
  const onInput = useFormInput(form);

  data.check.current = () => {
    let { label, email, position, idp } = form.current;
    label = label.trim();
    email = email.trim();
    idp = +idp;
    position = +(position || data.position);

    if (label === data.label && email === data.email && position === data.position && idp === data.idp) {
      return;
    }

    data.result({ label, email, position, idp });
  };

  return (
    <DivNotesBody>
      <div>
        <input
          title="Наименование"
          placeholder="Наименование"
          name="label"
          onInput={onInput}
          defaultValue={data.label}
          maxLength={50}
          type="string"
        />
      </div>
      <div>
        <input
          title="Email"
          placeholder="Email"
          name="email"
          onInput={onInput}
          defaultValue={data.email}
          maxLength={50}
          type="email"
        />
      </div>
      {data.max ? (
        <div>
          <input
            title="Порядковый номер"
            placeholder="Порядковый номер"
            name="position"
            onInput={onInput}
            defaultValue={data.position}
            type="number"
            step="1"
            min="1"
            max={data.max}
          />
        </div>
      ) : null}
      <div>
        <select defaultValue={data.idp} name="idp" onInput={onInput} title="Группа">
          {[...data.groups.values()].map((row) => (
            <option key={row.idn} value={row.idn}>
              {row.label}
            </option>
          ))}
        </select>
      </div>
    </DivNotesBody>
  );
}
