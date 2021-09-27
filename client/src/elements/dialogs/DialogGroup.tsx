import { DivNotesBody } from "./style";
import { useRef } from "react";
import { useFormInput } from "../../hooks/useFormInput";
import { DialogFormContext } from "../../dialogs/types";

export interface DialogGroupReturns {
  label: string;
  position: number;
}

export interface DialogGroupProps {
  label: string;
  position: number;
  max: number;
}

export function DialogGroup(data: DialogGroupProps & DialogFormContext<DialogGroupReturns>) {
  const form = useRef({ label: data.label, position: data.position });
  const onInput = useFormInput(form);

  data.check.current = () => {
    let { label, position } = form.current;
    position = Math.round(+position);
    position = position > data.max ? data.max : position < 1 ? 1 : position;
    label = label.trim();
    if (position === data.position && label === data.label) {
      return;
    }
    data.result({ label, position });
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
    </DivNotesBody>
  );
}
