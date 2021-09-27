import { MailEventPeriod, MailNoteEvent } from "../../common/types";
import { DialogFormContext } from "../../dialogs/types";
import { useRef } from "react";
import { useFormInput } from "../../hooks/useFormInput";
import { DivNotesBody } from "./style";

const defaultDate = new Date().toJSON().substr(0, 10);
const defaultPeriod = MailEventPeriod[MailEventPeriod.month] as "day" | "month" | "year";

export function DialogEvent(props: MailNoteEvent & DialogFormContext<MailNoteEvent>) {
  const form = useRef({
    date: props.date || defaultDate,
    delta: props.delta || 1,
    period: MailEventPeriod[props.period] || defaultPeriod,
  });
  const onInput = useFormInput(form);

  props.check.current = () => {
    const { date, ...rest } = form.current;
    const delta = +rest.delta;
    const period = MailEventPeriod[rest.period as "day" | "month" | "year"];
    if (date === props.date && delta === props.delta && period === props.period) {
      return;
    }
    props.result({ date, delta, period });
  };

  return (
    <DivNotesBody>
      <div>
        <input
          type="date"
          placeholder="дата"
          title="дата"
          name="date"
          defaultValue={props.date || defaultDate}
          onInput={onInput}
        />
      </div>
      <div>
        <input
          type="number"
          min="1"
          step="1"
          placeholder="период (интервал)"
          title="период (интервал)"
          name="delta"
          defaultValue={props.delta || 1}
          onInput={onInput}
        />
      </div>
      <div>
        <select
          title="период (вид)"
          name="period"
          defaultValue={MailEventPeriod[props.period] || defaultPeriod}
          onInput={onInput}
        >
          <option value="day">день</option>
          <option value="month">месяц</option>
          <option value="year">год</option>
        </select>
      </div>
    </DivNotesBody>
  );
}
